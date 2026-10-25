# Module 08.2: Cache-Aside Pattern

## What is Cache-Aside?

**Cache-Aside** (also called **Look-Aside** or **Lazy-Loading**) is the most common caching pattern. The application is responsible for managing the cache interaction:

1. **Check Cache** - Try to get data from Redis
2. **On Miss** - Fetch from database if not in cache
3. **Update Cache** - Store the database result in Redis with TTL
4. **Return Data** - Serve to client

**Flow:**
```
Client Request
    ↓
Check Redis Cache?
    ├─ HIT  → Return immediately (fast!)
    └─ MISS → Fetch from Database
              → Store in Redis (TTL)
              → Return to Client
```

## Why Cache-Aside?

### Advantages
✅ **Simple** - Easy to implement, minimal code changes  
✅ **Flexible** - Cache any data type, any TTL  
✅ **No Double Writes** - Unlike write-through  
✅ **Gradual Loading** - Cache fills naturally  
✅ **Easy Invalidation** - Just delete the key  

### Disadvantages
❌ **Cache Misses** - First request pays full DB latency  
❌ **Stale Data** - Outdated cache until TTL expires  
❌ **Stampede Problem** - Multiple requests hit DB simultaneously  
❌ **Manual Invalidation** - Must track cache keys  

## Implementation Pattern

### Basic Pattern
```javascript
async function getUser(userId) {
  const cacheKey = `user:${userId}`;
  
  // 1. Check cache
  const cached = await redis.get(cacheKey);
  if (cached) return JSON.parse(cached);
  
  // 2. Cache miss - fetch DB
  const user = await db.users.findById(userId);
  
  // 3. Update cache
  if (user) {
    await redis.setEx(cacheKey, 3600, JSON.stringify(user));
  }
  
  return user;
}
```

### With Error Handling
```javascript
async function getUser(userId) {
  const cacheKey = `user:${userId}`;
  
  try {
    // Try cache
    const cached = await redis.get(cacheKey);
    if (cached) return JSON.parse(cached);
  } catch (err) {
    logger.warn('Cache read error', { error: err.message });
  }

  // Fetch from DB
  const user = await db.users.findById(userId);
  
  // Update cache (don't fail request if cache fails)
  if (user) {
    redis.setEx(cacheKey, 3600, JSON.stringify(user))
      .catch(err => logger.warn('Cache write error'));
  }
  
  return user;
}
```

### With Metrics
```javascript
const metrics = { hits: 0, misses: 0, errors: 0 };

async function getUser(userId) {
  const cacheKey = `user:${userId}`;
  
  try {
    const cached = await redis.get(cacheKey);
    if (cached) {
      metrics.hits++;
      return JSON.parse(cached);
    }

    metrics.misses++;
    const user = await db.users.findById(userId);
    
    if (user) {
      await redis.setEx(cacheKey, 3600, JSON.stringify(user));
    }
    
    return user;
  } catch (error) {
    metrics.errors++;
    throw error;
  }
}

function getHitRatio() {
  const total = metrics.hits + metrics.misses;
  return total === 0 ? 0 : (metrics.hits / total * 100).toFixed(2) + '%';
}
```

## Cache Stampede Problem

**The Problem:** When cache expires, multiple simultaneous requests all see miss, all hit database.

```
Time T: User 1, 2, 3 request user:123
        Cache miss for all 3
        All 3 query database
        3x database load!
```

### Solution 1: Locking
```javascript
async function getUser(userId) {
  const cacheKey = `user:${userId}`;
  const lockKey = `lock:${cacheKey}`;
  
  const cached = await redis.get(cacheKey);
  if (cached) return JSON.parse(cached);

  // Try to acquire lock
  const lockAcquired = await redis.set(lockKey, '1', {
    EX: 5, NX: true
  });

  if (lockAcquired) {
    // We got lock - fetch DB
    const user = await db.users.findById(userId);
    await redis.setEx(cacheKey, 3600, JSON.stringify(user));
    return user;
  } else {
    // Wait for lock holder to fill cache
    await new Promise(r => setTimeout(r, 100));
    const cached = await redis.get(cacheKey);
    if (cached) return JSON.parse(cached);
    
    // Timeout - fall back to DB
    return db.users.findById(userId);
  }
}
```

### Solution 2: Probabilistic Early Refresh
```javascript
async function getUser(userId) {
  const cacheKey = `user:${userId}`;
  const cached = await redis.get(cacheKey);
  
  if (cached) {
    const data = JSON.parse(cached);
    
    // If close to expiration, refresh in background
    const ttl = await redis.ttl(cacheKey);
    if (ttl > 0 && ttl < 360) {  // < 10 min left
      refreshUserAsync(userId);  // Non-blocking
    }
    
    return data;
  }

  // Cache miss
  const user = await db.users.findById(userId);
  await redis.setEx(cacheKey, 3600, JSON.stringify(user));
  return user;
}
```

### Solution 3: Staggered TTL
```javascript
// Different keys expire at different times
function getCacheKey(userId) {
  return `user:${userId}`;
}

function getTTL(userId) {
  // Hash user ID for consistent but random TTL
  const hash = userId.charCodeAt(0) % 600;  // 0-600 sec variance
  return 3300 + hash;  // 3300-3900 seconds
}

const ttl = getTTL(userId);
await redis.setEx(cacheKey, ttl, JSON.stringify(user));
```

## TTL Strategies

### Fixed TTL
```javascript
await redis.setEx(cacheKey, 3600, value);  // 1 hour
```

