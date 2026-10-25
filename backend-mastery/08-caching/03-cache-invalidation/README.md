# Cache Invalidation - Module 08.3

## Quick Start

```bash
# Install dependencies
npm install

# Start Redis (if not running)
redis-server

# Start backend server (port 6403)
npm run dev

# Start React frontend (port 3000)
npm start
```

Then:
- Backend: http://localhost:6403 (API)
- Frontend: http://localhost:3000 (UI)

---

## What is Cache Invalidation?

**Cache invalidation** is the process of removing or updating cached data when the source data changes. It ensures clients don't serve outdated information.

### The Core Problem

```
Database: Price = $100
Cache:    Price = $100       ← Consistent

--- Price changes to $80 ---

Database: Price = $80        ← Updated
Cache:    Price = $100       ← STALE!

If we don't invalidate cache, customers see $100 for 1 hour!
If cache TTL is 1 hour, consistency window is huge.
```

### The Solution: Multiple Strategies

| Strategy | Consistency | Complexity | Stale Window |
|----------|-------------|-----------|--------------|
| **Manual (Event-Based)** | High | Medium | ~1ms |
| **TTL-Only (Passive)** | Eventually | Low | 0-1hr |
| **Cascade (Bulk)** | High | High | ~1ms |
| **Pattern (Wildcard)** | High | Medium | ~1ms |

---

## API Endpoints (10 Total)

### 1. GET /api/user/:id
Fetch user with cache-aside pattern.
```javascript
GET /api/user/1
// First call: cache miss → DB hit → store in cache → return
// Second call: cache hit → return immediately (1000x faster)
```

### 2. POST /api/user/:id
Update user AND invalidate cache.
```javascript
POST /api/user/1
{ "name": "Bob", "email": "bob@test.com" }
// Updates DB, then deletes cache key 'user:1'
// Next read fetches fresh data
```

### 3. DELETE /api/cache/:key
Manually delete a cache key (admin operation).
```javascript
DELETE /api/cache/user:1
// Removes 'user:1' from cache immediately
// Returns: { keysDeleted: 1 }
```

### 4. DELETE /api/cache/pattern/:pattern
Delete all keys matching pattern using SCAN.
```javascript
DELETE /api/cache/pattern/user:*
// Scans all keys matching 'user:*' and deletes them
// Returns: { keysDeleted: 5 }
```

### 5. POST /api/user/:id/cascade-invalidate
Invalidate user + all related caches.
```javascript
POST /api/user/1/cascade-invalidate
// Deletes:
//   - user:1
//   - user:1:profile
//   - user:1:permissions
//   - user:1:settings
//   - user:1:preferences
```

### 6. POST /api/user/:id/ttl-only
Update WITHOUT invalidation (shows stale data risk).
```javascript
POST /api/user/1/ttl-only
{ "name": "Charlie" }
// Updates DB but DOESN'T delete cache
// Demonstrates the problem: cache serves old name for 1 hour!
```

### 7. GET /api/cache/:key
Peek at cached value and remaining TTL.
```javascript
GET /api/cache/user:1
// Returns: { keyExists: true, value: {...}, ttl: 3478 }
```

### 8. GET /api/database/user/:id
Bypass cache, fetch directly from database.
```javascript
GET /api/database/user/1
// Ignores cache completely, hits database every time
// Useful for bypassing stale data in emergencies
```

### 9. GET /api/metrics
Get invalidation metrics and history.
```javascript
GET /api/metrics
// Returns: { invalidations: 42, lastAt: "2026-03-29T10:30:00Z", history: [...] }
```

### 10. POST /api/metrics/reset
Reset all metrics counters.
```javascript
POST /api/metrics/reset
// Clears invalidation count and history
```

---

## 6 Common Mistakes & Fixes

### Mistake 1: Forgetting an Invalidation

