# Idempotency Keys in Payment Processing - Theory & Concepts

## What is Idempotency?

Idempotency means an operation produces the same result regardless of how many times it's executed. In payment processing, this is critical because network failures can cause duplicate charges.

### Example of Idempotency Problem

```
User clicks "Pay" button
         ↓
Request sent to payment processor
         ↓
Network timeout (user doesn't see response)
         ↓
User assumes it failed, clicks again
         ↓
Two charges made instead of one!
```

## Idempotency Keys

An idempotency key is a unique identifier provided by the client that allows the server to recognize and prevent duplicate operations.

### How Idempotency Keys Work

1. **Client generates unique key** (UUID or similar)
2. **Client sends key with request** in `Idempotency-Key` header
3. **Server checks if key exists** in database
4. **If exists**: Return cached result (don't re-process)
5. **If new**: Process request and store result with key
6. **Future requests** with same key get same response

### Timeline Example

```
Request 1 (Idempotency-Key: abc123)
    ↓
Server processes, stores result
    ↓
Returns response

Request 2 (Idempotency-Key: abc123) - 5 seconds later
    ↓
Server finds key in cache
    ↓
Returns cached response (no double charge!)

Request 3 (Idempotency-Key: def456) - Different key
    ↓
Server processes as new request
```

## Why Idempotency is Critical

### Real-World Failure Scenarios

1. **Network timeout** - Request sent but response lost
2. **Client crash** - Browser/app crashes during request
3. **Server error** - Temporary server unavailability
4. **Client retry** - User clicks submit again
5. **Load balancer** - Request routed to different server
6. **Webhook duplicate** - Stripe sends webhook twice

All of these can cause duplicate processing without idempotency keys.

## Implementation Strategy

### 1. Client-Side

```javascript
// Generate unique key
const idempotencyKey = crypto.randomUUID();

// Send with payment request
const response = await fetch('/api/payments', {
  method: 'POST',
  headers: {
    'Content-Type': 'application/json',
    'Idempotency-Key': idempotencyKey
  },
  body: JSON.stringify({
    amount: 10000,
    currency: 'usd',
    customerId: 'cus_123'
  })
});
```

### 2. Server-Side

```javascript
// Check if key already processed
const existing = await db.idempotencyLog.findOne({ 
  idempotencyKey 
});

if (existing) {
  // Return cached result
  return res.status(200).json(existing.response);
}

// Process payment
const result = await processPayment(req.body);

// Store result with key
await db.idempotencyLog.insertOne({
  idempotencyKey,
  response: result,
  createdAt: new Date()
});

res.json(result);
```

## Idempotency Key Storage

### What to Store

```javascript
{
  idempotencyKey: "550e8400-e29b-41d4-a716-446655440000",
  method: "POST",
  path: "/api/payments",
  statusCode: 200,
  response: {
    paymentId: "pay_1234",
    amount: 10000,
    status: "succeeded"
  },
  createdAt: "2024-01-15T10:30:00Z",
  expiresAt: "2024-01-16T10:30:00Z"  // 24 hours
}
```

### Storage Duration

- **24 hours** (default) - Typical retention period
- **At least 24 hours** - Required for PCI compliance
- **Auto-expire** - Delete old entries to save space

### Storage Options

1. **Database** - Persistent, survives restarts
2. **Redis** - Fast, expires automatically with TTL
3. **In-memory** - Lost on restart (not recommended)

## Idempotency Key Properties

### Key Generation

```javascript
// Good: Unique and random
const key = crypto.randomUUID();

// Good: Client-generated timestamp + nonce
const key = `${Date.now()}-${Math.random()}`;

// Bad: Predictable
const key = `user_${userId}`;  // Could be reused

// Bad: Sequential
const key = ++counter;  // Not truly random
```

### Key Validation

- Must be unique (enforced by client)
- Should be random (at least 128 bits of entropy)
- Typically UUID v4 or similar
- Should not contain sensitive data

## HTTP Methods and Idempotency

### Naturally Idempotent Operations

```
GET /api/payments/123        - Safe, returns same data
PUT /api/payments/123 {...}  - Idempotent, replaces resource
DELETE /api/payments/123     - Idempotent, deletes once
```

### Non-Idempotent Operations

```
POST /api/payments {...}     - Creates new resource each time
PATCH /api/payments/123      - Could be non-idempotent
```

**Solution**: POST with Idempotency-Key header

## Advanced Concepts

### Distributed Systems

In microservices architecture, idempotency keys must be:

1. **Shared across services** - Same key for entire request chain
2. **Passed in context** - From service to service
3. **Logged consistently** - All services log the key

```
Client
  ↓ Idempotency-Key: abc123
Payment Service
  ↓ Passes key to...
Billing Service
  ↓ Passes key to...
Notification Service
```

### Handling Idempotency with External APIs

When calling external payment gateways:

```javascript
const response = await stripe.charges.create({
  amount: 10000,
  currency: 'usd',
  customer: customerId
}, {
  idempotencyKey: req.headers['idempotency-key']
});
```

Stripe treats the idempotency key as contract - same key = same request.

## Race Conditions

### Problem: Concurrent Requests with Same Key

```
Request 1 (Key: abc123) at T=0
  Check DB: Key not found
  Start processing...
                          Request 2 (Key: abc123) at T=0.1
                            Check DB: Key not found
                            Start processing...
  Complete, store result
                          Complete, store result (overwrites!)
```

### Solution: Database Uniqueness Constraint

```javascript
// Create unique index
db.idempotencyLog.createIndex({ idempotencyKey: 1 }, { unique: true });

// Use atomic insert with error handling
try {
  await db.idempotencyLog.insertOne({
    idempotencyKey,
    response: result,
    createdAt: new Date()
  });
} catch (err) {
  if (err.code === 11000) {  // Duplicate key
    // Key already exists, retrieve and return
    const existing = await db.idempotencyLog.findOne({ idempotencyKey });
    return res.json(existing.response);
  }
}
```

## Common Patterns

### 1. Upsert Pattern

```javascript
const idempotencyKey = req.headers['idempotency-key'];

// Try to find existing
let record = await db.idempotencyLog.findOne({ idempotencyKey });

if (!record) {
  // Process new request
  const result = await processPayment(req.body);
  
  // Store result
  record = {
    idempotencyKey,
    response: result,
    status: 'completed',
    createdAt: new Date()
  };
  
  await db.idempotencyLog.insertOne(record);
}

return res.json(record.response);
```

### 2. Request Tracking

```javascript
const trackRequest = async (req, res, next) => {
  const key = req.headers['idempotency-key'];
  
  if (!key) {
    return res.status(400).json({ error: 'Idempotency-Key required' });
  }
  
  req.idempotencyKey = key;
  next();
};

app.use(trackRequest);
```

### 3. Cleanup Strategy

```javascript
// Run periodically (e.g., daily)
setInterval(async () => {
  const oneDayAgo = new Date(Date.now() - 24 * 60 * 60 * 1000);
  
  await db.idempotencyLog.deleteMany({
    createdAt: { $lt: oneDayAgo }
  });
}, 24 * 60 * 60 * 1000);
```

## Error Handling with Idempotency

### Case 1: Successful Request, Network Failure on Response

```javascript
// First request: succeeds but response lost
POST /api/payments
  Idempotency-Key: abc123
  Response: 200 (but lost)
  
// Retry with same key
POST /api/payments
  Idempotency-Key: abc123
  Response: 200 (same result from cache)
```

### Case 2: Request Processing Failure

```javascript
// First request: fails during processing
GET db.idempotencyLog where key='abc123'
  → Not found
  → Process request
  → Charge fails: insufficient funds
  → Store error response

// Retry with same key
GET db.idempotencyLog where key='abc123'
  → Found: { status: 'error', error: 'insufficient funds' }
  → Return same error
```

## Testing Idempotency

```javascript
// Test 1: Send 2 identical requests
const key = crypto.randomUUID();

const res1 = await fetch('/api/payments', {
  headers: { 'Idempotency-Key': key },
  body: '{"amount": 5000}'
});
const data1 = await res1.json();

const res2 = await fetch('/api/payments', {
  headers: { 'Idempotency-Key': key },
  body: '{"amount": 5000}'
});
const data2 = await res2.json();

// Both should have same paymentId
assert.equal(data1.paymentId, data2.paymentId);
```

## Real-World Example: Checkout Process

```
User clicks "Complete Purchase"
  ↓
Client generates: Idempotency-Key: uuid()
  ↓
Sends POST /api/orders with key
  ↓
Server checks: key exists?
  ↓
No → Process order & charge
     Store result with key
     Return response
  ↓
Network timeout, client retries with SAME key
  ↓
Server checks: key exists?
  ↓
Yes → Return cached result
      NO double charge
```

## Benefits

✅ Prevents duplicate charges  
✅ Safe to retry requests  
✅ Handles network failures gracefully  
✅ Works with non-idempotent operations (POST)  
✅ Improves reliability without complex logic  

## Summary

1. **Idempotency keys** prevent duplicate operations
2. **Client generates** unique keys
3. **Server checks** before processing
4. **Cache results** with key for future retries
5. **Critical** for payment processing reliability
6. **Standard practice** across payment processors (Stripe, PayPal, etc.)
