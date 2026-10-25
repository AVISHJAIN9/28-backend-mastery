# Module 03: Distributed Locks - Redis SETNX & Redlock

## Overview

Distributed locks coordinate concurrent operations across single or multiple server instances. This module demonstrates two critical patterns:

1. **SETNX (Single-Instance)** - Atomic lock acquisition for single server
2. **Redlock (Multi-Instance)** - Fault-tolerant locking across distributed systems

## Why Distributed Locks?

### The Race Condition Problem

```javascript
// WITHOUT LOCK - RACE CONDITION
const processTransaction = async (txId) => {
  const tx = await db.getTransaction(txId);  // Read 1
  
  // Another request sneaks in here and also reads the same transaction
  
  tx.count += 1;                              // Modify
  await db.updateTransaction(txId, tx);      // Write 1
  
  // Result: Multiple concurrent requests increment the same transaction
  // Expected: count = 5
  // Actual: count = 1 (lost updates!)
};

// If 5 requests arrive simultaneously:
// All read (count = 0)
// All increment to 1
// All write back (count = 1)
```

### Why it Matters

- **Financial Systems:** Duplicate charges, lost payments
- **Inventory:** Over-allocation of stock
- **Distributed Transactions:** Double-processing
- **Consensus:** Multiple leaders claiming authority

## SETNX Pattern (Single Instance)

Redis SETNX sets a key **only if it doesn't exist** - atomic at the Redis protocol level.

### How It Works

```javascript
// 1. Attempt to acquire lock
const locked = await redis.set(
  'lock:user-123',
  '1',
  'PX',      // milliseconds
  5000,      // TTL - auto-expires if process crashes
  'NX'       // Only set if Not eXists
);

if (!locked) {
  return res.status(409).json({ error: 'Locked' });
}

try {
  // 2. Critical section - only one process here
  const user = await db.getUser(123);
  user.credits -= 10;
  await db.updateUser(123, user);
  // No race condition here!
} finally {
  // 3. Always release lock
  await redis.del('lock:user-123');
}
```

### Guarantees

✅ **Atomic** - Metal ballot box at Redis level  
✅ **Simple** - No setup complexity  
❌ **Single-Instance Only** - Works on one Redis server  
❌ **No Failover** - If Redis crashes, locks persist in memory (use TTL!)

### Real-World Use

- Single backend server
- Scheduled job deduplication
- File upload processing
- API idempotency keys

## Redlock Pattern (Multi-Instance)

Redlock extends SETNX across multiple Redis instances for fault tolerance.

### How It Works

```javascript
// Redlock automatically:
// 1. Acquires lock on majority of instances (e.g., 3 of 5)
// 2. If majority succeeds → lock granted
// 3. If majority fails → all instances released (no partial locks)
// 4. Periodically extends lock (lock extension)
// 5. Releases on all instances when done

const redlock = new Redlock([redis1, redis2, redis3], {
  driftFactor: 0.01,        // Account for clock skew
  retryCount: 3,            // Retry 3 times
  retryDelay: 200,          // Wait 200ms between retries
  automaticExtensionThreshold: 500  // Auto-extend if <500ms left
});

try {
  const lock = await redlock.lock('resource', 15000);
  // Critical section
} catch (error) {
  if (error instanceof Redlock.LockError) {
    // Failed to get majority
    return res.status(409).json({ error: 'Locked' });
  }
} finally {
  await lock.unlock();
}
```

### Guarantees

✅ **Atomic** - Majority consensus required  
✅ **Fault-Tolerant** - Survives single Redis instance failure  
✅ **Multi-Instance** - Works across distributed systems  
❌ **Clock Requirements** - Assumes <100ms clock skew

### When to Use Redlock

- **Microservices:** Lock once, safe everywhere
- **Kubernetes:** Pod replicas running same code
- **Load Balanced:** Multiple servers behind balancer
- **Distributed Jobs:** Background workers coordinate

## Lock Extension / TTL Refresh

For long-running operations, refresh the lock TTL periodically:

```javascript
const startTime = Date.now();

// Extend lock every 2 seconds while operation runs
const interval = setInterval(async () => {
  if (Date.now() - startTime > operationTimeout) {
    clearInterval(interval);
    return;
  }
  
  // Refresh TTL to 15 more seconds
  await redis.pexpire('lock:resource', 15000);
  
}, 5000);

try {
  // Long-running operation (up to 30 seconds)
  await processLargeDataset();
} finally {
  clearInterval(interval);
  await redis.del('lock:resource');
}
```

### Why Extension Matters

**Scenario:** Processing 100,000 records takes 30 seconds

