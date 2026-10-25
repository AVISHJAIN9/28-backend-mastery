# Write-Through Caching Pattern

## Quick Start

### 1. Install Dependencies
```bash
npm install
```

### 2. Start Redis Server
```bash
redis-server
```

### 3. Run the Server
```bash
npm run dev
```

### 4. Open the Web UI
Navigate to `http://localhost:6405` in your browser.

---

## What is Write-Through Caching?

**Write-through** caching writes **cache first, then database**. The key difference from write-around or write-behind:

- **Write-Around:** Write directly to DB, skip cache (slow reads after writes)
- **Write-Through:** Write cache AND DB together (consistent, slower writes)
- **Write-Behind:** Write cache, defer DB (fast writes, risky)

### Two Models:

1. **Synchronous Write-Through**
   - Write to cache (1ms)
   - Wait for DB to write (100ms)
   - Return to user after BOTH succeed (~101ms)
   - Rollback cache if DB fails

2. **Asynchronous Write-Through**
   - Write to cache (1ms)
   - Queue DB write, return immediately (~5ms)
   - Background worker processes queue
   - Risk: If app crashes, loss of queued writes

---

## Architecture

### Write-Through Flow (Synchronous)

```
Client Request
    ↓
Write to Cache (Redis) [1ms]
    ↓
Write to Database [100ms]
    ↓
✓ Both successful → Return 200 OK
✗ DB failed → Rollback cache → Return 500 Error
```

### Write-Through Flow (Asynchronous)

```
Client Request
    ↓
Write to Cache (Redis) [1ms]
    ↓
Queue DB Write to Queue
    ↓
Return 202 Accepted [~5ms total]
    ↓
Background Worker
  Process Queue Item
  Write to Database [100ms]
  Remove from queue
```

---

## API Reference

### 1. **POST /api/write/sync** - Synchronous Write-Through
Write to both cache and database, wait for both to complete.

**Request:**
```json
{
  "key": "user:1",
  "value": {"name": "John", "email": "john@example.com"}
}
```

**Response (Success):**
```json
{
  "success": true,
  "key": "user:1",
  "value": {"name": "John"},
  "cacheLatency": 1,
  "dbLatency": 98,
  "totalLatency": 101,
  "strategy": "synchronous-write-through"
}
```

**Use Cases:**
- Financial transactions (must be consistent)
- Inventory updates (no overbooking)
- User profile updates (critical consistency)

---

### 2. **POST /api/write/async** - Asynchronous Write-Through
Write to cache, queue DB write, return immediately.

**Request:**
```json
{
  "key": "product:123",
  "value": {"name": "Laptop", "price": 999}
}
```

**Response:**
```json
{
  "success": true,
  "key": "product:123",
  "cacheLatency": 1,
  "totalLatency": 4,
  "queuedForDatabase": true,
  "strategy": "asynchronous-write-through",
  "note": "Data written to cache, DB write queued"
}
```

**Use Cases:**
- Analytics/logging (eventual consistency OK)
- Notifications (can lag)
- Social media updates (fire-and-forget)

---

### 3. **GET /api/read/:key** - Read with Caching
Read from cache first, fallback to DB if miss.

**Example:** `GET /api/read/user:1`

**Response (Cache Hit):**
```json
{
  "success": true,
  "key": "user:1",
  "value": {"name": "John"},
  "source": "cache",
  "latency": 1,
  "note": "CACHE HIT"
}
```

**Response (Cache Miss):**
```json
{
  "success": true,
  "key": "user:1",
  "value": {"name": "John"},
  "source": "database",
  "latency": 102,
  "note": "CACHE MISS - populated from DB"
}
```

---

### 4. **POST /api/compare/latency** - Performance Comparison
Run 100 reads from cache vs database to compare latency.

**Request:**
```json
{
  "key": "user:1",
  "value": {"name": "John"}
}
```

**Response:**
```json
{
  "success": true,
  "test": "100 reads each",
  "cache": {
    "totalTime": 150,
    "avgLatency": "1.50ms"
  },
  "database": {
    "totalTime": 10500,
    "avgLatency": "105.00ms"
  },
  "speedup": "70.0x faster",
  "note": "Cache ~1000x faster than DB!"
}
```

---

### 5. **POST /api/failure/cache-fail** - Simulate Cache Failure
Test behavior when cache write fails.

**Consequence:**
- DB is updated
- Cache is empty
- Next read is slow (cache miss)
- Then cache is repopulated

---

### 6. **POST /api/failure/db-fail** - Simulate Database Failure
Test behavior when database write fails.

**Consequence:**
- Cache write is rolled back
- Data not persisted
- User sees error 500
- Must retry write

---

### 7. **GET /api/queue/status** - Check Write Queue
Get status of asynchronous write queue.

**Response:**
```json
{
  "queueSize": 2,
  "isProcessing": true,
  "pendingWrites": [
    {"key": "user:2", "value": {...}, "queuedAt": 1234567890}
  ]
}
```

---

### 8. **GET /api/metrics** - Get Metrics
View all performance metrics, hit rates, latencies.

**Response:**
```json
{
  "writes": {
    "sync": 10,
    "async": 5,
    "failed": 1
  },
  "reads": {
    "cacheHit": 42,
    "cacheMiss": 8,
    "hitRate": "84.0%"
  },
  "latencies": {
    "avgCacheLatency": "1.23ms",
    "avgDbLatency": "98.45ms",
    "avgTotalWriteLatency": "99.68ms"
  },
  "recentWrites": [...]
}
```

---

### 9. **POST /api/clear** - Clear All Data
Delete all keys from cache and database.

---