### Variable by Data Type
```javascript
const ttlMap = {
  'user': 3600,        // 1 hour
  'product': 86400,    // 1 day
  'exchange': 60,      // 1 minute
};

const ttl = ttlMap[type] || 1800;
await redis.setEx(cacheKey, ttl, value);
```

### Sliding Window (Extend if Active)
```javascript
const ttl = await redis.ttl(cacheKey);
if (ttl > 0) {
  // Extend for active data
  await redis.expire(cacheKey, 3600);
}
```

## Common Mistakes (6 Categories)

### 1. No Fallback on Cache Failure
**❌ Problem:** Cache error = request fails
```javascript
const user = await redis.get(...) || await db.get(...);
```

**✅ Fix:** Database fallback, save stale copy
```javascript
try {
  const cached = await redis.get(cacheKey);
  if (cached) {
    // Also save stale copy for emergencies
    redis.setEx(`stale:${cacheKey}`, 86400, cached);
    return JSON.parse(cached);
  }
} catch (err) {
  const stale = await redis.get(`stale:${cacheKey}`);
  if (stale) {
    logger.warn('Serving stale data');
    return JSON.parse(stale);
  }
}

const user = await db.users.findById(userId);
return user;
```

### 2. Caching Errors
**❌ Problem:** Error cached, served forever
```javascript
const user = await db.find(id);
await redis.set(cacheKey, user);  // Caches null/undefined!
```

**✅ Fix:** Cache only successful results
```javascript
const user = await db.users.findById(userId);
if (user) {
  await redis.setEx(cacheKey, 3600, JSON.stringify(user));
}
return user;
```

### 3. Forgetting Cache Invalidation
**❌ Problem:** Update DB, forget to clear cache
```javascript
await db.users.update(userId, updates);
// Oops - cache still has old data!
```

**✅ Fix:** Invalidate all related keys
```javascript
await db.users.update(userId, updates);
await redis.del(`user:${userId}`);
await redis.del(`user:profile:${userId}`);
await redis.del(`user:settings:${userId}`);
```

### 4. Ignoring Consistency
**❌ Problem:** Cache stale but no one knows
```javascript
const cached = await redis.get(cacheKey);
```

**✅ Fix:** Track versions/timestamps
```javascript
const cached = await redis.get(cacheKey);
if (cached) {
  const data = JSON.parse(cached);
  const dbVersion = await db.getVersion(userId);
  
  if (data.version < dbVersion) {
    // Cache is stale, refresh
    return fetchFromDB(userId);
  }
}
```

### 5. No Warmup on Startup
**❌ Problem:** App starts cold, cache empty
```javascript
app.listen(3000);  // All requests miss cache
```

**✅ Fix:** Pre-populate critical data
```javascript
async function startup() {
  const hotUsers = [1, 2, 3, 4, 5];
  
  for (const uid of hotUsers) {
    const user = await db.users.findById(uid);
    await redis.setEx(
      `user:${uid}`,
      3600,
      JSON.stringify(user)
    );
  }
  
  app.listen(3000);
}
```

### 6. Large Object Serialization
**❌ Problem:** 10MB object slows cache operations
```javascript
const user = await db.users.findById(userId);
await redis.setEx(cacheKey, 3600, JSON.stringify(user));
```

**✅ Fix:** Cache only needed fields
```javascript
const cacheData = {
  id: user.id,
  name: user.name,
  email: user.email,
  role: user.role
  // Omit large fields
};

await redis.setEx(cacheKey, 3600, JSON.stringify(cacheData));
```

## Real-World Failures

### Incident 1: Black Friday Stampede
**Company:** E-commerce  
**Problem:** 50k users, all product caches expire same time, database crashes  
**Root Cause:** Fixed TTL from startup, no jitter  
**Fix:** Staggered expiration using hash of key

### Incident 2: Stale Permissions
**Company:** SaaS  
**Problem:** User promoted to admin, but cache shows old role  
**Root Cause:** Forgot to invalidate cache on update  
**Fix:** Event-driven invalidation

### Incident 3: Replica Lag
**Company:** Social network  
**Problem:** Cache reads from read replica (2s lag), new follows don't appear  
**Root Cause:** Read-through from replica  
**Fix:** Read from master for critical data

### Incident 4: Memory Explosion
**Company:** Analytics  
**Problem:** Cache server out of memory, Redis crashes  
**Root Cause:** No maxmemory policy, unbounded growth  
**Fix:** Set limit and eviction policy

### Incident 5: Wrong Key Invalidation
**Company:** Payments  
**Problem:** Batch job updates prices, clears wrong keys  
**Root Cause:** Cache key format change, invalidation not updated  
**Fix:** Centralized cache key factory

## Implementation Checklist

- [ ] Basic cache-aside (check → miss → fetch → store)
- [ ] Error handling for cache and database failures
- [ ] Appropriate TTL per data type
- [ ] Invalidation strategy on data updates
- [ ] Stampede handling (locking or early refresh)
- [ ] Hit/miss ratio monitoring (target >80%)
- [ ] Stale-data fallback during database failure
- [ ] Cache warmup on application startup
- [ ] Metrics for all cache operations
- [ ] Maxmemory and eviction policy configured
- [ ] Test scenarios: cache failure, DB failure, network partition
- [ ] Documentation of cache keys and TTLs

## Conclusion

Cache-Aside is simple but requires discipline. Fast reads require accepting stale data. Stampede and invalidation are where most teams stumble. Master these, and you've mastered web-scale caching.

**Key Takeaway:** Cache-Aside = fast reads + stale data + manual invalidation. Own all three.

**Next Module:** 08.3 - Cache Invalidation (keeping cache fresh)