```
Lock acquired (TTL = 5 seconds)
├─ 0-5s:  Processing... ✅
├─ 5s:    Lock expires! ⚠️
├─ 5-12s: Another process acquires lock ❌
│        Both processes now running!
└─ 30s:  First process completes (data corrupted)
```

**Solution:** Extend TTL every 5 seconds
```
Lock acquired (TTL = 15 seconds)
├─ 0-5s:   Processing... ✅ (extend to 15s)
├─ 5-10s:  Processing... ✅ (extend to 15s)
├─ 10-15s: Processing... ✅ (extend to 15s)
├─ 15-20s: Processing... ✅ (extend to 15s)
└─ 30s:    Completed ✅ (lock released)
```

## 409 Conflict Response

When a lock is held, return **HTTP 409 Conflict**:

```javascript
try {
  const lock = await tryLock('batch-payment-' + jobId);
} catch (error) {
  if (error.code === 'LOCK_UNAVAILABLE') {
    return res.status(409).json({
      error: 'Resource locked',
      retry_after: 2,  // Tell client to try again in 2 seconds
      message: 'Another process is currently handling this operation'
    });
  }
}
```

Client behavior:
```javascript
const response = await fetch('/api/process', { method: 'POST' });

if (response.status === 409) {
  // Back off and retry
  await new Promise(r => setTimeout(r, response.retryAfter * 1000));
  return await fetch('/api/process', { method: 'POST' });
}
```

## Common Lock Patterns

### 1. Idempotency Key Lock

```javascript
const idempotencyKey = req.headers['x-idempotency-key'];
const lock = await redlock.lock(`idempotency:${idempotencyKey}`, 30000);

const existing = await db.checkIdempotency(idempotencyKey);
if (existing) {
  return res.json(existing.response); // Return cached
}

// Process and cache result
const result = await processRequest(req);
await db.saveIdempotency(idempotencyKey, result);
```

### 2. Resource Quota Lock

```javascript
const lock = await setnx(`quota:user-${userId}`, '1', { ttl: 3600 });

if (!lock) {
  return res.status(429).json({ error: 'Rate limit exceeded' });
}

const used = await redis.incr(`quota:count:${userId}`);
if (used > 100) {
  return res.status(429).json({ error: 'Quota exceeded' });
}
```

### 3. Distributed Cache Stampede Prevention

```javascript
// Multiple servers fetching same expensive data
const lock = await redlock.lock(`cache:expensive-query`, 5000);

let data = cache.get('expensive-query');
if (!data) {
  // First server queries DB, others wait
  data = await db.expensiveQuery();
  cache.set('expensive-query', data, 60);
}

return res.json(data);
```

## Lock Troubleshooting

### Issue: "Connection Refused"
```
Error: connect ECONNREFUSED 127.0.0.1:6379
```
**Solution:** Start Redis
```bash
redis-server
# or via Docker
docker run -d -p 6379:6379 redis:latest
```

### Issue: Lock Not Releasing
```javascript
// WRONG - lock stuck forever
const lock = await redlock.lock('key', 60000);
// Process fails, lock never released!

// CORRECT - always release
try {
  const lock = await redlock.lock('key', 60000);
  // Process
} finally {
  await lock.unlock();
}
```

### Issue: Clock Skew in Distributed Systems
```
Redlock failure: Clock skew > 100ms between servers
```
**Solution:** Use NTP (Network Time Protocol)
```bash
# Linux
timedatectl set-ntp true
ntpdate -s time.nist.gov

# macOS
sudo sntp -sS time.nist.gov
```

## Best Practices

1. **Always Use Try/Finally**
   ```javascript
   try {
     const lock = await acquireLock();
     // process
   } finally {
     await lock.release();
   }
   ```

2. **Set Appropriate TTL**
   - Too short: Lock expires during operation
   - Too long: Delayed recovery if process crashes
   - Rule of thumb: 2x expected operation duration

3. **Monitor Lock Contention**
   ```javascript
   logger.warn('Lock contention detected', {
     lock_key: key,
     failed_attempts: 5,
     retry_duration: 2000
   });
   ```

4. **Use Exponential Backoff**
   ```javascript
   for (let i = 0; i < maxRetries; i++) {
     const lock = await tryLock();
     if (lock) return lock;
     await sleep(Math.pow(2, i) * 100); // 100ms, 200ms, 400ms...
   }
   ```

5. **Return 409 for Locked Resources**
   - Allows client to implement smart retry logic
   - Better than returning 500 (server error)
   - Include `retry_after` header

## Testing Strategies