### 10. **POST /api/metrics/reset** - Reset Metrics
Clear all performance metrics.

---

## Key Concepts

### Synchronous Write-Through
- **Pros:**
  - Guaranteed consistency (cache == DB)
  - No race conditions
  - Simple to reason about
  
- **Cons:**
  - Slow writes (100+ ms per operation)
  - User waits for slowest component (DB)
  - Resource intensive (2 writes per operation)

### Asynchronous Write-Through
- **Pros:**
  - Fast returns to user (5ms)
  - Cache always populated
  - Good for non-critical data
  
- **Cons:**
  - DB lag (cache ahead of DB)
  - Can lose in-flight writes if app crashes
  - More complex error handling

### Cache Hit Rate
- Sync writes: Always populate cache → high hit rate
- Read misses: 1st read is slow, subsequent are fast
- Better hit rate = faster average response time

---

## Real-World Scenarios

### Scenario 1: E-commerce Product Updates
```
Customer updates product price: $99 → $89
├─ Cache updated immediately (code sees $89)
├─ DB write queued (asynchronous)
└─ Other instances see old price until DB synced

Risk: Inventory counts wrong momentarily
Solution: Use synchronous write-through for inventory
```

### Scenario 2: User Profile Change
```
User changes profile picture: John's photo → Jane's photo
├─ Cache updated (instant)
├─ Profile service sees new photo
├─ DB write in progress
└─ If server crashes before DB write: Revert cache

Solution: Synchronous write-through for consistency
```

### Scenario 3: Analytics Logging
```
Track user click: user:123 clicked button X
├─ Increment counter in cache
├─ Queue analytics event (low priority)
└─ Return immediately

Eventual consistency OK → asynchronous write-through
```

---

## Common Mistakes & How to Avoid Them

### Mistake 1: Forgetting Cache Failure Handling
```javascript
// ❌ WRONG - no rollback if DB fails
await redis.set(key, value);
await db.update(key, value);  // If this fails, cache is dirty

// ✅ RIGHT - rollback on failure
try {
  await redis.set(key, value);
  await db.update(key, value);
} catch (error) {
  await redis.del(key);  // Rollback
  throw error;
}
```

### Mistake 2: DB Succeeds But Cache Fails
```javascript
// ❌ WRONG - inconsistency: DB has data, cache doesn't
await db.update(key, value);
await redis.set(key, value);  // Connection lost

// ✅ RIGHT - write cache first (fail fast)
await redis.set(key, value);
await db.update(key, value);
```

### Mistake 3: Reading Cache During Write
```javascript
// ❌ WRONG - sees partial write
client.readCache(key);  // Could see old data
client.writeThrough(key, value);
client.readCache(key);  // Different result

// ✅ RIGHT - use version numbers
let data = readCache(key);
if (data && data.version === expectedVersion) {
  // Safe to use
}
```

### Mistake 4: Skipping Write-Through Entirely
```javascript
// ❌ WRONG - using write-around (writes skip cache)
await db.update(key, value);  // Cache not updated
// Next reads are slow cache misses

// ✅ RIGHT - always update cache
await redis.set(key, value);
await db.update(key, value);
```

### Mistake 5: Wrong Invalidation with Write-Through
```javascript
// ❌ WRONG - cache has new data, delete it!
await redis.set(key, value);     // Update cache
await redis.delete(key);         // Wrong! Just deleted it
await db.update(key, value);     // Only DB has data

// ✅ RIGHT - just update
await redis.set(key, value);
await db.update(key, value);
// Don't delete!
```

---

## Comparison Table

| Feature | Write-Through | Write-Behind | Write-Around |
|---------|---------------|-------------|------------|
| **Cache Fresh** | Always | Yes | No |
| **Write Speed** | Slow (100+ ms) | Fast (1-5 ms) | Slow (100+ ms) |
| **Data Risk** | Low | High | N/A |
| **Read Speed** | Fast (all hits) | Fast | Slow (misses) |
| **Use Case** | Critical data | Logs, analytics | Read-heavy |
| **Example** | Inventory | Metrics | News feed |

---

## Implementation Checklist

- [ ] Implement cache failure rollback
- [ ] Handle database connection failures
- [ ] Add logging for all write operations
- [ ] Monitor cache hit rate
- [ ] Track write latencies (cache + DB)
- [ ] Implement retry logic for failed writes
- [ ] Test cache-DB inconsistency scenarios
- [ ] Use version numbers for conflict detection
- [ ] Add request tracing (request ID through logs)
- [ ] Set appropriate cache TTLs
- [ ] Implement metrics dashboard
- [ ] Load test with concurrent writes
- [ ] Document all failure modes
- [ ] Plan for data migration strategies

---

## Testing the Module

### Manual Testing:
1. Start server and open UI
2. Run synchronous write (expect 100+ ms)
3. Run asynchronous write (expect 5-10 ms)
4. Compare latency of 100 reads
5. Trigger cache failure scenario
6. Trigger database failure scenario
7. Monitor metrics dashboard

### Performance Benchmarks:
- Synchronous writes: 100-110 ms (1ms cache + 100ms DB + overhead)
- Asynchronous writes: 5-10 ms (1ms cache + queue + return)
- Cache reads: 1-2 ms
- Database reads: 100-110 ms
- Cache speedup: ~70x

---

## Further Reading

- [Write-Through vs Write-Behind Caching](https://en.wikipedia.org/wiki/Cache_(computing)#Write-through)
- [Redis Persistence](https://redis.io/docs/management/persistence/)
- [Dealing with Failure Modes](https://en.wikipedia.org/wiki/Fault_tolerance)