**❌ Bad:**
```javascript
app.post('/api/users/:id', async (req, res) => {
  await db.users.update({ id: req.params.id }, req.body);
  // FORGOT: await redis.del(`user:${req.params.id}`);
  res.json({ success: true });
});

// Later: GET /api/users/1 returns stale cached data!
```

**✅ Good:**
```javascript
app.post('/api/users/:id', async (req, res) => {
  const user = await db.users.update({ id: req.params.id }, req.body);
  await redis.del(`user:${req.params.id}`);  // Always invalidate
  res.json({ success: true, user });
});
```

---

### Mistake 2: Invalidating Before DB Commit

**❌ Bad:**
```javascript
// Delete cache FIRST
await redis.del(`user:${userId}`);

// Then try to update DB (might fail!)
const user = await db.users.update({ id: userId }, updates);

// If DB fails: cache is empty, data unchanged → confusing!
```

**✅ Good:**
```javascript
try {
  // Update DB first
  const user = await db.users.update({ id: userId }, updates);
  
  // Only delete if update succeeded
  await redis.del(`user:${userId}`);
  
  return user;
} catch (error) {
  // If DB fails: cache still has old data (safe fallback)
  throw error;
}
```

---

### Mistake 3: Partial Invalidation in Distributed Systems

**❌ Bad:**
```javascript
// Server A invalidates its cache
await redis.del(`user:${id}`);

// But Server B (different instance) still has STALE cache!
// If request hashes to Server B, customer sees old data
```

**✅ Good:**
```javascript
// Server A invalidates Redis
await redis.del(`user:${id}`);

// AND publishes event to all servers
redis.publish('cache:invalidated', JSON.stringify({ key: `user:${id}` }));

// Server B listens and also invalidates
redis.on('message', (channel, message) => {
  const { key } = JSON.parse(message);
  localCache.delete(key);  // Also remove from local cache
});
```

---

### Mistake 4: Caching Errors

**❌ Bad:**
```javascript
try {
  const user = await db.users.findById(userId);
  await redis.setEx(`user:${userId}`, 3600, JSON.stringify(user));
} catch (error) {
  // Cache the error response!
  await redis.setEx(`user:${userId}`, 3600, JSON.stringify({ error: true }));
}

// Now if DB recovers, cache still returns error for 1 hour!
```

**✅ Good:**
```javascript
try {
  const user = await db.users.findById(userId);
  await redis.setEx(`user:${userId}`, 3600, JSON.stringify(user));
} catch (error) {
  // Don't cache errors - let next request retry
  throw error;
}
```

---

### Mistake 5: Over-Aggressive Cascades

**❌ Bad:**
```javascript
// When one user changes, delete ALL user caches!
await redis.keys('user:*').forEach(async key => await redis.del(key));

// This wipes every user cache, hits DB for everything
// Performance tanks!
```

**✅ Good:**
```javascript
// Only delete caches that actually depend on this user
await redis.del(`user:${userId}`);
await redis.del(`user:${userId}:profile`);
await redis.del(`user:${userId}:permissions`);

// Don't delete: other users' caches, user lists, etc.
```

---

### Mistake 6: Wrong Key Format in Invalidation

**❌ Bad:**
```javascript
// Code formats keys as 'users:by:id:1'
const key = `users:by:id:${userId}`;
await redis.set(key, user);

// But invalidation code still uses old format
await redis.del(`user:${userId}`);  // Doesn't match!

// Result: Stale data persists, never gets deleted
```

**✅ Good:**
```javascript
// Centralize key generation
const cacheKeys = {
  user: (id) => `users:by:id:${id}`,
  profile: (id) => `users:profile:${id}`
};

// Use everywhere
async function getUser(id) {
  const cached = await redis.get(cacheKeys.user(id));
  // ...
}

async function invalidateUser(id) {
  await redis.del(cacheKeys.user(id));  // Always in sync!
}
```

---

## Real-World Usage Scenarios

