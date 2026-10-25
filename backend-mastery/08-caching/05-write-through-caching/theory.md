# Write-Through Caching - Module 08.5

## Introduction

**Write-through caching** is a strategy where you write to the cache first, then immediately write to the database. This ensures the cache is always up-to-date and becomes the single source of truth.

Unlike cache-aside (which loads on miss), write-through is write-optimized: every write operation goes through the cache layer.

### Problem It Solves

In cache-aside:
```
1. Write to database
2. Invalidate cache
3. Next read hits database, repopulates cache

Result: Write is slow, cache empty after invalidation
```

In write-through:
```
1. Write to cache
2. Write to database (in background)
3. Next read hits cache immediately

Result: Writes are fast, cache always populated
```

---

## Part 1: Write-Through Concepts

### Model: Synchronous Write-Through

Write to cache and database synchronously (wait for both):

```javascript
async function updateUser(userId, updates) {
  try {
    // 1. Write to cache first (fast!)
    const cacheKey = `user:${userId}`;
    await redis.set(cacheKey, JSON.stringify(updates));
    
    // 2. Write to database (slower)
    const dbResult = await db.users.update({ id: userId }, updates);
    
    // Both succeeded
    return dbResult;
  } catch (error) {
    // If DB fails, cache is already updated (inconsistent!)
    // Solution: Rollback cache
    await redis.del(cacheKey);
    throw error;
  }
}

// Latency: cache write (1ms) + DB write (100ms) = 101ms
```

### Model: Asynchronous Write-Through

Write to cache synchronously, database asynchronously:

```javascript
async function updateUser(userId, updates) {
  const cacheKey = `user:${userId}`;
  
  // 1. Write to cache (fast)
  await redis.set(cacheKey, JSON.stringify(updates));
  
  // 2. Write to DB in background (fire-and-forget)
  db.users.update({ id: userId }, updates)
    .catch(error => {
      logger.error('DB write failed:', error);
      // DB failed but cache has new data!
      // Solution: Revert cache or queue retry
      redis.del(cacheKey);
    });
  
  // Return immediately
  return updates;
}

// Latency: cache write only (1ms)
// But risk: DB failure after cache write
```

---

## Part 2: Write-Through Patterns

### Pattern 1: Cache-First (Synchronous)

Write cache first, then database, both synchronous:

```javascript
async function writeThrough(key, value) {
  try {
    // 1. Write to cache
    await cache.set(key, value);
    
    // 2. Write to database
    await db.insert(key, value);
    
    return { success: true, value };
  } catch (error) {
    // If DB fails, rollback cache
    await cache.del(key);
    throw error;
  }
}
```

**Latency:** cache + database writes (both synchronous)
**Consistency:** Guaranteed (rollback on failure)
**Use case:** Critical data where sequence matters

---

### Pattern 2: Cache-Async (Fire-and-Forget)

Write cache synchronously, database asynchronously:

```javascript
async function writeThroughAsync(key, value) {
  // 1. Write to cache immediately
  await cache.set(key, value);
  
  // 2. Queue DB write for later
  const task = {
    operation: 'write',
    key,
    value,
    timestamp: Date.now()
  };
  
  // Queue for background processing
  queue.push(task);
  
  // Return to client immediately
  return { success: true, value };
}

// Background worker
async function processQueue() {
  while (queue.length > 0) {
    const task = queue.shift();
    
    try {
      await db.insert(task.key, task.value);
    } catch (error) {
      // DB write failed - revert cache
      logger.error('DB write failed:', error);
      await cache.del(task.key);
      queue.push(task);  // Retry later
    }
  }
}
```

**Latency:** cache write only (~1ms)
**Consistency:** Eventually consistent (DB may fail)
**Use case:** High-performance writes, acceptable staleness

---

### Pattern 3: Write-Behind with Batch

Batch multiple writes before syncing to database:

