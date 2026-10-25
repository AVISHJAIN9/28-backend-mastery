# Idempotency Controller

## 📋 File Creation Order (DO THIS FIRST)

Build files in this exact sequence:

| Order | File | Why | Size |
|-------|------|-----|------|
| **1** | `schema.js` | Data model needed by everything | ~60 lines |
| **2** | `middleware.js` | Core logic that protects endpoints | ~150 lines |
| **3** | `controller.js` | Business logic endpoints | ~180 lines |
| **4** | `.env.example` | Configuration reference | ~20 lines |
| **5** | `routes.js` | Wire it all together | ~50 lines |
| **6** | `README.md` | Documentation ✓ (you're reading) | |
| **7** | `setup.md` | Installation guide | |
| **8** | `theory.md` | Deep dive concepts | |
| **9** | `preview.html` | Interactive demo ✓ (done) | |
| **10** | `App.jsx` | Optional React UI | |

---

## What is this?

**Idempotency** means that making the same API request multiple times produces the same result as making it once. It's a critical pattern for building reliable systems, especially when dealing with payment processing, order creation, and other operations that must never be duplicated.

## Why does it matter?

### Real-world scenarios where duplicate requests happen:
- **Network failures**: Client retries on timeout
- **User impatience**: User clicks "Submit" multiple times
- **Webhook retries**: External services retry failed webhooks
- **Load balancer timeouts**: Request gets reprocessed by different server
- **Race conditions**: Multiple processes submit same transaction

Without idempotency guards, you might:
❌ Charge the customer twice
❌ Create duplicate orders
❌ Send multiple emails
❌ Process the same webhook event twice

## How does it work?

### The Idempotency Key Pattern:

1. **Client sends a unique `Idempotency-Key` header**
   ```
   POST /api/transactions
   Idempotency-Key: 550e8400-e29b-41d4-a716-446655440000
   ```

2. **Server checks if we've seen this key before**
   - If YES & same request body → return cached response immediately
   - If YES & different body → reject (prevent cache poisoning)
   - If NO & currently processing → tell client to wait
   - If NO & new → process and cache the response

3. **Response is cached with TTL** (24 hours default)
   - Any identical request gets the cached response
   - After TTL, key can be reused

## What's implemented here?

### Key Components:

**schema.js** - MongoDB model storing:
- Idempotency key
- Request hash (detects body mutations)
- Cached response (status, body, headers)
- Processing status (processing/completed/failed)
- TTL expiry (auto-delete after 24h)

**middleware.js** - Idempotency enforcer:
- Validates Idempotency-Key header format
- Checks for duplicate requests
- Detects cache poisoning attempts
- Intercepts response and saves to cache

**controller.js** - Example endpoints:
- `POST /transactions` - Create payment transaction
- `POST /orders` - Create order
- `POST /webhooks/events` - Handle webhooks
- `PATCH /subscriptions/:id` - Update subscription
- `POST /auth/password-reset` - Request password reset

## Request Examples

### ✅ First request (server processes):
```bash
curl -X POST http://localhost:5000/api/transactions \
  -H "Idempotency-Key: 550e8400-e29b-41d4-a716-446655440000" \
  -H "Authorization: Bearer token" \
  -H "Content-Type: application/json" \
  -d '{"amount": 100, "recipientId": "user123"}'
```

### ✅ Retry with same key (server returns cached response instantly):
```bash
curl -X POST http://localhost:5000/api/transactions \
  -H "Idempotency-Key: 550e8400-e29b-41d4-a716-446655440000" \
  -H "Authorization: Bearer token" \
  -H "Content-Type: application/json" \
  -d '{"amount": 100, "recipientId": "user123"}'

# Returns: Same response as first request (same transaction ID, timestamp)
```

### ❌ Retry with same key but different body (rejected):
```bash
curl -X POST http://localhost:5000/api/transactions \
  -H "Idempotency-Key: 550e8400-e29b-41d4-a716-446655440000" \
  -H "Authorization: Bearer token" \
  -H "Content-Type: application/json" \
  -d '{"amount": 200, "recipientId": "user456"}'

# Returns: 422 Unprocessable Entity - "Idempotency key reused with different request body"
```

## Best Practices

1. **Always use UUID v4 or similar** for Idempotency-Key
2. **Client generates the key** (not server)
3. **Same user context** - don't share keys across users
4. **TTL management** - 24 hours is typical for financial transactions
5. **Retry logic** - exponential backoff with jitter
6. **Logging** - track cache hits vs fresh requests
7. **Monitoring** - alert on high cache hit rates (might indicate retry storms)

## Common Use Cases

| API Operation | Idempotency Important? | Why? |
|---|---|---|
| Create payment transaction | ✅ CRITICAL | Never charge twice |
| Create order | ✅ CRITICAL | Prevent duplicate orders |
| Handle webhook events | ✅ CRITICAL | External services retry |
| Update subscription plan | ✅ HIGH | Billing impact |
| Send password reset email | ✅ HIGH | Spam prevention only once |
| Update user profile | ⚠️ MEDIUM | Data consistency |
| Read data | ❌ NO | Idempotent by nature |

## Performance Considerations

- **Cache hit overhead**: ~10-50ms (database lookup)
- **Fresh request**: ~100-500ms (actual processing)
- **Response caching**: Reduces database/external API load by 30-50% in retry scenarios

---

## How it Works (Step by Step)

### Fresh Request Flow
```
Client                                Server
  |
  |--POST /api/transactions----------->|
  |   Idempotency-Key: abc123          |
  |   Body: {amount: 100}              |
  |                                      |
  |                              Check database
  |                              Key 'abc123' not found
  |                              Create record: status='processing'
  |                              
  |                              Process request
  |                              Generate transaction ID
  |                              
  |                              Save response to cache
  |                              Update record: status='completed'
  |                              
  |<----------201 Created-------------|
  |   transaction: {id: txn_123, ...}  |
```

### Retry with Same Key (Cached)
```
Client                                Server
  |
  |--POST /api/transactions----------->|
  |   Idempotency-Key: abc123          |
  |   Body: {amount: 100}              |
  |                                      |
  |                              Check database
  |                              Key 'abc123' found
  |                              Status = 'completed'
  |                              Return cached response
  |                              
  |<----------201 Created-------------|
  |   transaction: {id: txn_123, ...}  | ⚡ SAME as before!
```

---

## Key Concepts

### 1. **Idempotency Key**
- UUID v4: `550e8400-e29b-41d4-a716-446655440000`
- Client generates it (not server)
- Unique per user per distinct operation
- Sent in `Idempotency-Key` header

### 2. **Request Hashing**
- SHA256 hash of request body
- Prevents cache poisoning (same key, different body = rejected)
- Example:
  ```javascript
  hash('{"amount": 100}') 
  = 'f3e4a5b2c1d0e9f8a7b6c5d4e3f2a1b0...'
  ```

### 3. **Response Caching**
- Status code cached
- Response body cached
- Headers cached (for CORS, etc.)
- TTL: 24 hours default (then key expires)

### 4. **Status Tracking**
- `processing` - Request currently being handled
- `completed` - Request finished successfully
- `failed` - Request encountered an error

### 5. **Atomic Operations**
- Check + Insert in single database operation
- Prevents race conditions with concurrent requests
- Two requests with same key never execute twice

---

## Common Mistakes ❌

### Mistake 1: Server Generates Idempotency Key
```javascript
// ❌ WRONG - Server generated
app.post('/api/transactions', (req, res) => {
  const key = crypto.randomUUID(); // Server creates it
  // Client doesn't know the key for retries!
});

// ✅ CORRECT - Client sends it
// Client: 
//   POST /api/transactions
//   Idempotency-Key: (client-generated UUID)
```
**Impact**: Client can't retry with same key, defeating the purpose!

### Mistake 2: Not Validating Key Format
```javascript
// ❌ WRONG
const key = req.headers['idempotency-key'];
// Could be: "123", "abc", any random string
// Not guaranteed unique

// ✅ CORRECT
function isValidIdempotencyKey(key) {
  const uuidPattern = /^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/i;
  return uuidPattern.test(key);
}
```
**Impact**: Non-unique keys cause duplicate processing!

### Mistake 3: Caching Different Request Bodies with Same Key
```javascript
// ❌ WRONG - No request hashing
Request 1: POST /transactions with key=abc, body={amount: 100}
Request 2: POST /transactions with key=abc, body={amount: 500}
// Returns cached response from Request 1 with wrong amount!

// ✅ CORRECT - Hash the body
const hash = sha256(JSON.stringify(body));
if (record.requestHash !== hash) {
  return res.status(422).json({error: 'Key reused with different body'});
}
```
**Impact**: Security vulnerability (cache poisoning attack)!

### Mistake 4: Not Waiting for In-Flight Requests
```javascript
// ❌ WRONG - Returns conflict immediately
if (record.status === 'processing') {
  return res.status(409).json({error: 'In progress'});  
}

// ✅ CORRECT - Wait briefly or queue
if (record.status === 'processing') {
  // Option 1: Tell client to retry
  return res.status(409).json({error: 'Retry in 2 seconds'});
  
  // Option 2: Wait for completion (with timeout)
  await waitForCompletion(record, 30000); // 30s timeout
}
```
**Impact**: Race conditions with concurrent identical requests!

### Mistake 5: Short TTL for High-Volume Operations
```javascript
// ❌ WRONG - Key expires too fast
expiresAt: new Date(Date.now() + 1 * 60 * 1000) // 1 minute

// ✅ CORRECT - Appropriate TTL
// Payment transactions: 24 hours
// Email sending: 1 hour  
// Webhook processing: 48 hours
```
**Impact**: Key reused for different request = duplicate processing!

### Mistake 6: User Context Not Validated
```javascript
// ❌ WRONG - No user isolation
db.findOne({idempotencyKey: key})
// User A could reuse User B's key!

// ✅ CORRECT - Include userId
db.findOne({
  idempotencyKey: key,
  userId: req.user.id
})
```
**Impact**: Cross-user cache access (security issue)!

### Mistake 7: Not Using Transactions for Race Conditions
```javascript
// ❌ WRONG - Non-atomic
const exists = await IdempotencyKey.findOne({key});
if (!exists) {
  // Between check and insert, another thread might insert!
  await IdempotencyKey.create({key, ...});
}

// ✅ CORRECT - Atomic operation
const record = await IdempotencyKey.findOneAndUpdate(
  {idempotencyKey: key, userId},
  {$setOnInsert: {status: 'processing', ...}},
  {upsert: true, new: true}
);
```
**Impact**: Double processing with concurrent requests!

---

## Real-World Usage

### Use Case 1: Payment Processing (Stripe)

```javascript
// Frontend
const idempotencyKey = crypto.randomUUID();

const paymentResponse = await fetch('/api/payments', {
  method: 'POST',
  headers: {
    'Idempotency-Key': idempotencyKey,
    'Authorization': `Bearer ${token}`,
  },
  body: JSON.stringify({
    amount: 9999, // $99.99
    currency: 'usd',
    source: 'tok_visa'
  })
});

// Why: If network fails, retrying with same key ensures
// the customer is charged only once, not twice!
```

### Use Case 2: Order Creation (E-commerce)

```javascript
// Frontend
const orderId = generateOrderId();
const lineItems = cartItems.map(item => ({
  productId: item.id,
  quantity: item.qty,
  price: item.price
}));

const orderResponse = await fetch('/api/orders', {
  method: 'POST',
  headers: {
    'Idempotency-Key': `order-${orderId}`,
  },
  body: JSON.stringify({
    lineItems,
    shippingAddress,
    paymentMethod
  })
});

// Why: Prevents duplicate orders if user double-clicks
// "Place Order" or network retries
```

### Use Case 3: Webhook Processing (Stripe Events)

```javascript
// Backend webhook handler
app.post('/webhooks/stripe', idempotencyMiddleware, async (req, res) => {
  // Stripe sends same event multiple times
  // Idempotency key = stripe event ID
  // Same event processed only once, idempotent!
  
  const event = req.body;
  const idempotencyKey = event.id; // stripe event id
  // Middleware ensures this is cached
  
  if (event.type === 'charge.succeeded') {
    // Activate subscription
    // Called multiple times = same result
  }
});
```

### Use Case 4: Subscription Billing

```javascript
// Plan change should only charge once
const updateSubscription = await fetch(
  `/api/subscriptions/${subId}`,
  {
    method: 'PATCH',
    headers: {
      'Idempotency-Key': `plan-change-${Date.now()}`,
    },
    body: JSON.stringify({
      plan: 'premium',
      billingCycle: 'annual'
    })
  }
);

// If payment fails mid-processing:
// - Retry with same key → same result
// - User not charged twice
// - Subscription updated once
```

### Use Case 5: Password Reset (Email Prevention)

```javascript
// Prevent sending 100 reset emails when user clicks repeatedly
app.post('/auth/password-reset', idempotencyMiddleware, async (req, res) => {
  const {email} = req.body;
  
  // Idempotency Key = hash of email + "password-reset"
  // Same email reset request = same email sent
  // But can only send 1 email (idempotent!)
  
  const token = generateResetToken();
  await sendPasswordResetEmail(email, token);
  
  res.json({message: 'Check your email'});
});
```

### Use Case 6: Multi-Step Transactions

```javascript
// Transfer money between accounts
// Must be atomic: debit + credit only once

const transfer = await fetch('/api/transfers', {
  method: 'POST',
  headers: {
    'Idempotency-Key': `transfer-${transferId}`,
  },
  body: JSON.stringify({
    fromAccountId: 'acc_123',
    toAccountId: 'acc_456',
    amount: 50000
  })
});

// Idempotency ensures:
// - Money debited only once from 'from' account
// - Money credited only once to 'to' account
// - Both operations happen atomically
```

---

## Monitoring & Debugging

### Key Metrics to Track

```javascript
// 1. Cache hit ratio
cacheHitRatio = cacheHits / totalRequests
// Target: 5-10% normal, 30-50% during outages

// 2. Average response time (cached vs fresh)
avgCachedTime = 20ms
avgFreshTime = 500ms

// 3. Idempotency key reuse rate
reuseRate = retries / totalRequests
// If > 40%, might indicate client retry issues

// 4. Failed requests cached
failureRate = failedRequests / totalRequests
```

### Debug Queries

```javascript
// Find all keys for a user
db.idempotencykeys.find({userId: ObjectId("...")})

// Find in-progress requests (might be stuck)
db.idempotencykeys.find({status: 'processing', createdAt: {$lt: Date.now() - 60000}})

// Find most-used keys (indicates retries)
db.idempotencykeys.aggregate([
  {$group: {_id: '$idempotencyKey', count: {$sum: 1}}},
  {$sort: {count: -1}},
  {$limit: 10}
])

// Calculate average response time by status
db.idempotencykeys.aggregate([
  {$group: {
    _id: '$status',
    avgTime: {$avg: {$subtract: ['$completedAt', '$createdAt']}}
  }}
])
```

---

## Next Steps

1. ✅ You have `schema.js`, `middleware.js`, `controller.js` - **Done!**
2. 📖 Read `setup.md` for installation
3. 🧪 Try the `preview.html` demo to understand flow
4. 📚 Study `theory.md` for deep concepts
5. 🚀 Integrate with your actual payment/order systems
6. 📊 Set up monitoring and alerting
7. 🔐 Add authorization checks in middleware
