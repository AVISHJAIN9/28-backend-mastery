# Cache Invalidation Theory & Concepts

## Introduction

**Phil Karlton**: "There are only two hard things in Computer Science: cache invalidation and naming things."

This is perhaps the most famous quote in computer science. Cache invalidation is deceptively simple to understand but extraordinarily difficult to execute correctly. While the cache-aside pattern provides flexibility, it introduces a new problem: **how do you ensure cached data stays in sync with the source of truth?**

If data in your database changes but the cache still holds the old value, clients receive stale data. If you invalidate the cache too aggressively, you lose the performance benefits. If you invalidate too passively, you risk data inconsistency. This module explores the strategies, tradeoffs, and real-world pitfalls of cache invalidation.

---

## Part 1: Core Concepts

### What is Cache Invalidation?

**Cache invalidation** is the process of removing or updating cached data when the source data changes. It ensures that clients don't serve outdated information.

```javascript
// When user data changes in database
await db.users.update({ id: 1, name: 'Alice' }, { name: 'Bob' });

// We must invalidate the cache
await redis.del('user:1');  // Remove from cache

// OR update it
await redis.setEx('user:1', 3600, JSON.stringify(updatedUser));
```

### The Core Problem

```
Database: User name = 'Alice'
Cache: 'user:1' = { id: 1, name: 'Alice' }
✓ Consistent

---

User updates name to 'Bob'
Database: User name = 'Bob'       ← Updated
Cache: 'user:1' = { id: 1, name: 'Alice' }  ← Stale!
✗ Inconsistent - Cache misses the change

---

Cache-aside fetch occurs:
Client: "Get user 1"
Cache: Miss (already invalidated OR TTL expired)
Database: "Bob"
Cache: Update to 'Bob'
✓ Eventually consistent

But what if data changed AND cache wasn't invalidated?
Then client STILL SEES 'Alice' until TTL expires (could be 1 hour!)
```

### The Invalidation Paradox

- **Too aggressive (invalidate everything):** Loose all cache benefits, constantly hit database
- **Too passive (invalidate nothing):** Serve stale data, inconsistency problems
- **TTL as safety net:** Guarantees freshness after timeout, but can lag (user sees old data for 60 minutes)

---

## Part 2: Cache Invalidation Strategies

### Strategy 1: TTL-Based Expiration (Passive)

**How it works:** Cache expires automatically after set duration. No code changes trigger invalidation.

```javascript
// User data cached for 1 hour
await redis.setEx('user:1', 3600, JSON.stringify(user));

// 10 minutes later, user data changes in database
await db.users.update({ id: 1 }, { email: 'newemail@test.com' });
// Cache STILL serves old email for 50 more minutes!

// After 1 hour, cache expires, next fetch gets fresh data from DB
```

**When to use:**
- Data changes infrequently
- Small inconsistency windows acceptable (e.g., analytics, product info)
- No way to detect when data changes

**Pros:**
- Simple - no code required
- Guaranteed freshness (eventually)
- No coordination complexity

**Cons:**
- Data can be stale for entire TTL duration
- Wastes cache hits if data changes frequently
- TTL too short = constant DB hits; too long = stale data risk

**Real-world example:**
```javascript
// Product info cached 24 hours
// Price changes? Customers see old price for up to 24 hours
// Inconsistency window: 0-24 hours (unacceptable for pricing!)
```

---

### Strategy 2: Event-Based Invalidation (Proactive)

**How it works:** When data changes, immediately remove/update cache.

```javascript
// Update user data
async function updateUser(userId, updates) {
  // 1. Update database
  const updatedUser = await db.users.update({ id: userId }, updates);
  
  // 2. Immediately invalidate cache
  await redis.del(`user:${userId}`);
  
  // 3. Return updated data
  return updatedUser;
}

// Result: Cache stale for ~1 millisecond (network round trip)
// Consistency window is near-instant!
```

**When to use:**
- Critical data that changes frequently (prices, permissions, inventory)
- Small data change footprint (you know exactly what to invalidate)
- Coordinated system architecture

**Pros:**
- Near-instant consistency (1-100ms)
- Minimal stale data windows
- Prevents stale data from serving in practice

**Cons:**
- Requires code changes in write paths
- Risk of forgetting to invalidate somewhere
- Multiple code paths = multiple invalidation points (error-prone)

