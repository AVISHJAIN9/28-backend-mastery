# Pub/Sub Pattern - Module 08.4

## Quick Start

```bash
# Install dependencies
npm install

# Start Redis (if not running)
redis-server

# Start backend server (port 6404)
npm run dev

# Start React frontend (port 3000)
npm start
```

Then:
- **Single Instance:** http://localhost:3000
- **Multiple Instances:** Start multiple servers:
  - Terminal 1: `npm run dev` (port 6404)
  - Terminal 2: `HTTP_PORT=6405 npm run dev` (port 6405)
  - Terminal 3: `HTTP_PORT=6406 npm run dev` (port 6406)
  - Open http://localhost:3000 in multiple tabs and watch real-time sync

---

## What is Redis Pub/Sub?

**Pub/Sub** is a messaging pattern where publishers send messages to channels and subscribers listen for messages in real-time.

### Problem It Solves

When you have multiple backend servers (load balanced):

```
Web Server A          Web Server B          Web Server C
    |                     |                      |
    └──────────────────┬──────────────────┬──────┘
                       |
                   Load Balancer
                       |
                    Database
```

If Server A updates a user and invalidates its cache, Servers B and C don't know about it. They still serve stale data!

**Pub/Sub synchronizes this:**

```
Server A: "User 1 changed!"
    ↓
Redis Pub/Sub Channel: 'cache:invalidation'
    ↓ (instantly broadcast to all subscribers)
Server B: Receive event → Delete cache
Server C: Receive event → Delete cache

Result: All servers serve fresh data from next request
```

---

## Architecture

### Single Server (No Pub/Sub)

```
Request 1: GET /user/1
  → Server A: Cache miss
  → Fetch from DB
  → Store in cache
  → Return user

Request 2 (Server B): GET /user/1
  → Server B: Cache miss
  → Fetch from DB again (stale!)
  → Return user
```

### Multiple Servers (With Pub/Sub)

```
Request 1: PUT /user/1 (on Server A)
  → Update database
  → redis.delete('user:1') on Server A
  → redis.publish('cache:invalidation', { key: 'user:1' })
     ↓ (broadcast to all)
  → Server B receives: delete cache
  → Server C receives: delete cache

Request 2 (Server B): GET /user/1
  → Server B: Cache miss (just deleted)
  → Fetch from DB
  → Return fresh user

Result: Consistent across all servers!
```

---

## API Endpoints (10 Total)

### 1. GET /api/user/:id
Fetch user from cache (checks: local cache → Redis → database).

```javascript
GET /api/user/1
// Returns: { user: {...}, source: 'local-cache'|'redis-cache'|'database' }
```

### 2. POST /api/user/:id
Update user and publish invalidation event.

```javascript
POST /api/user/1
{ "name": "Alice Updated", "email": "alice@test.com" }

// Action:
// 1. Update database
// 2. Delete local cache on this instance
// 3. redis.publish('cache:invalidation', {...})
// 4. ALL subscribing instances receive event
// 5. ALL subscribing instances delete their caches
```

### 3. POST /api/user/:id/cascade
Publish cascade event that invalidates user + related caches.

```javascript
POST /api/user/1/cascade

// Invalidates on all instances:
// - user:1
// - user:1:profile
// - user:1:permissions
// - user:1:roles
// - user:1:settings
```

### 4. POST /api/cache/batch-invalidate
Publish batch invalidation for multiple unrelated keys.

```javascript
POST /api/cache/batch-invalidate
{ "keys": ["order:100", "product:50", "session:xyz"] }

// All instances receive and delete all 3 keys at once
```

### 5. POST /api/user/:id/multi-publish
Publish to multiple channels for guaranteed delivery.

```javascript
POST /api/user/1/multi-publish

// Publishes same event to 3 channels:
// - cache:invalidation
// - cache:cascade
// - cache:batch

// Different subscriber groups might listen to different channels
// This ensures the event reaches everyone
```

### 6. POST /api/health/heartbeat
Publish heartbeat event (for monitoring).

```javascript
POST /api/health/heartbeat

// Returns: { instance: 'server-abcd12', timestamp, memory, uptime, cacheSize }
```

### 7. GET /api/metrics
Get Pub/Sub metrics for this instance.

```javascript
GET /api/metrics

// Returns:
// {
//   instance: 'server-a',
//   metrics: {
//     published: 5,
//     received: 12,
//     invalidations: 15,
//     localCacheSize: 3
//   },
//   recentMessages: [...]
// }
```

### 8. GET /api/cache/state
Peek at local cache on this instance.