### Scenario 1: E-commerce Price Updates
```javascript
// When product price changes (flash sale, price drop, etc.)
async function updatePrice(productId, newPrice) {
  // Update database
  await db.products.update({ id: productId }, { price: newPrice });
  
  // Immediately invalidate price cache
  await redis.del(`product:${productId}:price`);
  
  // Also invalidate any price lists/searches that include this product
  await redis.del(`pricelist:*`);
  
  // And invalidate shopping cart calculations for all users
  redis.publish('price-changed', JSON.stringify({ productId }));
}
```

### Scenario 2: User Permission Changes
```javascript
// When user gets promoted or demoted
async function grantPermission(userId, permission) {
  await db.permissions.insert({ userId, permission });
  
  // Clear permission cache
  await redis.del(`user:${userId}:permissions`);
  
  // Clear role cache
  await redis.del(`user:${userId}:roles`);
  
  // Force user to re-authenticate to pick up new permissions
  await redis.del(`session:${userId}:*`);
}
```

### Scenario 3: Social Media Feed Updates
```javascript
// When user posts new content
async function createPost(userId, content) {
  const post = await db.posts.insert({ userId, content });
  
  // Invalidate this user's feed cache
  await redis.del(`feed:${userId}`);
  
  // Invalidate all followers' feed caches (cascade)
  const followers = await db.followers.getByUserId(userId);
  for (const follower of followers) {
    await redis.del(`feed:${follower.id}`);
  }
  
  // Broadcast to real-time subscribers
  redis.publish(`user:${userId}:posts`, JSON.stringify(post));
}
```

---

## Implementation Checklist

- [ ] Identify all database write paths (INSERT, UPDATE, DELETE)
- [ ] Map cache keys to each data change
- [ ] Add cache invalidation to every write path
- [ ] Add logging for all invalidation events
- [ ] Handle cascade invalidations for related data
- [ ] Test invalidation with concurrent updates
- [ ] Test race conditions (A writes → B writes → who invalidates?)
- [ ] Handle Redis failures gracefully (don't crash if delete fails)
- [ ] Use SCAN instead of KEYS for pattern invalidation
- [ ] Set up monitoring for stale data (cache hit rate anomalies)
- [ ] Document all cache key formats
- [ ] Implement automatic TTL as safety net

---

## Key Concepts

### Consistency Window
The time window during which cached data is stale.
- **Manual invalidation:** ~1ms (network latency)
- **TTL-only:** 0 to 1 hour (full TTL duration)
- **Cascade:** ~1ms per related cache

### Cascading Dependencies
One data change affects multiple caches. Must invalidate all:
```
User changes role
  ├─ Invalidate: user:1
  ├─ Invalidate: user:1:profile
  ├─ Invalidate: user:1:permissions
  ├─ Invalidate: user:1:roles
  └─ Invalidate: feeds that depend on their role
```

### Pattern Invalidation
Use SCAN + MATCH to bulk-delete matching keys:
```javascript
// Invalidate all search results for a product
DELETE /api/cache/pattern/search:product:123:*
// Removes: search:product:123:price, search:product:123:reviews, etc.
```

---

## Conclusion

Cache invalidation is the hardest part of caching because:

1. **It's distributed** - changes in DB must propagate to cache layer
2. **It's easy to miss** - forgotten in one code path = stale data
3. **It's hard to test** - race conditions appear randomly
4. **It's asynchronous** - network latency creates windows of inconsistency

**Best Practice:** Combine multiple strategies:
- Use **event-based invalidation** for critical data (prices, permissions)
- Use **TTL as safety net** for eventual consistency
- Use **monitoring & alerts** to detect stale data escaping
- Use **centralized cache keys** to prevent format mismatches

---

## Next Module

**Module 08.4: Pub/Sub Pattern** - Scale cache invalidation across distributed systems using Redis Pub/Sub for real-time message broadcasting.
