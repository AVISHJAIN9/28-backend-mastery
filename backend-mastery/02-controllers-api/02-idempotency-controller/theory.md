# Idempotency: Deep Dive Theory

## Core Principles

### Mathematical Definition
An operation is **idempotent** if applying it multiple times yields the same result as applying it once:

```
f(f(x)) = f(x) = result
f(f(f(x))) = f(x) = result
```

### In REST APIs
- **GET /users/123** - Idempotent (reading doesn't change state)
- **POST /transactions** - NOT idempotent without guards (creates new each time)
- **POST /transactions with Idempotency-Key** - Idempotent (same key = same result)
- **DELETE /users/123** - Idempotent (deleting twice = same final state)
- **PUT /users/123** - Idempotent (replace operation is final state)

## Why Idempotency Matters

### Real-World Failure Scenarios

**Scenario 1: Network timeout retry**
```
Client                          Server
  |--POST /order-->|
  |                |  (Processing... takes 10s)
  | (timeout after 5s)
  |--POST /order-->|  (Retry)
  |                |
  ?                ?--> Without idempotency: Two orders created!
                       With idempotency: Same order returned
```

**Scenario 2: User double-clicked submit**
```
User clicks Submit button
  ↓
JavaScript sends first request
  ↓
User clicks again before response
  ↓
JavaScript sends duplicate request
  ↓
?---> Without idempotency: Two transactions charged!
      With idempotency: Only one transaction processed
```

**Scenario 3: Webhook retry from payment provider**
```
External Service (Stripe, PayPal)
  ↓
Webhook: "Payment succeeded" → Send to your app
  ↓
Your app: 500 Error (temporarily down)
  ↓
Stripe retries webhook after 1 hour
  ↓
?---> Without idempotency: Credit applied twice!
      With idempotency: Same idempotency-key = returns cached response
```

**Scenario 4: Load balancer timeout**
```
Request hits Load Balancer
  ↓
Routed to Server A → Takes too long
  ↓
Load Balancer times out, considers request failed
  ↓
Retries by routing to Server B
  ↓
?---> Without idempotency: Duplicate processing!
      With idempotency: Server B returns cached result from Server A
```

## Idempotency Key Strategy

### Characteristics of a Good Idempotency Key

1. **Unique per request**: UUID v4 or equivalent
2. **Client-generated**: Client owns the key, can retry
3. **User-scoped**: Keys don't cross user boundaries
4. **Immutable**: Same key always = same request
5. **TTL-expired**: 24-48 hours typical (then key can be reused)

### Key Generation Best Practices

```javascript
// ✅ Good: UUID v4 (industry standard)
const key = crypto.randomUUID();
// "550e8400-e29b-41d4-a716-446655440000"

// ✅ Good: Cryptographically secure random
const key = crypto.randomBytes(16).toString('hex');
// "f47ac10b58cc4372a5670e4cn521b862"

// ❌ Bad: Timestamp-based (not unique enough)
const key = Date.now().toString();

// ❌ Bad: Sequential (predictable)
let counter = 0;
const key = `request-${++counter}`;

// ❌ Bad: Hash of form data (users might submit same form)
const key = sha256(JSON.stringify(formData));
```

## Implementation Patterns

### Pattern 1: Simple Cache Hit/Miss

```
Request with Key 'abc'
  ↓
Check database:
  ├─ Record exists + same body hash
  │  → Return cached response (FAST)
  │
  ├─ Record exists + different body hash
  │  → Reject with 422 (prevent cache poisoning)
  │
  └─ Record doesn't exist
     → Process request + cache response
```

### Pattern 2: Handling Request Collision

```
Two concurrent requests with same Key 'abc'
  ↓
Request 1: Starts processing (status = 'processing')
Request 2: Arrives → Sees status 'processing'
  ↓
→ Tell Request 2 to wait (409 Conflict)
→ Eventually serves cached response once completed
```

### Pattern 3: Expiry and Reuse

```
Day 1, 2pm:
  Key 'abc' → Process → Cache response → status = 'completed'

Day 1, 2:05pm:
  Key 'abc' → Return cached response

Day 3, 2:01pm:  (24-hour TTL expired)
  Key 'abc' → NOT FOUND (expired)
  → Can be reused for new request
  → Or generate with DELETE /expired-keys/abc
```

## Data Storage Strategy

### MongoDB Schema Best Practices

```javascript
{
  _id: ObjectId,
  idempotencyKey: String,      // Indexed, unique per user+endpoint
  userId: ObjectId,            // Indexed (find keys per user)
  method: String,              // 'POST', 'PUT', etc
  endpoint: String,            // '/api/transactions'
  
  // Request fingerprint
  requestHash: String,         // SHA256 of request body
  
  // Cached response
  statusCode: Number,
  responseBody: Object,
  responseHeaders: Object,
  
  // Tracking
  status: String,              // 'processing'|'completed'|'failed'
  error: String,
  
  // Lifecycle
  createdAt: Date,
  completedAt: Date,
  expiresAt: Date,             // TTL index
}
```

### Index Strategy

```javascript
// Primary lookup
db.idempotencykeys.createIndex({
  idempotencyKey: 1,
  userId: 1,
  method: 1,
  endpoint: 1
}, { unique: true });

// Find user's keys
db.idempotencykeys.createIndex({
  userId: 1,
  createdAt: -1
});

// Auto-expire old records
db.idempotencykeys.createIndex({
  expiresAt: 1
}, { expireAfterSeconds: 0 });

// Find processing keys
db.idempotencykeys.createIndex({
  status: 1,
  userId: 1
});
```

## Request Hashing for Security

### Why Hash the Request Body?

**Without hashing:**
```
Attacker repeats request with:
  - Same Idempotency-Key
  - Different amount in request body
  - Might get wrong response cached!
```

**With hashing:**
```
Attacker tries different body → Hash doesn't match
→ Server rejects: "Key reused with different request body"
```

### Good Hashing Approach

```javascript
function hashRequest(body) {
  const hash = crypto
    .createHash('sha256')
    .update(JSON.stringify(body))
    .digest('hex');
  
  return hash;
  // "f3e4a5b2c1d0e9f8a7b6c5d4e3f2a1b0..."
}

// This hashes ALL body fields - any change = different hash
// Prevents cache poisoning attacks
```

## Concurrency & Race Conditions

### Problem: Double Processing

```
Thread 1: Check cache → not found
Thread 2: Check cache → not found
         (both pass check simultaneously)
Thread 1: Create record + process
Thread 2: Create record + process
         ❌ Duplicate processing!
```

### Solution: Database Transaction

```javascript
// Atomic: check + insert in one operation
const session = await mongoose.startSession();
session.startTransaction();

try {
  let record = await IdempotencyKey.findOne({key, userId});
  
  if (!record) {
    record = new IdempotencyKey({...});
    await record.save({session});
  }
  
  await session.commitTransaction();
} catch (error) {
  await session.abortTransaction();
}
```

Or use MongoDB's `findOneAndUpdate` with `upsert`:

```javascript
const record = await IdempotencyKey.findOneAndUpdate(
  { idempotencyKey: key, userId },
  {
    $setOnInsert: {
      userId,
      idempotencyKey: key,
      status: 'processing',
      requestHash: hash,
    }
  },
  { upsert: true, new: true }
);
```

## Response Caching Gotchas

### Problem 1: Large Response Bodies
```
If caching responses > 16MB MongoDB limit:
  ❌ Won't fit in document
  ✅ Solution: Compress or store file reference
```

### Problem 2: Time-Sensitive Data
```
Request 1 (Day 1): "Current time is 2pm"
Cache expires after 24 hours
Request 2 (Day 2): Returns "Current time is 2pm" ❌ WRONG
```

Solution: Don't cache time-specific data, or set shorter TTL

### Problem 3: User Permission Changes
```
Request 1: User has access → cache response
User permissions revoked
Request 2: Returns cached response → user sees data they shouldn't! ❌
```

Solution: Add permission check AFTER cache hit, or use shorter TTL for sensitive ops

## Performance Implications

### Cache Hit Performance
```
Fresh request:    500-1000ms (database transaction processing)
Cached response:    20-50ms  (database lookup only)
Speed improvement: 10-20x faster
```

### Storage Overhead
```
100k users × 5 transactions each = 500k records
Average record size: ~2KB
Total storage: ~1GB (very manageable)

Auto-TTL cleanup (24h): Automatic from MongoDB
```

### Network Impact
```
Fresh: 500ms request + processing
Cached: 20ms response
Saves: 480ms per retry
In retry storm: Reduces load by 50-80%
```

## Error Handling Strategy

### Scenarios and Responses

| Scenario | Status | Action |
|---|---|---|
| First request (new key) | 201/200 | Process + cache |
| Retry (same key, same body) | 200 | Return cached |
| Same key, different body | 422 | Reject (cache poisoning) |
| Key still processing | 409 | Wait or retry later |
| Key failed previously | 500 | Return previous error |
| No Idempotency-Key header | 400 | Invalid request |
| Invalid key format | 400 | Invalid UUID |

## When NOT to Use Idempotency

**GET/READ requests**: Already idempotent
- Same read = same result always
- Don't need caching

**DELETE of non-existent resource**: Already idempotent
- DELETE /users/999 twice = same state (deleted)
- Second DELETE can safely return 404 or 200

**Truly stateless operations**: Sometimes
- Generating a random OTP should NOT be idempotent
- Each call should produce new OTP

## Advanced: Multi-Region Idempotency

### Challenge
```
User in USA makes request with Key 'abc'
  → Routed to USA datacenter
  → Cached there
  
User retries quickly
  → Routed to EU datacenter (load balancing / failover)
  → EU doesn't have cache
  → Request processed again ❌
```

### Solution: Distributed Cache
```
Use Redis / Memcached across regions
↓
All datacenters write to same cache
↓
Any region can retrieve cached response
```

Or use distributed databases with replication:
```
MongoDB with replica sets across regions
↓
All servers sync idempotency records
↓
Any server can serve cached response
```

## Summary: Idempotency Checklist

✅ Generate UUID v4 for each request
✅ Send Idempotency-Key in request header
✅ Server validates key format & presence
✅ Compute hash of request body
✅ Check existing record with same key
✅ If match + same hash → return cached
✅ If match + different hash → reject 422
✅ If no match → create 'processing' record
✅ Process request atomically
✅ Cache response with status code
✅ Mark record 'completed'
✅ Set TTL for auto-expiry (24h)
✅ Handle concurrent requests with DB transactions

