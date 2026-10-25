# Cache Invalidation Strategies

## What is Cache Invalidation?

Cache invalidation is the process of removing or updating stale data from cache when the source data changes. It's one of the hardest problems in computer science—often quoted as "There are only two hard things in Computer Science: cache invalidation and naming things."

**The Core Problem:**
```
Database: User.name = "Alice"  
Cache: user:1 = {name: "Bob"}  ← STALE!
```

If the database and cache don't match, your app shows wrong data.

## The 5 Main Invalidation Strategies

### 1. **TTL (Time-To-Live) Invalidation**

Automatically expire cache entries after a fixed time period.

```javascript
// Set cache with 5-minute expiration
await redis.setex(`user:${id}`, 300, JSON.stringify(userData));

// After 5 minutes, Redis automatically deletes it
// Next request fetches fresh data from database
```

**Pros:**
- Simple to implement
- Prevents stale data indefinitely
- Good for data that changes slowly

**Cons:**
- Potential stale data within the TTL window
- Unnecessary cache misses after expiration
- Can't handle immediate updates

**Best for:** Blog posts, user profiles, product listings

### 2. **Event-Driven Invalidation**

Delete cache when source data changes (actively monitoring for updates).

```javascript
// When user updates their profile
app.put('/api/users/:id', async (req, res) => {
  const updatedUser = await db.updateUser(req.params.id, req.body);
  
  // Invalidate immediately
  await redis.del(`user:${req.params.id}`);
  await redis.del(`users:all`);  // If fetching list cache
  
  res.json(updatedUser);
});
```

**Pros:**
- Fresh data immediately after changes
- No temporary stale data
- Good for frequently-read, rarely-written data

**Cons:**
- Requires coordination between DB and cache
- More complex code
- Can miss invalidations if DB changes outside app

**Best for:** User profile updates, order status, inventory

### 3. **Lazy Invalidation (Check-and-Set)**

Validate cached data before using it (versioning approach).

```javascript
// Cache user data with version
const cacheKey = `user:${id}`;
const cachedData = await redis.hgetall(cacheKey);
const dbVersion = await db.getVersion(id);

if (cachedData.version !== dbVersion) {
  // Data is stale, fetch fresh
  const freshData = await db.getUser(id);
  await redis.hset(cacheKey, 'version', dbVersion);
  await redis.hset(cacheKey, 'data', JSON.stringify(freshData));
  return freshData;
}

return JSON.parse(cachedData.data);
```

**Pros:**
- Detects stale data automatically
- Works with external data changes
- No fixed expiration overhead

**Cons:**
- Requires extra version checks
- More database queries
- Complexity increases with multiple versions

**Best for:** Shared caches, external data sources

### 4. **Hybrid Invalidation (TTL + Event)**

Combine TTL and event-driven for best of both worlds.

```javascript
// Set cache with both expiration and event handling
await redis.setex(`user:${id}`, 3600, JSON.stringify(userData));

// On update, invalidate immediately
app.put('/api/users/:id', async (req, res) => {
  const updated = await db.updateUser(req.params.id, req.body);
  await redis.del(`user:${req.params.id}`);  // Immediate invalidation
  res.json(updated);
});

// After 1 hour, even if no updates, cache expires (safety net)
```

**Pros:**
- Immediate consistency on known changes
- Automatic cleanup after TTL
- Best of both strategies

**Cons:**
- Most complex to implement
- Potential overhead of both approaches

**Best for:** Most production systems

### 5. **Broadcast Invalidation**

Invalidate cache across multiple servers using pub/sub.

```javascript
// Server A updates data and broadcasts invalidation
app.put('/api/data/:id', async (req, res) => {
  const updated = await db.update(req.params.id, req.body);
  
  // Publish invalidation event to all servers
  await redis.publish('cache:invalidate', JSON.stringify({
    key: `data:${req.params.id}`,
    timestamp: Date.now()
  }));
  
  res.json(updated);
});

// All servers (including A) listen for invalidation
subscriber.on('message', (channel, message) => {
  if (channel === 'cache:invalidate') {
    const { key } = JSON.parse(message);
    cache.delete(key);  // Remove from local cache
  }
});
```

**Pros:**
- Consistency across distributed systems
- Handles multi-server deployments
- Scalable invalidation

**Cons:**
- Requires pub/sub infrastructure
- Complex distributed coordination
- Network overhead

**Best for:** Microservices, distributed caching

## Comparison Table

| Strategy | Complexity | Freshness | Scalability | Use Case |
|----------|-----------|-----------|-------------|----------|
| TTL | Low | Medium | High | Static data |
| Event-Driven | Medium | High | Medium | Frequently-written data |
| Lazy | Medium | Medium | Medium | Shared caches |
| Hybrid | High | High | High | Production systems |
| Broadcast | Complex | High | Very High | Distributed systems |

## Real-World Scenarios

**Scenario 1: E-commerce Product Cache**
```javascript
// Hybrid approach
await redis.setex(`product:${id}`, 3600, JSON.stringify(product));

// On price update
app.put('/api/products/:id/price', async (req, res) => {
  const updated = await db.updatePrice(req.params.id, req.body);
  await redis.del(`product:${req.params.id}`);  // Immediate
  await redis.publish('product:updated', req.params.id);  // Broadcast to other servers
  res.json(updated);
});
```

**Scenario 2: User Session Cache**
```javascript
// TTL approach (sessions expire anyway)
await redis.setex(`session:${sessionId}`, 86400, JSON.stringify(userData));
// Automatically expires after 24 hours

// On logout, explicit invalidation
app.post('/api/logout', async (req, res) => {
  await redis.del(`session:${req.sessionId}`);
  res.json({ success: true });
});
```

## Common Pitfalls

1. **Over-invalidating** - Clearing too much cache unnecessarily
2. **Under-invalidating** - Forgetting to invalidate related keys
3. **Cascade invalidation** - Deleting too many dependent caches
4. **Race conditions** - Cache invalidation before DB commit
5. **Dead cache** - Keys never expire or get invalidated

## Performance Impact

- **Cache Hit** (fresh data): 1-2ms from Redis
- **Cache Miss** (query DB): 50-200ms from database
- **Stale Data** (wrong answer): ∞ (business value = 0)
- **Invalidation Event**: 10-50ms overhead per change

Invalidate smartly to maximize hits and minimize staleness!