```javascript
GET /api/cache/state

// Returns:
// {
//   instance: 'server-a',
//   cacheSize: 10,
//   keys: ['user:1', 'user:2', 'user:3', ...],
//   values: { 'user:1': {...}, 'user:2': {...}, ... }
// }
```

### 9. POST /api/cache/clear
Clear all local cache on this instance.

```javascript
POST /api/cache/clear

// Returns: { success: true, previousSize: 10, currentSize: 0 }
```

### 10. POST /api/metrics/reset
Reset all metrics counters.

```javascript
POST /api/metrics/reset
```

---

## How Pub/Sub Works in Code

### Setup (Subscriber - All Instances)

```javascript
const subscriber = createClient();
subscriber.subscribe('cache:invalidation', 'cache:cascade', 'cache:batch');

subscriber.on('message', (channel, message) => {
  const event = JSON.parse(message);
  
  if (channel === 'cache:invalidation') {
    // Single key invalidation
    localCache.delete(event.key);
  } else if (channel === 'cache:cascade') {
    // Multiple related keys
    for (const key of event.cascadeKeys) {
      localCache.delete(key);
    }
  } else if (channel === 'cache:batch') {
    // Batch of unrelated keys
    for (const key of event.keys) {
      localCache.delete(key);
    }
  }
});
```

### Publishing (Writer - One Server)

```javascript
async function updateUser(userId, updates) {
  // Update database
  const user = await db.users.update({ id: userId }, updates);
  
  // Delete own cache
  localCache.delete(`user:${userId}`);
  
  // Publish event to ALL instances
  await redis.publish('cache:invalidation', JSON.stringify({
    type: 'user_updated',
    key: `user:${userId}`,
    timestamp: Date.now()
  }));
  
  return user;
}
```

---

## Key Concepts

### Fire-and-Forget Delivery

Pub/Sub delivers events to subscribers that are **currently listening**. If a server is offline, it misses the event forever.

```
Server A publishes at 10:00:00
Server B is offline until 10:00:10

Result: Server B never receives the event!
(This is why TTL-based cache expiration is critical)
```

### Multiple Channels

Different channels for different purposes:

```javascript
// Cache channel: invalidation events
redis.subscribe('cache:invalidation');

// Health channel: heartbeat events
redis.subscribe('health:heartbeat');

// Real-time channel: user activity
redis.subscribe('activity:live');
```

### Pattern Subscription

Listen to multiple channels with wildcard:

```javascript
// Listen to all cache channels
redis.subscribe('cache:*');

// Listen to all user events
redis.subscribe('user:*');
```

But pattern subscriptions have overhead - use selectively!

---

## Real-World Usage Scenarios

### Scenario 1: E-commerce Price Change

```javascript
// Admin updates product price
POST /api/products/789/price { "newPrice": 29.99 }

// Server A:
// 1. Update database
// 2. redis.publish('price:changed', { productId: 789, oldPrice, newPrice })
// 3. Clear local cache

// All other servers:
// 1. Receive 'price:changed' event
// 2. Clear product:789:price from cache
// 3. Clear pricelist caches that contain this product

// Result: Price updates visible on all instances within 5-10ms
```

### Scenario 2: Permission Changes

```javascript
// Admin grants user new permission
POST /api/users/1/permissions { "permission": "admin" }

// Server A:
// 1. Update database
// 2. redis.publish('user:permissions:changed', { userId: 1 })
// 3. Delete user:1:permissions cache

// All other servers:
// 1. Receive event
// 2. Delete user:1:permissions from cache
// 3. Delete user:1:roles cache
// 4. Invalidate session cache (force re-login to pick up new perms)

// Result: Permissions take effect immediately across all instances
```

### Scenario 3: Multi-Tenant Isolation

```javascript
// Tenant A's data must not appear in Tenant B's cache

// When Tenant A's data changes:
redis.publish('tenant:1:invalidation', { keys: [...] });

// Only Tenant A's subscribers listen to 'tenant:1:invalidation'
const tenantASubscriber = createClient();
tenantASubscriber.subscribe('tenant:1:invalidation');

// Tenant B is unaffected
const tenantBSubscriber = createClient();
tenantBSubscriber.subscribe('tenant:2:invalidation');
```

---

## Common Mistakes

### Mistake 1: Forgetting to Subscribe

```javascript
// ❌ Bad: Publishing without subscribers
redis.publish('cache:invalidation', 'user:1');

// ✗ No one listens, messages are lost!
// ✗ Instances don't invalidate caches
```

**Fix:**
```javascript
// Ensure ALL instances subscribe FIRST
subscriber.subscribe('cache:invalidation');

// THEN publish
redis.publish('cache:invalidation', 'user:1');
```

---

