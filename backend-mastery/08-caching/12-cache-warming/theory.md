# Cache Warming: Theory & Concepts

## What is Cache Warming?

Cache warming is the process of proactively populating a cache with data **before** it's requested by users or applications. Instead of waiting for a cache miss and then loading data on-demand (lazy loading), cache warming fills the cache with frequently-accessed data beforehand.

### Why Cache Warming Matters

1. **Eliminates Cold Cache Problem**: New deployments or cache restarts face a "cold start" where all requests miss the cache, causing database overload
2. **Prevents Thundering Herd**: Without warming, multiple users requesting the same missing data simultaneously trigger a cache stampede
3. **Improves User Experience**: First users after restart experience fast response times instead of slow database queries
4. **Predictable Performance**: Known data is pre-cached, reducing request latency variability

### Real-World Example: E-commerce Platform

```
Cold Cache (Bad):
User 1 → App → Cache MISS → DB (slow) → 500ms
User 2 → App → Cache MISS → DB (overloaded) → 2000ms
User 3 → App → Cache MISS → DB (locks) → 5000ms

Warmed Cache (Good):
User 1 → App → Cache HIT → 10ms
User 2 → App → Cache HIT → 10ms
User 3 → App → Cache HIT → 10ms
```

---

## Cache Warming Strategies

### 1. **Startup Preloading**

Load critical data into cache when application boots.

**Best For:**
- Small dataset of essential data (users, config, products)
- Mandatory data needed by all requests
- Data that rarely changes

**Implementation:**
```javascript
async function warmCacheOnStartup(redis) {
  console.log('Starting cache warm-up...');
  
  // Load all users
  const users = await db.getAllUsers();
  for (const user of users) {
    await redis.set(`user:${user.id}`, JSON.stringify(user), {
      EX: 3600 // 1 hour TTL
    });
  }
  
  // Load all products
  const products = await db.getAllProducts();
  for (const product of products) {
    await redis.set(`product:${product.id}`, JSON.stringify(product), {
      EX: 7200 // 2 hour TTL
    });
  }
  
  console.log('Cache warm-up completed');
}

// Run on startup
await warmCacheOnStartup(redis);
server.listen(3000);
```

**Pros:**
- Simple and predictable
- Guaranteed availability of hot data
- Good for small datasets

**Cons:**
- Long startup delay (cold DB queries)
- Overkill if data rarely accessed
- Must know data size in advance

---

### 2. **Scheduled Refresh**

Periodically reload data into cache without waiting for requests.

**Best For:**
- Data that changes slowly but noticeably
- Reports, aggregations, analytics
- Reference data (configurations, lookups)

**Implementation:**
```javascript
async function scheduleRefresh(redis) {
  // Every 5 minutes, reload all products
  setInterval(async () => {
    console.log('Refreshing product cache...');
    
    const products = await db.getAllProducts();
    const cacheKey = 'products:all';
    
    // Store in Redis with 10-minute TTL
    await redis.set(cacheKey, JSON.stringify(products), {
      EX: 600
    });
    
    console.log(`Refreshed ${products.length} products`);
  }, 5 * 60 * 1000); // Every 5 minutes
}

scheduleRefresh(redis);
```

**Pros:**
- No startup delay
- Handles slow-changing data well
- Decouples warming from requests

**Cons:**
- Unused data may be refreshed
- Memory waste if config wrong
- Need to tune refresh interval

---

### 3. **Lazy Warmer (Quick Reheating)**

When cache expires, load data immediately in background while serving stale data.

**Best For:**
- Data that must always be fresh
- Pages with acceptable staleness window
- Reducing cache miss impact

**Implementation:**
```javascript
async function lazyWarmer(redis, db) {
  const cacheKey = 'hotspot:data';
  
  // Try to get from cache
  let data = await redis.get(cacheKey);
  
  if (!data) {
    // Cache miss - load from DB
    console.log('Cache miss, loading from DB');
    data = await db.getHotspotData();
    
    // Store with short TTL for next time
    await redis.set(cacheKey, JSON.stringify(data), { EX: 60 });
    
    // Return immediately (may be slow)
    return data;
  } else if (shouldReload(data)) {
    // Data exists but is "warm starting" soon
    // Reload in background
    db.getHotspotData().then(fresh => {
      redis.set(cacheKey, JSON.stringify(fresh), { EX: 60 });
    }).catch(err => console.error(err));
    
    // Return current data immediately
    return JSON.parse(data);
  }
  
  return JSON.parse(data);
}

function shouldReload(data) {
  // Reload if data is > 45 seconds old (TTL is 60)
  const age = Date.now() - JSON.parse(data).timestamp;
  return age > 45000;
}
```

**Pros:**
- Proactive reload prevents stale data
- Always serves something
- Lower latency than cold miss

**Cons:**
- Background reload adds DB load
- Still serves stale briefly
- Cache complexity increases