```javascript
const writeBuffer = [];
const BATCH_SIZE = 100;
const BATCH_INTERVAL = 5000;  // 5 seconds

async function writeThrough(key, value) {
  // 1. Write to cache
  await cache.set(key, value);
  
  // 2. Add to write buffer
  writeBuffer.push({ key, value });
  
  // 3. Flush if batch full
  if (writeBuffer.length >= BATCH_SIZE) {
    await flushWrites();
  }
}

async function flushWrites() {
  if (writeBuffer.length === 0) return;
  
  const batch = writeBuffer.splice(0, BATCH_SIZE);
  
  try {
    // Write all data in single transaction
    await db.transaction(async (trx) => {
      for (const { key, value } of batch) {
        await trx.insert(key, value);
      }
    });
  } catch (error) {
    // Transaction failed - revert cache for all keys
    for (const { key } of batch) {
      await cache.del(key);
    }
    writeBuffer.unshift(...batch);  // Re-queue
  }
}

// Timer for periodic flush
setInterval(flushWrites, BATCH_INTERVAL);
```

**Latency:** cache write (~1ms)
**Throughput:** High (batches reduce DB round trips)
**Consistency:** Eventually consistent

---

## Part 3: Read-Through vs Write-Through

### Read-Through Pattern

Read from cache. On miss, read from database and populate cache.

```javascript
async function readThrough(key) {
  // 1. Try cache
  const cached = await cache.get(key);
  if (cached) return cached;
  
  // 2. Cache miss - read from DB
  const value = await db.get(key);
  
  // 3. Populate cache
  await cache.set(key, value);
  
  return value;
}

// Call flow:
// First call: cache miss → DB hit → cache populated
// Second call: cache hit → ~1000x faster
```

### Write-Through Pattern

Always write to cache first, then database.

```javascript
async function writeThrough(key, value) {
  // 1. Always write cache first
  await cache.set(key, value);
  
  // 2. Then write database
  await db.set(key, value);
  
  return value;
}

// Call flow:
// Every write: cache + DB (both updated)
// Reads always hit cache (no misses)
```

### Combined Read/Write

```javascript
const cacheStore = {
  async read(key) {
    const cached = await cache.get(key);
    if (cached) return cached;
    
    const value = await db.get(key);
    await cache.set(key, value);
    return value;
  },
  
  async write(key, value) {
    await cache.set(key, value);
    await db.set(key, value);
  }
};

// Usage:
await cacheStore.write('user:1', userData);  // Write through
const user = await cacheStore.read('user:1');  // Read from cache
```

---

## Part 4: Write-Through Trade-offs

### Advantages

1. **Cache always populated** - No cache misses after writes
2. **Simple consistency model** - Cache and DB stay in sync
3. **High performance on reads** - Always cache hits
4. **Single source of truth** - Cache is authoritative

### Disadvantages

1. **Slower writes** - Must wait for cache AND database
2. **Rollback complexity** - Cache fails? Undo DB write somehow
3. **Database overhead** - Every write hits database (no caching)
4. **Race conditions** - What if DB first succeeds, then cache fails?

---

## Part 5: Common Mistakes

### Mistake 1: Forgetting to Handle Cache Failure

```javascript
// ❌ Bad: Assume cache write always succeeds
async function writeThrough(key, value) {
  await cache.set(key, value);  // Could fail!
  const result = await db.set(key, value);
  return result;
}

// If cache fails, DB still updates, but cache missed the write!
// Next read: cache miss → DB hit → slow

// ✅ Good: Check and rollback
async function writeThrough(key, value) {
  try {
    await cache.set(key, value);
  } catch (cacheError) {
    // Cache failed - don't continue to DB
    throw cacheError;
  }
  
  try {
    const result = await db.set(key, value);
    return result;
  } catch (dbError) {
    // DB failed - rollback cache!
    await cache.del(key);
    throw dbError;
  }
}
```

---

### Mistake 2: Database Write Fails But Cache Succeeds

```javascript
// ❌ Bad: Cache updated but DB not
async function writeThrough(key, value) {
  await cache.set(key, value);
  await db.set(key, value);  // Fails!
  
  // Cache has new value, DB has old value
  // Inconsistency!
}

// ✅ Good: Revert cache on DB failure
async function writeThrough(key, value) {
  // Store old value for potential rollback
  const old = await cache.get(key);
  
  try {
    await cache.set(key, value);
    await db.set(key, value);
  } catch (dbError) {
    // Revert cache to old value
    if (old) {
      await cache.set(key, old);
    } else {
      await cache.del(key);
    }
    throw dbError;
  }
}
```

---

### Mistake 3: Reading During Write