### Mistake 2: Publishing From Wrong Connection

```javascript
// ❌ Bad: Can't publish and subscribe on same connection
const redis = createClient();
redis.subscribe('cache:invalidation');
redis.publish('cache:invalidation', 'data');  // Error!
// Once in subscribe mode, can't publish

// ✅ Good: Separate connections
const subscriber = createClient();
subscriber.subscribe('cache:invalidation');

const publisher = createClient();
publisher.publish('cache:invalidation', 'data');
```

---

### Mistake 3: Expecting Guaranteed Delivery

```javascript
// ❌ Bad assumption: "Pub/Sub guarantees delivery"
redis.publish('invalidation', 'user:1');
// Assume all instances will receive it

// Reality: If server offline at this moment, it misses forever!

// ✅ Good: Combine strategies
// 1. Pub/Sub for fast consistency
// 2. TTL for eventual consistency (safety net)
// 3. Database queue for missed events
```

---

### Mistake 4: Blocking Subscriber Handlers

```javascript
// ❌ Bad: Synchronous database call blocks all other messages
subscriber.on('message', (channel, message) => {
  const user = db.users.findById(data.userId);  // Blocks!
  // Other messages wait, piling up...
});

// ✅ Good: Non-blocking async handlers
subscriber.on('message', async (channel, message) => {
  const user = await db.users.findById(data.userId);  // Non-blocking
  // Other messages can process in parallel
});
```

---

### Mistake 5: Publishing Too Frequently

```javascript
// ❌ Bad: Publish on every cache update
for (const key of keysToDelete) {
  redis.publish('cache:invalidation', JSON.stringify({ key }));
}

// Result: 1000 events/second from 10 servers
// = 10,000 Redis I/O operations/second
// = Bottleneck!

// ✅ Good: Batch updates into single event
const keysToDelete = ['user:1', 'user:2', 'user:3'];
redis.publish('cache:batch', JSON.stringify({ keys: keysToDelete }));
// 1 event instead of 3
```

---

## Implementation Checklist

- [ ] Set up separate Redis connections for pub/sub
- [ ] Design channel naming convention
- [ ] Implement subscriber with error handling
- [ ] Add logging for all published events
- [ ] Use async message handlers (non-blocking)
- [ ] Test with multiple instances
- [ ] Monitor message throughput
- [ ] Set up fallback (TTL + database queue)
- [ ] Implement batch publishing to reduce overhead
- [ ] Add heartbeat monitoring for instance health
- [ ] Document all channels and event schemas
- [ ] Test behavior when subscriber goes offline
- [ ] Implement handler timeouts (don't block forever)

---

## Pub/Sub Channels in This Module

| Channel | Purpose | Event Schema |
|---------|---------|--------------|
| `cache:invalidation` | Single-key invalidation | `{ type, key, userId, timestamp }` |
| `cache:cascade` | Multiple related keys | `{ userId, cascadeKeys, timestamp }` |
| `cache:batch` | Batch invalidation | `{ keys, timestamp }` |
| `health:heartbeat` | Instance health monitoring | `{ instance, timestamp, memory, uptime }` |

---

## Comparison: Pub/Sub vs Alternatives

| Feature | Pub/Sub | Queues (Streams) | WebSockets | HTTP |
|---------|---------|------------------|-----------|------|
| **Real-time** | ✓ Yes | No | ✓ Yes | No |
| **Persistent** | ✗ No | ✓ Yes | ✗ No | ✗ No |
| **Guaranteed Delivery** | ✗ No | ✓ Yes | ✗ No | ✓ Yes |
| **Use Case** | Notifications | Queuing | Frontend | APIs |
| **Latency** | ~1-5ms | Variable | ~50ms | ~100ms |

**This Module Uses:** Pub/Sub (best for real-time cache invalidation)
**Next Module:** Queues (for reliable task processing)

---

## Conclusion

Redis Pub/Sub solves the **distributed cache invalidation problem**:

1. **Fast:** Event reaches all instances in 5-10ms
2. **Simple:** Single `publish()` call reaches 100+ servers
3. **Decoupled:** Instances don't need to know about each other (no direct connections)

But remember its limitations:
- **No persistence** (offline instances miss messages)
- **No guaranteed delivery** (network issues = lost events)
- **Fire-and-forget model** (no retry mechanism)

**Best practice:** Combine Pub/Sub with:
- **TTL-based expiration** (guarantees eventual freshness)
- **Database queue** (for missed event recovery)
- **Heartbeat monitoring** (detect failed instances)

---

## Next Module

**Module 08.5: Write-Through Caching** - Keep cache and database synchronized by always writing to cache first, then database.