---

### 4. **Warm-on-Deploy**

Special warming logic run during deployment.

**Best For:**
- Blue-green deployments
- Canary releases
- Migration to new cache nodes

**Implementation:**
```javascript
async function warmOnDeploy(redis, warmUpLevel = 'standard') {
  const startTime = Date.now();
  
  if (warmUpLevel === 'full') {
    // Full warm-up: all users, products, orders
    await loadAllUsers(redis);
    await loadAllProducts(redis);
    await loadAllOrders(redis);
  } else if (warmUpLevel === 'standard') {
    // Standard: high-traffic items only
    await loadPopularUsers(redis);
    await loadPopularProducts(redis);
    await loadRecentOrders(redis);
  } else if (warmUpLevel === 'minimal') {
    // Minimal: only critical config
    await loadSystemConfig(redis);
  }
  
  const duration = Date.now() - startTime;
  console.log(`✓ Cache warm-up completed in ${duration}ms`);
}

// Run during deployment
await warmOnDeploy(redis, process.env.WARMUP_LEVEL || 'standard');
```

**Pros:**
- Controlled warm-up during safe window
- Can pick warmup intensity
- Good for canary deployments

**Cons:**
- Requires deployment coordination
- Must know which data is critical
- Adds deployment time

---

## Advanced Patterns

### Smart Warming (Adaptive)

```javascript
async function smartWarmCache(redis, db) {
  // Get access patterns from previous runs
  const hotKeys = await redis.zrevrange('key:frequency', 0, 999);
  
  if (!hotKeys.length) {
    // First run: load defaults
    await loadDefaultWarmData(redis);
    return;
  }
  
  // Load top 1000 accessed keys
  for (const key of hotKeys) {
    const value = await db.getByKey(key);
    await redis.set(key, JSON.stringify(value), { 
      EX: calculateTTL(key) 
    });
  }
}

function calculateTTL(key) {
  // Different TTLs based on access frequency
  if (key.startsWith('user:')) return 3600; // 1 hour
  if (key.startsWith('product:')) return 7200; // 2 hours
  if (key.startsWith('config:')) return 86400; // 1 day
  return 600; // 10 minutes default
}
```

### Distributed Warming

```javascript
// For multi-instance setup, coordinate warming
async function distributedWarm(redis, nodeId) {
  // Each node warms a shard
  const allKeys = await db.getAllKeys();
  const shardId = nodeId % NODE_COUNT;
  
  for (const key of allKeys) {
    // Simple sharding: only warm keys for this node
    if (hashKey(key) % NODE_COUNT === shardId) {
      const value = await db.get(key);
      await redis.set(key, JSON.stringify(value), { EX: 3600 });
    }
  }
}
```

---

## Key Metrics

### Cache Warm-up Metrics

1. **Warm-up Duration**: Time to fully warm the cache
2. **Warm-up Coverage**: % of hot keys loaded before first request
3. **Cold Start Hit Rate**: Cache hit % in first 5 minutes after restart
4. **Memory Utilization**: % of available cache used for warm keys

### Sample Targets

- **Startup Duration**: < 30 seconds
- **Coverage**: 80% of expected traffic
- **Hit Rate**: > 70% in first 5 minutes
- **Memory**: < 60% usage after warming

---

## When NOT to Use Cache Warming

- **Massive datasets**: Millions of keys → warming takes too long
- **Real-time data**: Data changes faster than warming interval
- **Unpredictable patterns**: Can't predict which data will be accessed
- **Memory constrained**: No room for proactive prefetch
- **Write-heavy**: Cache constantly invalidated anyway

Use **cache-aside + TTL** instead for these scenarios.

---

## Comparison with Alternatives

| Strategy | Startup Time | Hit Rate (5min) | Memory | Best For |
|----------|--------------|-----------------|--------|----------|
| **No Warming** | <1s | 0-10% | Low | Small datasets, real-time |
| **Startup Preload** | 30-60s | 85-95% | High | Critical data, stable |
| **Scheduled Refresh** | <1s | 40-70% | Medium | Slow-changing data |
| **Lazy Warmer** | <1s | 10-30% | Low | Always-on availability |
| **On-Deploy Warm** | 10-30s | 80-90% | High | Blue-green deploys |

---

## Summary

**Cache warming eliminates cold-start problems by proactively loading data.**

Choose warming strategy based on:
1. **Data size**: Small = startup preload, Large = scheduled refresh
2. **Change frequency**: Stable = preload, Volatile = lazy warming
3. **Business criticality**: Critical = startup, Nice-to-have = scheduled
4. **Startup constraints**: Quick start = scheduled, Patient startup = preload

**Best practice**: Combine strategies
- **Startup**: Load critical data (users, config)
- **Scheduled**: Refresh high-traffic items (products, trending)
- **Lazy**: Warm on cache expiry for edge cases