```javascript
// ❌ Bad: Race condition
async function write(key, value) {
  await cache.set(key, value);  // 1ms
  // ← Client reads here, gets new value
  await db.set(key, value);  // 100ms
}

async function read(key) {
  return await cache.get(key);
}

// Timeline:
// 0ms: write() → cache.set()
// 0ms: read() → cache.hit → returns NEW value
// 100ms: write() → db.set() completes
// If db.set() fails, cache has NEW but DB has OLD

// ✅ Good: Use transactions or versioning
async function write(key, value, version) {
  const newVersion = version + 1;
  
  // Atomic update
  await cache.set(`${key}:v${newVersion}`, value);
  await db.set(key, { value, version: newVersion });
  
  // Old readers still use old version
  // New readers use new version
  // No corruption
}
```

---

### Mistake 4: Skipping Write-Through On "Performance"

```javascript
// ❌ Bad: "Write-through is slow, skip database sometimes"
let usedCache = false;

async function optimize(key, value) {
  if (usedCache) {
    // Cache worked before, skip DB this time
    await cache.set(key, value);
    return;
  }
  
  await cache.set(key, value);
  await db.set(key, value);
  usedCache = true;
}

// Result: Database eventually out of sync with cache!
// Inconsistency!
```

---

### Mistake 5: Using Wrong Invalidation with Write-Through

```javascript
// ❌ Bad: Invalidating cache in write-through
async function write(key, value) {
  await cache.set(key, value);
  await db.set(key, value);
  
  // MISTAKE: Invalidate after write!
  await cache.del(key);  // Why?!
  
  // Next read hits empty cache, goes to DB
  // Defeats purpose of write-through!
}

// ✅ Good: Never invalidate in write-through
async function write(key, value) {
  await cache.set(key, value);
  await db.set(key, value);
  // Leave cache as-is (already up-to-date)
}
```

---

## Part 6: Write-Through Comparison Table

| Aspect | Write-Through | Write-Behind | Write-Around |
|--------|---------------|--------------|--------------|
| **Write Latency** | cache + DB | cache only | DB only |
| **Cache Consistency** | Always fresh | Eventually fresh | Might be stale |
| **DB Consistency** | Guaranteed | Eventual | Guaranteed |
| **Best For** | Critical data | High volume writes | Read-heavy |
| **Risk** | Slow writes | Data loss risk | Cache misses |

---

## Part 7: Implementation

### Basic Write-Through

```javascript
class CacheStore {
  constructor(cache, db) {
    this.cache = cache;
    this.db = db;
  }
  
  async write(key, value) {
    try {
      // Cache first
      await this.cache.set(key, JSON.stringify(value));
      
      // Then database
      await this.db.query(
        'INSERT INTO data (key, value) VALUES (?, ?)',
        [key, JSON.stringify(value)]
      );
      
      return { success: true };
    } catch (error) {
      // Rollback cache
      await this.cache.del(key);
      throw error;
    }
  }
  
  async read(key) {
    // Try cache first
    const cached = await this.cache.get(key);
    if (cached) return JSON.parse(cached);
    
    // Miss - read from DB
    const result = await this.db.query(
      'SELECT value FROM data WHERE key = ?',
      [key]
    );
    
    if (result) {
      // Populate cache
      await this.cache.set(key, result.value);
      return JSON.parse(result.value);
    }
    
    return null;
  }
}
```

---

## Part 8: Implementation Checklist

- [ ] Understand write-through latency impact (slower writes)
- [ ] Decide: synchronous or asynchronous database writes
- [ ] Implement rollback logic for cache/DB failures
- [ ] Handle race conditions during concurrent writes
- [ ] Use versioning or timestamps for consistency
- [ ] Implement retry logic for failed database writes
- [ ] Add monitoring for cache/DB divergence
- [ ] Log all write-through operations
- [ ] Test failure scenarios (cache fails, DB fails)
- [ ] Measure write latency impact
- [ ] Consider batching writes to database
- [ ] Set up alerts for cache/DB mismatch

---

## Conclusion

Write-through caching is ideal when:
- **Cache hit rate is critical** (reads must be fast)
- **Consistency is paramount** (cache and DB must match)
- **Write latency is acceptable** (can wait for both)
- **Data is authoritative in cache** (cache is source of truth)

Write-through is NOT ideal when:
- **Writes are very frequent** (becomes bottleneck)
- **Database writes are slow** (adds latency to everything)
- **Accept eventual consistency** (missing updates tolerable)

Next: **Module 08.6: Bloom Filters** - Probabilistic data structure for membership testing and cache efficiency.