**Real-world example:**
```javascript
app.post('/api/users/:id', async (req, res) => {
  // Update DB
  const user = await db.users.update({ id: req.params.id }, req.body);
  
  // Invalidate cache - what if this line is MISSED?
  await redis.del(`user:${req.params.id}`);  // ← Easy to forget!
  
  res.json(user);
});
```

---

### Strategy 3: Versioned Keys (Time-Sensitive)

**How it works:** Include version/timestamp in cache key. When data changes, key changes, old cache becomes orphaned.

```javascript
// Instead of: cache key = 'user:1'
// Use: cache key = 'user:1:v2' where v2 = version

async function updateUser(userId, updates) {
  // 1. Update database and increment version
  const version = await db.getUserVersion(userId);
  const newVersion = version + 1;
  
  const updatedUser = await db.users.update(
    { id: userId, version: newVersion },
    updates
  );
  
  // 2. Cache with NEW key (version in key)
  const cacheKey = `user:${userId}:v${newVersion}`;
  await redis.setEx(cacheKey, 86400, JSON.stringify(updatedUser));
  
  return updatedUser;
}

// Read path
async function getUser(userId) {
  // 1. Get user from DB (or cache) to know current version
  const user = await db.users.findById(userId);  // Has version field
  
  // 2. Try cache with VERSIONED key
  const cacheKey = `user:${userId}:v${user.version}`;
  const cached = await redis.get(cacheKey);
  if (cached) return JSON.parse(cached);
  
  // 3. Cache miss - populate new versioned key
  await redis.setEx(cacheKey, 86400, JSON.stringify(user));
  return user;
}
```

**When to use:**
- High-frequency changes (stock prices, counters)
- Version already tracked in database
- Cache-aside with fast fallback

**Pros:**
- Automatic invalidation (old version key never accessed)
- No explicit deletion needed
- Old keys naturally expire by TTL