### 1. Test Concurrent Requests
```javascript
// Send 10 requests simultaneously to same resource
const promises = Array(10).fill(null).map(() =>
  fetch('/api/process', { method: 'POST' })
);

const results = await Promise.all(promises);
const successful = results.filter(r => r.status === 200).length;
const conflicts = results.filter(r => r.status === 409).length;

assert.equal(successful, 1, 'Only 1 should succeed');
assert.equal(conflicts, 9, 'Other 9 should get 409');
```

### 2. Test Lock Expiry
```javascript
// Verify lock auto-releases after TTL
const lock = await acquireLock(1000); // 1 second TTL
await sleep(1100);

const secondLock = await acquireLock();
assert.ok(secondLock, 'Lock should auto-release');
```

### 3. Test Failure Recovery
```javascript
// Simulate process crash (no cleanup)
const lock = await acquireLock();
// Process crashes here - never calls unlock()

await sleep(ttl + 100);

// System should recover
const newLock = await acquireLock();
assert.ok(newLock, 'System should recover from crash');
```

## Anti-Patterns to Avoid

❌ **Not releasing locks in error cases**
```javascript
const lock = await acquireLock();
if (!data) throw new Error('Data not found'); // Lock never released!
```

✅ **Proper error handling**
```javascript
let lock;
try {
  lock = await acquireLock();
  if (!data) throw new Error('Data not found');
} finally {
  if (lock) await lock.unlock();
}
```

❌ **Setting TTL too long**
```javascript
const lock = await acquireLock({ ttl: 3600000 }); // 1 hour
// Process crashes, system stuck for an hour
```

✅ **Reasonable TTL**
```javascript
const lock = await acquireLock({ ttl: 30000 }); // 30 seconds
// Process crashes, system recovers in 30 seconds
```

## Real-World Scenarios

### Scenario 1: Payment Processing
```javascript
// Prevent double-charging
const txId = req.body.transaction_id;
const lock = await redlock.lock(`payment:${txId}`, 10000);

const existing = await db.getPayment(txId);
if (existing && existing.status === 'completed') {
  return res.json(existing); // Already processed, return result
}

// Process payment
const payment = await payment_gateway.charge($100);
await db.savePayment(txId, payment);
```

### Scenario 2: Cache Warming
```javascript
// Multiple servers warming cache simultaneously
const lock = await redlock.lock('cache:warming', 60000);

// First server warms, others wait
const data = await expensiveQuery();
cache.set('expensive-data', data, 3600);

// All servers have warm cache => fast responses
```

### Scenario 3: Batch Job Coordination
```javascript
// Ensure only one server processes batch
const lock = await redlock.lock('batch:daily-summary', 3600000);

const today = new Date().toDateString();
const existing = await db.getSummary(today);

if (!existing) {
  // Process batch
  await processAllUserData();
}

// Other servers detect batch already done, skip
```

## Comparison: Lock Strategies

| Feature | SETNX | Redlock | Pessimistic Lock | Optimistic Lock |
|---------|-------|---------|------------------|-----------------|
| **Complexity** | Simple | Medium | Complex | Simple |
| **Fault Tolerance** | No | Yes | N/A | N/A |
| **Performance** | Fast | Fast | Slow | Very Fast |
| **Contention** | 409 errors | 409 errors | Blocking | Retries |
| **Use Case** | Single server | Distributed | Complex txns | Read-heavy |

## Setup & Testing

### Prerequisites
- Node.js 14+
- Redis 4.0+
- React 18+

### Installation
```bash
cd 03-distributed-locks-redis-setnx-redlock
npm install
```

### Start Backend
```bash
npm start
# Server on http://localhost:4003
```

### Start Frontend
```bash
npm run dev
# Frontend on http://localhost:5173
```

### Test Endpoints

**Vulnerable (No Lock):**
```bash
curl -X POST http://localhost:4003/api/vulnerable/process-transaction \
  -H "Content-Type: application/json" \
  -d '{"transaction_id":"TX-001","amount":500}'
```

**Secure (SETNX Lock):**
```bash
curl -X POST http://localhost:4003/api/secure/process-transaction \
  -H "Content-Type: application/json" \
  -d '{"transaction_id":"TX-001","amount":500,"lock_ttl":5000}'
```

**Advanced (Redlock):**
```bash
curl -X POST http://localhost:4003/api/advanced/batch-payment \
  -H "Content-Type: application/json" \
  -d '{"job_id":"BATCH-001","payments":[{"payee_id":"USER-1","amount":100}],"lock_ttl":15000}'
```

**Resource Allocation:**
```bash
curl -X POST http://localhost:4003/api/advanced/allocate-resource \
  -H "Content-Type: application/json" \
  -d '{"resource_name":"inventory","quantity":50,"duration_ms":3000}'
```

## Next Steps

- Module 04: Feature Flags
- Module 05: Configuration Management
- Module 11: Dependency Injection (for testable locks)
