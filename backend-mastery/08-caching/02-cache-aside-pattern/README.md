# Module 08.2: Cache-Aside Pattern

## Quick Start

```bash
cd 08-caching/02-cache-aside-pattern
npm install
npm run dev    # Terminal 1: Backend on localhost:6402
npm start      # Terminal 2: Frontend on localhost:3000
```

**Requires:** Redis running (`redis-server` or Docker)

## What is Cache-Aside?

The most common caching pattern. Application checks cache first, on miss fetches from database, stores in cache with TTL, and returns.

```javascript
async function getUser(userId) {
  const cacheKey = `user:${userId}`;
  
  // 1. Check cache
  const cached = await redis.get(cacheKey);
  if (cached) return JSON.parse(cached);
  
  // 2. Cache miss - fetch database
  const user = await db.users.findById(userId);
  
  // 3. Update cache
  if (user) {
    await redis.setEx(cacheKey, 3600, JSON.stringify(user));
  }
  
  return user;
}
```

## Why It Matters

**Speed:** Cache hits ~1000x faster than database  
**Scale:** Reduces database load dramatically  
**Simplicity:** Easy to add to existing code  
**Flexibility:** Works with any data type  

Typical hit ratio: >80% after warmup

## How It Works

1. **Check Cache** - Try Redis first
2. **On Miss** - Query database
3. **Store in Cache** - Set with TTL
4. **Return Data** - Send to client
5. **Repeat** - Next request hits cache

## Key Concepts

### TTL Strategy
```javascript
await redis.setEx(`user:${id}`, 3600, data);    // 1 hour
await redis.setEx(`product:${id}`, 86400, data); // 1 day
await redis.setEx(`rate:${ip}`, 60, data);       // 1 minute
```

### Cache Stampede Prevention
```javascript
// Multiple requests miss cache → all hit DB
// Solution: Locking during database fetch
const lockAcquired = await redis.set(lockKey, '1', { 
  EX: 5, 
  NX: true 
});
```

### Invalidation
```javascript
await db.users.update(id, data);
await redis.del(`user:${id}`);  // Clear cache
```

## Common Mistakes

### 1. No Database Fallback
```javascript
// ❌ BAD: Cache error breaks request
const data = await redis.get(key) || await db.find(id);

// ✅ GOOD: Always have database fallback
try {
  const cached = await redis.get(key);
  if (cached) return cached;
} catch (err) {
  logger.warn('Cache error');
}
return db.find(id);
```

### 2. Forgotten Invalidation
```javascript
// ❌ BAD: Update DB, forget cache
await db.users.update(id, newData);

// ✅ GOOD: Invalidate cache too
await db.users.update(id, newData);
await redis.del(`user:${id}`);
```

### 3. Caching Errors
```javascript
// ❌ BAD: Caches null/errors
const user = await db.find(id);
await redis.set(key, user);  // Null cached!

// ✅ GOOD: Cache only on success
const user = await db.find(id);
if (user) {
  await redis.setEx(key, 3600, user);
}
```

### 4. No Warmup on Startup
```javascript
// ❌ BAD: App starts cold
app.listen(3000);

// ✅ GOOD: Pre-populate critical data
const criticalIds = [1, 2, 3];
for (const id of criticalIds) {
  const data = await db.find(id);
  await redis.setEx(`user:${id}`, 3600, data);
}
app.listen(3000);
```

### 5. Large Objects Slowing Cache
```javascript
// ❌ BAD: Store entire object
await redis.setEx(key, 3600, JSON.stringify(fullUser));

// ✅ GOOD: Store only needed fields
const minimal = { id: user.id, name: user.name, email: user.email };
await redis.setEx(key, 3600, JSON.stringify(minimal));
```

### 6. No Stampede Handling
```javascript
// ❌ BAD: 1000 requests miss cache = 1000 DB queries
if (!cached) {
  user = await db.get(id);
}

// ✅ GOOD: Lock prevents stampede
const lockAcquired = await redis.set(lock, '1', { NX: true, EX: 5 });
if (lockAcquired) {
  user = await db.get(id);
}
```

## Real World Usage

### User Sessions
```javascript
async function getSession(sessionId) {
  const cached = await redis.get(`session:${sessionId}`);
  if (cached) return JSON.parse(cached);
  
  const session = await db.sessions.findById(sessionId);
  if (session) {
    await redis.setEx(`session:${sessionId}`, 3600, JSON.stringify(session));
  }
  return session;
}
```

### Product Catalog  
```javascript
async function getProduct(productId) {
  const cached = await redis.get(`product:${productId}`);
  if (cached) return JSON.parse(cached);
  
  const product = await db.products.findById(productId);
  if (product) {
    // Products stable: 24-hour TTL
    await redis.setEx(`product:${productId}`, 86400, JSON.stringify(product));
  }
  return product;
}
```

### User Feed
```javascript
async function getFeed(userId) {
  const cached = await redis.get(`feed:${userId}`);
  if (cached) return JSON.parse(cached);
  
  const feed = await db.feeds.getForUser(userId);
  if (feed) {
    // Feed volatile: 5-minute TTL
    await redis.setEx(`feed:${userId}`, 300, JSON.stringify(feed));
  }
  return feed;
}
```

## Implementation Checklist

- [ ] Basic cache-aside pattern working
- [ ] Error handling for cache failures
- [ ] Appropriate TTL per data type
- [ ] Cache invalidation on updates
- [ ] Stampede prevention implemented
- [ ] Hit/miss ratio monitoring
- [ ] Cache warmup on startup
- [ ] Database latency simulation verified
- [ ] Maxmemory and eviction policy set
- [ ] Metrics dashboard accessible

## Conclusion

Cache-Aside is the foundation of web-scale architecture. Simple to implement, powerful in practice. Master this and you understand how systems handle billions of requests per day.

**Key:** Fast reads + stale data + manual invalidation = cache-aside tradeoff.

**Next:** 08.3 - Cache Invalidation (advanced strategies)
