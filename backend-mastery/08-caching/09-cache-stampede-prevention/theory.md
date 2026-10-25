# Cache Stampede Prevention

## What is Cache Stampede?

Cache stampede (also called "thundering herd" problem) occurs when many requests arrive simultaneously after cached data expires, causing all of them to query the database at the same time.

**Scenario:**
```
Time T=0:     1000 user requests arrive
              All get cache miss (expired)
              ↓
              All query database simultaneously
              ↓ 
              Database receives 1000 queries ALL AT ONCE
              ↓
              Database locks up, queries timeout
              ↓
              Users see "Error" / timeout
              ↓
              Application crashes ✗
```

**Why it happens:**
- Cached data expires at exact same time T
- Popular content = many concurrent users
- Database can't handle spike of 1000x queries

**The Math:**
```
Normal: 100 users/sec hit database = 100 DB queries/sec (manageable)
Stampede: 100,000 users waiting for cache to refresh
          All hit DB when it expires = 100,000 DB queries/sec (collapse)
```

## Solution 1: Probabilistic Early Expiration (XFetch)

Instead of having everyone wait until exact expiration, one random user fetches fresh data early.

```javascript
// XFetch Algorithm
async function getCachedData(key, ttl = 3600) {
  const cached = await redis.get(key);
  
  if (!cached) {
    // Cache miss - first load
    const data = await expensiveQuery();
    await redis.setex(key, ttl, JSON.stringify(data));
    return data;
  }
  
  const cacheData = JSON.parse(cached);
  const cachedTime = parseInt(await redis.get(`${key}:time`));
  const age = Date.now() - cachedTime;
  
  // Probabilistic: Chance of early refresh increases as cache ages
  const delta = ttl - age;  // Time until expiration
  const beta = 1.0;  // Tuning factor
  
  // P(refresh) increases as delta decreases
  const refreshProbability = beta * Math.log(Math.random()) / (-delta / ttl);
  
  if (refreshProbability > 0) {
    // This request refreshes cache (only 1 in ~delta/ttl will)
    refreshInBackground(() => expensiveQuery())
      .then(data => {
        redis.setex(key, ttl, JSON.stringify(data));
        redis.setex(`${key}:time`, ttl, Date.now().toString());
      });
    
    // Return stale data immediately
    return cacheData;
  }
  
  return cacheData;
}

// Background refresh
async function refreshInBackground(fn) {
  return new Promise((resolve) => {
    setImmediate(async () => {
      try {
        const data = await fn();
        resolve(data);
      } catch (err) {
        console.error('Background refresh failed:', err);
        resolve(null);
      }
    });
  });
}
```

**Pros:**
- Single request refreshes cache
- Others hit cache (fresh or soon-to-be-fresh)
- Prevents stampede entirely
- Transparent to client

**Cons:**
- Some requests get slightly stale data
- Probability calculation is tricky
- Can create thundering "background refreshes" (minor)

## Solution 2: Distributed Lock with Refresh

When cache expires, first request gets lock and refreshes. Others wait for new data.

```javascript
async function getDataWithLock(key, ttl = 3600) {
  const cached = await redis.get(key);
  
  if (cached) {
    return JSON.parse(cached);  // Hit
  }
  
  // Cache miss - try to acquire refresh lock
  const lockKey = `${key}:lock`;
  const lockValue = Date.now().toString();
  
  const acquired = await redis.set(
    lockKey,
    lockValue,
    'EX', 10,  // Lock expires after 10 seconds
    'NX'       // Only if not exists
  );
  
  if (acquired) {
    // I got the lock - I'll refresh
    try {
      const data = await expensiveQuery();
      await redis.setex(key, ttl, JSON.stringify(data));
      // Delete lock
      const luaScript = `
        if redis.call('get', KEYS[1]) == ARGV[1] then
          return redis.call('del', KEYS[1])
        else
          return 0
        end
      `;
      await redis.eval(luaScript, 1, lockKey, lockValue);
      return data;
    } catch (err) {
      // Failed to refresh - release lock
      await redis.del(lockKey);
      throw err;
    }
  } else {
    // Someone else has lock - wait for them to refresh
    const maxWait = 5000;  // Wait up to 5 seconds
    const startTime = Date.now();
    
    while (Date.now() - startTime < maxWait) {
      const newData = await redis.get(key);
      if (newData) {
        return JSON.parse(newData);  // They refreshed, use new data
      }
      
      // Wait a bit and try again
      await new Promise(r => setTimeout(r, 100));
    }
    
    // Timeout - no fresh data available
    throw new Error('Cache refresh timeout');
  }
}
```

**Pros:**
- Clear coordinator (one request does work)
- Clients get fresh guaranteed
- Works well with thundering herd
- Simple logic

**Cons:**
- Lock failure = slow request
- Waiting clients blocked
- Timeout possible