**Cons:**
- Requires version field in database
- Database lookup still needed (can't skip)
- More memory usage (multiple versions in cache)
- Orphaned old keys remain until TTL

**Real-world example:**
```javascript
// Stock price changes 1000 times per second
// Versions: stock:AAPL:v1000, stock:AAPL:v1001, stock:AAPL:v1002
// Cold cache can't serve stale version - always fetches DB
// Consistency: guaranteed (version mismatch = fetch fresh)
```

---

### Strategy 4: Broadcast Invalidation (Distributed)

**How it works:** Multiple instances use pub/sub or event queue to broadcast cache invalidations.

```javascript
// Instance A: Data changes
async function updateUser(userId, updates) {
  const updatedUser = await db.users.update({ id: userId }, updates);
  
  // Publish invalidation event to all instances
  await redis.publish(`cache-invalidation`, JSON.stringify({
    type: 'user_updated',
    userId,
    timestamp: Date.now()
  }));
  
  return updatedUser;
}

// Instance B: Listen for invalidation events
redis.subscribe('cache-invalidation');
redis.on('message', (channel, message) => {
  const { type, userId } = JSON.parse(message);
  
  if (type === 'user_updated') {
    // Invalidate cache on this instance too
    redis.del(`user:${userId}`);
  }
});
```

**When to use:**
- Distributed systems (multiple servers)
- One instance writes, all instances read
- Event-driven architectures

**Pros:**
- Coordinates all instances automatically
- No database polling
- Event queue handles ordering

**Cons:**
- Pub/sub doesn't guarantee delivery
- Complexity of cross-instance coordination
- Network partitions = stale cache in some instances

**Real-world example:**
```javascript
// Service-oriented architecture
// User Service updates user
// Publish 'user.updated' event
// Cache Service, API Service, Report Service all subscribe
// All instances invalidate their local caches simultaneously
```

---

## Part 3: Invalidation Patterns in Code

### Pattern 1: Write-Through with Invalidation

Update database AND cache atomically:

```javascript
async function updateUserProfile(userId, updates) {
  const client = await db.getConnection();
  
  try {
    // 1. Update database
    const updated = await client.execute(
      'UPDATE users SET ? WHERE id = ?',
      [updates, userId]
    );
    
    // 2. Invalidate cache (same transaction conceptually)
    const cacheKey = `user:${userId}`;
    await redis.del(cacheKey);
    
    // 3. Warm cache with new data
    await redis.setEx(cacheKey, 3600, JSON.stringify(updated));
    
    return updated;
  } catch (error) {
    // Invalidate cache on error too (safer to miss cache than use stale)
    await redis.del(`user:${userId}`);
    throw error;
  }
}
```

**Risk:** Database updates, Redis fails → cache not invalidated → stale data

**Mitigation:**
```javascript
// Invalidate first (pessimistic)
async function updateUserProfile(userId, updates) {
  // 1. Clear cache FIRST
  await redis.del(`user:${userId}`);
  
  // 2. Update database
  const updated = await db.users.update({ id: userId }, updates);
  
  // 3. Populate cache
  await redis.setEx(`user:${userId}`, 3600, JSON.stringify(updated));
  
  return updated;
}
// Why first? If Redis del fails, database is still updated
// Next fetch goes to DB (consistent), not cache (stale)
```

---

### Pattern 2: Cascading Invalidation

When parent changes, invalidate children:

```javascript
async function updateTeam(teamId, updates) {
  // Update team
  const team = await db.teams.update({ id: teamId }, updates);
  
  // Invalidate team cache
  await redis.del(`team:${teamId}`);
  
  // CASCADE: Also invalidate all member caches
  const members = await db.teams.getMembers(teamId);
  
  for (const member of members) {
    // Invalidate member's cached team membership
    await redis.del(`member:${member.id}:teams`);
    
    // Invalidate member's permissions (which depend on team)
    await redis.del(`member:${member.id}:permissions`);
  }
  
  return team;
}
```

**Risk:** Incomplete cascades (miss some related keys)

---

### Pattern 3: Batch Invalidation

Invalidate many keys matching pattern:

```javascript
// User updates their public profile
// Invalidate all cached "profile" results
async function updatePublicProfile(userId, updates) {
  const user = await db.users.update({ id: userId }, updates);
  
  // Find all cache keys for this user's profile
  // Pattern: 'profile:*:user:1' (search:view:user:id)
  const keys = await redis.keys(`profile:*:user:${userId}`);
  
  // Delete all matching keys
  if (keys.length > 0) {
    await redis.del(...keys);  // redis.del(key1, key2, key3, ...)
  }
  
  return user;
}
```

**Risk:** KEYS command is O(N) and blocks Redis. Use SCAN in production:

```javascript
async function invalidatePattern(pattern) {
  let cursor = 0;
  let keysToDelete = [];
  
  do {
    // SCAN returns [newCursor, keys]
    const [newCursor, keys] = await redis.scan(cursor, 'MATCH', pattern);
    cursor = parseInt(newCursor);
    keysToDelete.push(...keys);
  } while (cursor !== 0);
  
  if (keysToDelete.length > 0) {
    await redis.del(...keysToDelete);
  }
}
```

---

### Pattern 4: Lazy Invalidation with Timestamps

Don't delete - add timestamp, check on read:

```javascript
// User profile updated
async function updateProfile(userId, updates) {
  // Don't delete cache, just mark it invalid
  const timestamp = Date.now();
  
  await db.users.update({ id: userId }, { ...updates, updated_at: timestamp });
  
  // Store invalidation timestamp
  await redis.set(`invalidated:user:${userId}`, timestamp);
  
  return updates;
}

// On read
async function getProfile(userId) {
  const cachedProfile = await redis.get(`profile:${userId}`);
  
  if (cachedProfile) {
    const invalidationTime = await redis.get(`invalidated:user:${userId}`);
    
    if (invalidationTime && JSON.parse(cachedProfile).cached_at < invalidationTime) {
      // Data is older than invalidation timestamp - it's stale
      await redis.del(`profile:${userId}`);
      // Fall through to DB fetch
    } else {
      return JSON.parse(cachedProfile);
    }
  }
  
  // No cache or stale - fetch DB
  const profile = await db.users.findById(userId);
  await redis.setEx(`profile:${userId}`, 3600, JSON.stringify({
    ...profile,
    cached_at: Date.now()
  }));
  
  return profile;
}
```

**Pros:** No explicit delete calls needed
**Cons:** Extra timestamp checks on every read

---

## Part 4: Common Mistakes

### Mistake 1: The Missing Invalidation

**Code path that updates data but forgets to invalidate cache:**

```javascript
// BAD: Forgetting to invalidate
app.post('/api/users/:id', async (req, res) => {
  const user = await db.users.update({ id: req.params.id }, req.body);
  // FORGOT: await redis.del(`user:${req.params.id}`);
  res.json(user);
});

// Later, GET /api/users/1 serves stale cached data!
```

**Good:**
```javascript
app.post('/api/users/:id', async (req, res) => {
  const user = await db.users.update({ id: req.params.id }, req.body);
  await redis.del(`user:${req.params.id}`);  // ✓ Explicit invalidation
  res.json(user);
});
```

---

### Mistake 2: Cache Invalidation Before Database Commit

**Invalidate cache, then DB update fails → cache empty, data unchanged:**

```javascript
// BAD: Delete cache before DB commit
async function updateUser(userId, updates) {
  await redis.del(`user:${userId}`);  // Cache cleared
  
  // DB update fails!
  const user = await db.users.update({ id: userId }, updates);
  
  // Cache is empty, but database wasn't updated either
  // Next read hits DB (good) BUT log shows cache miss when data didn't change
}
```

**Good:**
```javascript
async function updateUser(userId, updates) {
  try {
    const user = await db.users.update({ id: userId }, updates);
    // Only invalidate if DB write succeeded
    await redis.del(`user:${userId}`);
    return user;
  } catch (error) {
    // If DB fails, cache remains valid (still old data, but not worse)
    throw error;
  }
}
```

---

### Mistake 3: Partial Invalidation in Distributed Systems

**Instance A invalidates cache. Instance B still has stale copy:**

```javascript
// Instance A (web server 1)
app.post('/api/users/:id', async (req, res) => {
  await db.users.update({ id: req.params.id }, req.body);
  await redis.del(`user:${req.params.id}`);  // Deletes from Redis
  res.json({ updated: true });
});

// Instance B (web server 2) has NO IDEA cache was invalidated
// Its in-memory cache or local Redis still has stale data
// Clients hash to Instance B → get stale data!

// FIX: Use pub/sub to broadcast invalidation
redis.publish('invalidation', JSON.stringify({ key: `user:${id}` }));
```

---

### Mistake 4: Caching Errors (Caching Stale with TTL)

**Caching null/errors, preventing retries:**

```javascript
// BAD: Cache error responses
async function getUser(userId) {
  const cached = await redis.get(`user:${userId}`);
  if (cached) return JSON.parse(cached);
  
  try {
    const user = await db.users.findById(userId);
    // Cache success
    await redis.setEx(`user:${userId}`, 3600, JSON.stringify(user));
    return user;
  } catch (error) {
    // MISTAKE: Cache the error!
    await redis.setEx(`user:${userId}`, 3600, JSON.stringify({ error: true }));
    throw error;
  }
}

// Now, database is fixed, but cache still returns error for 1 hour!
```

**Good:**
```javascript
async function getUser(userId) {
  const cached = await redis.get(`user:${userId}`);
  if (cached && cached.error !== true) {  // Check for errors
    return JSON.parse(cached);
  }
  
  try {
    const user = await db.users.findById(userId);
    await redis.setEx(`user:${userId}`, 3600, JSON.stringify(user));
    return user;
  } catch (error) {
    // Don't cache errors - let next request retry
    throw error;
  }
}
```

---

### Mistake 5: The Cascading Invalidation Cascade

**Invalidating too much, clearing unrelated caches:**

```javascript
// BAD: Over-aggressive cascading
async function updateUser(userId, updates) {
  await db.users.update({ id: userId }, updates);
  
  // Invalidate everything related to this user
  // user:[any-id], users:[any-filter], profile:[any-id],
  // permissions:[any-id], sessions:[any-id], posts:[any-id], comments:[any-id]
  
  // This wipes too much! Now ALL user lookups hit DB
  await redis.keys(`user:*`).forEach(async key => await redis.del(key));
}
```

**Good:**
```javascript
async function updateUser(userId, updates) {
  await db.users.update({ id: userId }, updates);
  
  // Invalidate ONLY this user
  await redis.del(`user:${userId}`);
  
  // Invalidate ONLY related caches that depend on this user
  await redis.del(`user:${userId}:profile`);
  await redis.del(`user:${userId}:permissions`);
  
  // Don't invalidate: user list caches, other users' caches, etc.
}
```

---

### Mistake 6: Infinite Loops from Invalidation Events

**Invalidation event triggers update, which triggers invalidation:**

```javascript
// Event listener
redis.on('user:updated', async (data) => {
  // Update cache
  await redis.set(`user:${data.id}`, JSON.stringify(data));
  // Publish event (creates loop!)
  redis.publish('user:updated', JSON.stringify(data));
});

// This creates infinite loops if not careful!
```

**Good:**
```javascript
redis.on('user:updated', async (data) => {
  // Just update cache, don't re-publish
  await redis.set(`user:${data.id}`, JSON.stringify(data));
  // No event republishing
});
```

---

## Part 5: Real-World Invalidation Failures

### Failure 1: E-commerce Price Caching

**Scenario:** Retailer caches product prices with 24-hour TTL. Flash sale happens.

```
9:00 AM: Sale starts, prices drop $100
9:00 AM: Database updated with new prices
9:00 AM: Cache NOT invalidated (no code path for sale activation)
9:01 AM: Customers see OLD prices on website
6:00 PM: Cache expires, new prices finally show up
Impact: 9 hours of serving wrong prices, potential revenue loss
```

**Solution:**
```javascript
// Track price changes
async function setPriceChange(productId, newPrice, saleEvent) {
  await db.products.update({ id: productId }, { price: newPrice });
  
  // Immediate cache invalidation
  await redis.del(`product:${productId}`);
  
  // Log price change for audit
  await db.priceChangeLog.insert({
    productId,
    oldPrice,
    newPrice,
    saleEvent,
    timestamp: Date.now()
  });
  
  // Publish event for real-time subscribers
  redis.publish('price:changed', JSON.stringify({ productId, newPrice }));
}
```

---

### Failure 2: User Permission Caching Gone Wrong

**Scenario:** Admin grants user new permission. User still can't access.

```
3:00 PM: Admin grants user 'admin' role
3:00 PM: Database updated
3:00 PM: Cache NOT invalidated (admin interface forgot to)
3:01-3:30 PM: User can't access admin panel (cached old permissions)
4:00 PM: Cache expires, permissions finally visible
```

**Solution:**
```javascript
async function grantPermission(userId, permission) {
  // Update database
  await db.permissions.insert({ userId, permission });
  
  // CRITICAL: Immediate cache invalidation
  await redis.del(`user:${userId}:permissions`);
  await redis.del(`user:${userId}:roles`);
  
  // Also invalidate cached auth tokens for this user
  await redis.del(`session:${userId}:*`);  // Force re-login to pick up new perms
}
```

---

### Failure 3: Database Replica Cache Lag

**Scenario:** Cache reads from database replica with 5-second replication lag.

```
3:00 PM: User updates profile on primary DB
3:00 PM: Cache invalidated successfully
3:00 PM: But reads still from replica
3:00-3:05 PM: Replica hasn't received update yet
3:00-3:05 PM: User sees old profile despite cache invalidation
3:05 PM: Replica catches up, new data finally visible
```

**Solution:**
```javascript
// Write to primary, read from primary after writes
async function updateProfile(userId, updates) {
  // Write to PRIMARY
  const updated = await db.primary.execute(
    'UPDATE users SET ? WHERE id = ?',
    [updates, userId]
  );
  
  // Invalidate cache
  await redis.del(`profile:${userId}`);
  
  // Return fresh data directly instead of from cache
  return updated;
}

// But also handle replication lag in reads
async function getProfile(userId) {
  // After recent write, always read from primary (no cache)
  if (recentWrite(userId)) {
    return db.primary.query('SELECT * FROM users WHERE id = ?', [userId]);
  }
  
  // Otherwise, cache-aside is fine
  const cached = await redis.get(`profile:${userId}`);
  if (cached) return JSON.parse(cached);
  
  const profile = await db.replica.query('SELECT * FROM users WHERE id = ?', [userId]);
  await redis.setEx(`profile:${userId}`, 3600, JSON.stringify(profile));
  return profile;
}
```

---

### Failure 4: Cache Invalidation Data Race

**Scenario:** Two concurrent updates race to invalidate cache.

```
3:00:00.000: Request A updates name to 'Alice'
3:00:00.001: Request B updates name to 'Bob'
3:00:00.010: A invalidates cache
3:00:00.020: B invalidates cache (no-op, already gone)
3:00:00.050: Cache miss, fetch from DB
Database has: 'Bob' (B's values)
Cache gets: 'Bob'
Result: Correct, but only by luck
```

**Real problem:** What if B updated first?

```
3:00:00.000: Request A starts (fetch, update DB)
3:00:00.001: Request B starts (fetch, update DB)
3:00:00.050: Request A finishes DB update with data from old cache
3:00:00.075: Request A invalidates cache
3:00:00.100: Request B finishes DB update (overwrites A's changes)
3:00:00.125: Request B invalidates cache (already invalidated)
Cache: Empty
Next read: Fetches 'Bob' (B's values, correct)
Database: Actually has 'Bob' (B won the race)
Application: Doesn't know A's changes were lost!
```

**Solution:** Use timestamps/versions:

```javascript
async function updateProfile(userId, updates, expectedVersion) {
  // Optimistic locking: only update if version unchanged
  const updated = await db.execute(
    'UPDATE users SET ?, version = version + 1' +
    'WHERE id = ? AND version = ?',
    [updates, userId, expectedVersion]
  );
  
  if (updated.affectedRows === 0) {
    // Lost race, someone else updated too
    throw new Error('Conflict: user was updated by another request');
  }
  
  // Invalidate with confidence
  await redis.del(`user:${userId}`);
  
  return {
    ...updates,
    version: expectedVersion + 1
  };
}
```

---

### Failure 5: The Phantom Invalidation

**Scenario:** Cache key format changes, old invalidation code can't find keys.

```
// Old code (cache key: 'user:1')
await redis.del('user:1');

// New code changed key format to 'users:by:id:1'
// But invalidation code wasn't updated!
// Old keys never get deleted, stale data persists

// Later, someone queries old key by accident, gets 3-year-old user data
```

**Solution:**
```javascript
// Centralize cache key generation
const cacheKeys = {
  user: (id) => `users:by:id:${id}`,
  userProfile: (id) => `users:profile:${id}`,
  userPermissions: (id) => `users:permissions:${id}`,
};

// Use everywhere
async function getUser(userId) {
  const key = cacheKeys.user(userId);
  const cached = await redis.get(key);
  // ...
}

async function invalidateUser(userId) {
  const key = cacheKeys.user(userId);
  await redis.del(key);
  // When key format changes, change it in ONE place
}
```

---

## Part 6: Invalidation Strategy Comparison

| Strategy | Consistency | Complexity | Stale Window | When to Use |
|----------|-------------|-----------|--------------|-------------|
| **TTL Only** | Eventually | Low | 0 to TTL | Infrequent changes |
| **Event-Based** | High | Medium | ~1ms | Frequent changes, critical data |
| **Versioned Keys** | High | Medium | 0ms | High-frequency data |
| **Broadcast** | Eventually | High | 0 to network latency | Multi-instance systems |
| **Lazy Invalidation** | Eventually | Medium | 0 to check time | Validation-heavy reads |

---

## Part 7: Implementation Checklist

- [ ] Identify all database write paths (INSERT, UPDATE, DELETE)
- [ ] Map which cache keys depend on each data change
- [ ] Implement invalidation for every write path
- [ ] Add logging/metrics for invalidation events
- [ ] Test cache invalidation with unit tests
- [ ] Test race conditions (concurrent updates)
- [ ] Handle Redis failures gracefully (don't crash on invalidation failure)
- [ ] Monitor for stale data (cache hit rate anomalies)
- [ ] Document cache key formats and dependencies
- [ ] Set up alerting for excessive cache misses
- [ ] Implement batch invalidation for large datasets
- [ ] Review code for "forgotten invalidations"
- [ ] Test distributed invalidation (multi-instance)
- [ ] Implement cache versioning if needed
- [ ] Set up cache warming for critical data

---

## Conclusion

Cache invalidation is the hardest part of caching because:

1. **It's distributed**: Changes happen in database, must propagate to cache across multiple instances
2. **It's asynchronous**: Network latency means updates aren't instant
3. **It's easy to miss**: Forgotten in one code path = stale data
4. **It's hard to test**: Race conditions appear randomly in production

The best strategy combines multiple approaches:
- **TTL as safety net** (guarantee eventual freshness)
- **Event-based for critical data** (near-instant consistency)
- **Monitoring & alerts** (detect when stale data sneaks through)
- **Centralized cache keys** (prevent format mismatches)

Next: Module 08.4 explores Pub/Sub patterns for scaling invalidation across distributed systems.