## Solution 3: Stale-While-Revalidate (Hybrid)

Serve stale cache immediately, refresh in background asynchronously.

```javascript
async function getDataStaleWhileRevalidate(key, ttl = 3600, maxStale = 600) {
  const cached = await redis.get(key);
  const timestamp = parseInt(await redis.get(`${key}:time`)) || 0;
  const age = Date.now() - timestamp;
  
  if (!cached) {
    // No cache - fetch fresh
    const data = await expensiveQuery();
    await redis.setex(key, ttl, JSON.stringify(data));
    await redis.setex(`${key}:time`, ttl, Date.now().toString());
    return data;
  }
  
  // Cache exists
  if (age < ttl) {
    // Still fresh
    return JSON.parse(cached);
  }
  
  // Cache is stale (age >= ttl)
  if (age < ttl + maxStale) {
    // Still within maxStale window - serve stale + refresh background
    
    // Start background refresh (non-blocking)
    refreshAsync(key, ttl);
    
    // Return stale data immediately
    return JSON.parse(cached);
  }
  
  // Beyond maxStale - must fetch fresh
  const data = await expensiveQuery();
  await redis.setex(key, ttl, JSON.stringify(data));
  await redis.setex(`${key}:time`, ttl, Date.now().toString());
  return data;
}

async function refreshAsync(key, ttl) {
  // Use background job or promise
  setImmediate(async () => {
    try {
      const data = await expensiveQuery();
      await redis.setex(key, ttl, JSON.stringify(data));
      await redis.setex(`${key}:time`, ttl, Date.now().toString());
      console.log(`Refreshed cache for ${key}`);
    } catch (err) {
      console.error(`Failed to refresh ${key}:`, err.message);
    }
  });
}
```

**Pros:**
- Clients get instant response (stale data)
- Clean background refresh
- Best UX (no waiting)
- Graceful degradation

**Cons:**
- Clients briefly see old data
- No guarantee of freshness
- Background refresh might fail

## Comparison

| Strategy | Speed | Freshness | Complexity | Ideal For |
|----------|-------|-----------|-----------|-----------|
| **XFetch** | Excellent | Good | Medium | High-traffic APIs |
| **Locks** | Good | Excellent | Medium | Critical data |
| **Stale-While-Revalidate** | Excellent | Medium | Low | UX-focused apps |

## Real-World Implementation

```javascript
// Hybrid strategy: Use stale-while-revalidate with lock fallback

async function getProduct(id) {
  // Strategy 1: Try stale-while-revalidate
  const data = await getDataStaleWhileRevalidate(
    `product:${id}`,
    3600,    // 1 hour TTL
    600      // 10 minutes allowed staleness
  );
  
  if (data) return data;
  
  // Strategy 2: If beyond maxStale, use lock
  return await getDataWithLock(`product:${id}`, 3600);
}
```

## Monitoring

```javascript
// Detect cache stampedes
async function detectStampede() {
  // Track DB query spikes
  const queriesPerSecond = await getQueryRate();
  const normalRate = 100;
  const threshold = normalRate * 10;  // 10x normal
  
  if (queriesPerSecond > threshold) {
    console.warn(`⚠️ Possible stampede detected: ${queriesPerSecond} QPS`);
    await redis.incr('stampede:count');
    
    // Alert ops team
    sendAlert('Cache stampede detected!');
  }
}

// Monitor lock wait times
const lockWaitTime = await redis.get('lock:wait:time');
if (lockWaitTime > 1000) {  // 1 second wait
  console.warn(`Lock wait time high: ${lockWaitTime}ms`);
}
```

## Key Concepts Summary

| Concept | How It Works | When To Use |
|---------|-------------|-----------|
| **XFetch** | Probabilistically refresh early | Predictable traffic |
| **Locks** | Coordinate single refresh | Small datasets |
| **Stale-While-Revalidate** | Serve stale immediately | UX critical |
| **TTL Tuning** | Shorter TTL = more refreshes | Balance cost/freshness |
| **Monitoring** | Watch for QPS spikes | Always |

## Best Practices

1. **Always have a timeout** - Don't wait forever for lock
2. **Monitor your cache** - Track hit rates, refresh times
3. **Test under load** - Use load testing before production
4. **Use appropriate TTL** - Not too short (wasted refreshes), not too long (stale risk)
5. **Combine strategies** - Use XFetch + fallback to locks
6. **Cache warming** - Pre-populate popular data
7. **Graceful degradation** - If refresh fails, serve stale

## When Each Strategy Breaks Down

**XFetch breaks when:**
- You need guaranteed freshness
- Probability distribution is skewed

**Locks break when:**
- Lock holders crash
- Refresh is very slow (1+ minute)

**Stale-While-Revalidate breaks when:**
- Data must be current (financial transactions)
- Staleness window is tiny (<1 second)

Choose based on your requirements!