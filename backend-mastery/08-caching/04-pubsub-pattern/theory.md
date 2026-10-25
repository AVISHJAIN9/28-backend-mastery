# Pub/Sub Pattern in Redis - Module 08.4

## Introduction

The **Publish/Subscribe (Pub/Sub)** pattern is a messaging paradigm where senders (publishers) broadcast messages to channels without knowing who will receive them. Subscribers listen to channels and receive messages in real-time.

In the context of caching, Pub/Sub solves a critical problem: **How do you invalidate caches across multiple distributed instances simultaneously?**

In a single-machine application, you invalidate cache in memory. But what when you have 10 web servers, each with their own Redis client and local caches? If one server invalidates a cache key, the other 9 might still serve stale data. Pub/Sub synchronizes invalidations across all instances instantly.

---

## Part 1: Pub/Sub Fundamentals

### How Pub/Sub Works

```
Publisher (Server A): "User 1 just changed roles!"
     ↓
Redis Channel: 'cache:invalidation'
     ↓
Subscribers (All instances listening):
  - Server A (publisher also subscribes)
  - Server B
  - Server C
  - ...
     ↓
All servers react: Delete 'user:1' from their local caches
```

### Basic Example

```javascript
// Publisher
const redis = createClient();
await redis.publish('cache:invalidated', JSON.stringify({
  type: 'user_updated',
  userId: 1,
  timestamp: Date.now()
}));

// Subscriber
const subscriber = createClient();
subscriber.subscribe('cache:invalidated');
subscriber.on('message', (channel, message) => {
  const { type, userId } = JSON.parse(message);
  
  if (type === 'user_updated') {
    // Invalidate cache on this instance
    localCache.delete(`user:${userId}`);
    console.log(`Invalidated user:${userId} on this instance`);
  }
});
```

### Key Characteristics

| Aspect | Pub/Sub | Queues (next module) |
|--------|--------|-----|
| **Persistence** | No | Yes |
| **Delivery Guarantee** | None (fire-and-forget) | At least once |
| **Use Case** | Real-time notifications | Reliable task processing |
| **Subscriber Count** | Many | One at a time |
| **History** | None | Full queue history |

---

## Part 2: Cache Invalidation with Pub/Sub

### Pattern: Distributed Cache Invalidation

```
User Service (Server A):
  1. Update database
  2. Delete own cache
  3. Publish 'user:updated' event

All Services (Servers A, B, C, ...):
  1. Receive 'user:updated' event
  2. Delete cache on their instance
  3. Next read fetches fresh data
```

### Implementation

```javascript
// ========== Publisher (usually a write operation) ==========
async function updateUser(userId, updates) {
  // Update database
  const user = await db.users.update({ id: userId }, updates);
  
  // Invalidate own cache
  delete localCache[`user:${userId}`];
  
  // Publish event to all instances
  await redis.publish('cache:invalidation', JSON.stringify({
    action: 'invalidate',
    key: `user:${userId}`,
    type: 'user',
    timestamp: Date.now()
  }));
  
  return user;
}

// ========== Subscriber (all instances listen) ==========
const subscriber = createClient();
subscriber.subscribe('cache:invalidation');

subscriber.on('message', (channel, message) => {
  const event = JSON.parse(message);
  
  if (event.action === 'invalidate') {
    // Remove from local cache
    delete localCache[event.key];
    
    // Also from Redis
    await redis.del(event.key);
    
    logger.info(`[PUB/SUB] Invalidated ${event.key} across all instances`);
  }
});
```

### Real-World Flow

```
Time  Instance A              Redis Channel          Instance B
----  ----------              ---------------         ----------
0ms   POST /api/users/1
      Update DB
      Delete cache: user:1

5ms   publish('cache:invalidation', 'user:1')
                    --------[user:1]--------→ receive event
                                             delete cache: user:1

10ms  GET /api/users/1                       GET /api/users/1
      Cache miss (just deleted)              Cache miss (just deleted)
      Fetch from DB                          Fetch from DB
      Return fresh data                      Return fresh data

Result: Both instances serve fresh data instantly!
Consistency window: ~5-10ms
```

---

## Part 3: Pub/Sub Patterns

### Pattern 1: Direct Invalidation

Simple 1:1 event model - one event type, one action.

```javascript
redis.publish('invalidation', JSON.stringify({
  key: 'user:1'
}));

subscriber.on('message', (channel, message) => {
  const { key } = JSON.parse(message);
  delete localCache[key];
});
```

**Pros:** Simple, minimal overhead
**Cons:** No metadata, hard to debug

---

### Pattern 2: Rich Event Publishing

Include context and metadata for better handling.

```javascript
redis.publish('cache:events', JSON.stringify({
  action: 'INVALIDATE',
  resource: 'user',
  id: 1,
  reason: 'role_changed',
  requestId: 'req-123',
  timestamp: Date.now(),
  version: 2
}));

subscriber.on('message', (channel, message) => {
  const event = JSON.parse(message);
  
  if (event.action === 'INVALIDATE') {
    const key = `${event.resource}:${event.id}`;
    delete localCache[key];
    logger.info(`Invalidated ${key} (reason: ${event.reason})`);
  }
});
```

**Pros:** Traceable, debuggable, extensible
**Cons:** More data per message

---

### Pattern 3: Cascading Invalidations

One event causes multiple cache keys to be invalidated.

```javascript
// Publish single event
redis.publish('cache:cascade', JSON.stringify({
  type: 'user_updated',
  userId: 1
}));

// Subscriber handles cascading
subscriber.on('message', (channel, message) => {
  const { type, userId } = JSON.parse(message);
  
  if (type === 'user_updated') {
    // Cascade: invalidate all related caches
    const keysToDelete = [
      `user:${userId}`,
      `user:${userId}:profile`,
      `user:${userId}:permissions`,
      `user:${userId}:roles`,
      `user:${userId}:settings`
    ];
    
    for (const key of keysToDelete) {
      delete localCache[key];
    }
  }
});
```

---

### Pattern 4: Selective Subscription

Different services subscribe to different events.

```javascript
// User Service
const userSubscriber = createClient();
userSubscriber.subscribe('cache:users');  // Only user events

// Order Service
const orderSubscriber = createClient();
orderSubscriber.subscribe('cache:orders');  // Only order events

// Admin Service
const adminSubscriber = createClient();
adminSubscriber.subscribe('cache:*');  // All events (pattern subscription)
```

---

### Pattern 5: Multi-Channel Broadcasting

Different channels for different resource types.

```javascript
// Publisher publishes to different channels
await redis.publish('cache:users', JSON.stringify({ id: 1 }));
await redis.publish('cache:orders', JSON.stringify({ id: 999 }));
await redis.publish('cache:products', JSON.stringify({ id: 500 }));

// Subscribers listen to relevant channels
subscriber.subscribe('cache:users', 'cache:orders', 'cache:products');

subscriber.on('message', (channel, message) => {
  const event = JSON.parse(message);
  
  if (channel === 'cache:users') {
    delete localCache[`user:${event.id}`];
  } else if (channel === 'cache:orders') {
    delete localCache[`order:${event.id}`];
  } else if (channel === 'cache:products') {
    delete localCache[`product:${event.id}`];
  }
});
```

---

## Part 4: Advanced Pub/Sub Patterns

### Pattern: Health Checks & Heartbeats

Detect instance failure by monitoring message flow.

```javascript
// Periodic healthcheck publisher
setInterval(async () => {
  await redis.publish('health:heartbeat', JSON.stringify({
    instance: 'server-a',
    timestamp: Date.now(),
    memory: process.memoryUsage().heapUsed
  }));
}, 5000);

// Monitor heartbeat on different instance
const lastHeartbeat = {};
subscriber.on('message', (channel, message) => {
  if (channel === 'health:heartbeat') {
    const { instance, timestamp } = JSON.parse(message);
    lastHeartbeat[instance] = timestamp;
  }
});

// Alert if heartbeat missing
setInterval(() => {
  for (const [instance, lastTime] of Object.entries(lastHeartbeat)) {
    const elapsed = Date.now() - lastTime;
    if (elapsed > 15000) {
      alert(`Instance ${instance} might be down (no heartbeat for ${elapsed}ms)`);
    }
  }
}, 10000);
```

---

### Pattern: Rate-Limited Publishing

Don't overwhelm subscribers with too many events.

```javascript
// Batch invalidations instead of individual events
const invalidationQueue = [];
const BATCH_SIZE = 10;
const BATCH_INTERVAL = 100;  // ms

function queueInvalidation(key) {
  invalidationQueue.push(key);
  
  if (invalidationQueue.length >= BATCH_SIZE) {
    flushInvalidations();
  }
}

function flushInvalidations() {
  if (invalidationQueue.length === 0) return;
  
  // Publish all at once instead of N separate events
  redis.publish('cache:batch-invalidation', JSON.stringify({
    keys: [...invalidationQueue],
    timestamp: Date.now()
  }));
  
  invalidationQueue = [];
}

// Timer to flush periodic batches
setInterval(flushInvalidations, BATCH_INTERVAL);

// Subscriber processes batch
subscriber.on('message', (channel, message) => {
  if (channel === 'cache:batch-invalidation') {
    const { keys } = JSON.parse(message);
    
    // Delete all keys at once
    for (const key of keys) {
      delete localCache[key];
    }
  }
});
```

---

### Pattern: PubSub + Persistence Fallback

Pub/Sub is fire-and-forget. Add fallback for reliability.

```javascript
// Publish AND log to database
async function invalidateWithFallback(key) {
  // 1. Publish to all instances
  await redis.publish('cache:invalidation', JSON.stringify({
    key,
    timestamp: Date.now()
  }));
  
  // 2. Store in persistent queue for retry
  await db.invalidationQueue.insert({
    cacheKey: key,
    status: 'published',
    createdAt: new Date()
  });
  
  // 3. Later, fetch queue and re-publish missed events
  // (handles instances that were offline)
}

// Recovery on startup
async function recoverMissedInvalidations() {
  const missed = await db.invalidationQueue.find({
    status: 'published',
    createdAt: { $gte: new Date(Date.now() - 3600000) }  // Last hour
  });
  
  for (const item of missed) {
    redis.publish('cache:invalidation', JSON.stringify({
      key: item.cacheKey,
      recovered: true
    }));
  }
}
```

---

## Part 5: Pub/Sub Limitations & Gotchas

### Limitation 1: No Message Persistence

If subscriber is offline, it misses messages forever.

```javascript
// Publisher
redis.publish('cache:events', 'user:1');  // Broadcasts

// Subscriber (offline at this moment)
// ✗ Doesn't receive message!

// Subscriber comes online later
// ✗ Can't recover missed messages!
```

**Solution:** Use Redis Streams or message queues for reliability.

---

### Limitation 2: No Guaranteed Delivery

Network issue = lost message, no retry.

```javascript
// Publish to 5 instances
redis.publish('invalidation', 'user:1');

// Instance 2 has network hiccup
// ✗ Instance 2 never receives invalidation
// ✗ Serves stale cache for next 1 hour

// Solution: TTL on cache (guarantees eventual freshness)
```

---

### Limitation 3: Subscription Overhead

Too many subscribers = Redis I/O bottleneck.

```javascript
// Each web server subscribes to same channel
redis.subscribe('cache:invalidation');

// 100 web servers × 100 cache invalidation events/second
// = 10,000 message deliveries/second from Redis

// Redis might bottleneck!
// Solution: Use partitioned channels (cache:invalidation:1, ...2, ...3)
```

---

### Limitation 4: Race Conditions

Publisher might be part of its own subscriber group.

```javascript
// Server A publishes
redis.publish('invalidation', 'user:1');

// Server A ALSO subscribes
// ✓ Receives its own message
// ✗ BUT might invalidate BEFORE database write completes
// ✗ Race condition with own write!

// Solution: Ensure DB write completes before publish
```

---

### Limitation 5: Pattern Subscriptions are Slow

Wildcard subscriptions have overhead.

```javascript
// Slow for 100k instances
redis.subscribe('cache:*');  // Pattern matching

// Better: Subscribe to specific channels
redis.subscribe('cache:users', 'cache:orders', 'cache:products');
```

---

## Part 6: Common Mistakes

### Mistake 1: Forgetting to Subscribe

```javascript
// ❌ Bad: Publishing without any subscribers
redis.publish('cache:invalidation', 'user:1');

// ✗ Messages go nowhere (fire-and-forget)
// ✗ Instances don't invalidate caches
// ✗ Stale data returned to clients

// ✅ Good: Ensure subscription before publishing
subscriber.subscribe('cache:invalidation');
subscriber.on('message', (channel, msg) => {
  // Handle message
});
```

---

### Mistake 2: Subscriber on Same Connection as Publisher

```javascript
// ❌ Bad: Can't publish and subscribe on same connection
const redis = createClient();
redis.subscribe('cache:events');
redis.publish('cache:events', 'data');  // Error! Connection in subscribe mode

// ✅ Good: Two separate connections
const subscriber = createClient();
subscriber.subscribe('cache:events');

const publisher = createClient();
publisher.publish('cache:events', 'data');
```

---

### Mistake 3: Blocking Message Handler

```javascript
// ❌ Bad: Synchronous operation blocks all other messages
subscriber.on('message', (channel, message) => {
  const data = JSON.parse(message);
  
  // SLow database call (BLOCKS)
  const user = db.users.findById(data.userId);  // Blocks!
  
  // Other messages queued, waiting...
});

// ✅ Good: Async handler with parallel processing
subscriber.on('message', async (channel, message) => {
  const data = JSON.parse(message);
  
  // Non-blocking async call
  const user = await db.users.findById(data.userId);
  
  // Other messages can be processed in parallel
});
```

---

### Mistake 4: Assuming Message Order

```javascript
// ❌ Bad: Assuming FIFO ordering
// Publish: event1, event2, event3

// Received order might be: event2, event1, event3 (different!)

// Example problem:
// event1: Create user
// event2: Grant permission
// event3: Delete cache

// If received out of order, permission might not exist!
```

---

### Mistake 5: Memory Leaks in Long-Lived Subscribers

```javascript
// ❌ Bad: Subscriber reference keeps growing
const subscribers = [];

function setupSubscriber() {
  const sub = createClient();
  sub.subscribe('events');
  subscribers.push(sub);  // Array grows unbounded
  
  // If called 1000 times, array has 1000 subscribers
  // All listening to same channel!
}

// ✅ Good: Reuse single subscriber
let subscriber = null;

function getSubscriber() {
  if (!subscriber) {
    subscriber = createClient();
    subscriber.subscribe('events');
  }
  return subscriber;
}
```

---

### Mistake 6: Missing Error Handling

```javascript
// ❌ Bad: Subscriber crashes if handler throws
subscriber.on('message', (channel, message) => {
  const data = JSON.parse(message);  // Could throw
  deleteCache(data.key);             // Could throw
  
  // If exception: entire subscriber down!
});

// ✅ Good: Error handling around critical operations
subscriber.on('message', async (channel, message) => {
  try {
    const data = JSON.parse(message);
    await redis.del(data.key);
  } catch (error) {
    logger.error('Message handling failed:', error);
    // Continue processing other messages
  }
});
```

---

## Part 7: Pub/Sub vs Alternatives

### Pub/Sub vs Queues (Redis Streams)

| Feature | Pub/Sub | Streams |
|---------|---------|---------|
| Persistence | ✗ No | ✓ Yes |
| Delivery Guarantee | None | At least once |
| Use Case | Real-time notifications | Reliable task processing |
| Message History | None | Full | Query old messages | No | Yes |
| Consumer Groups | No | Yes |

**Use Pub/Sub for:** Cache invalidation, live event notifications, dashboards
**Use Streams for:** Task queues, event sourcing, audit logs

---

### Pub/Sub vs WebSockets

| Feature | Pub/Sub | WebSockets |
|---------|---------|-----------|
| Direction | Broadcast | Bidirectional |
| Persistence | No | No |
| Delivery | Fire-and-forget | Per-connection |
| Latency | Ultra-low | Low |

**Use Pub/Sub for:** Backend-to-backend communication
**Use WebSockets for:** Frontend-to-backend real-time

---

## Part 8: Implementation Checklist

- [ ] Design channel naming convention (cache:events, cache:users, etc.)
- [ ] Decide on event payload format (JSON, msgpack, etc.)
- [ ] Ensure separate connections for pub/sub
- [ ] Handle subscription errors and reconnection
- [ ] Log all published events for debugging
- [ ] Include timestamps in events
- [ ] Implement async message handlers
- [ ] Add error handling in subscription callbacks
- [ ] Test with concurrent publishers and subscribers
- [ ] Monitor message throughput and latency
- [ ] Set up fallback mechanism (DB, caching, retries)
- [ ] Document channel names and event schemas
- [ ] Consider using pattern subscriptions carefully (performance impact)
- [ ] Test behavior when subscriber goes offline
- [ ] Set up alerts for missed messages

---

## Conclusion

Redis Pub/Sub is perfect for **distributed cache invalidation** because:

1. **Ultra-low latency** (microseconds)
2. **Scales to many subscribers** (100+ servers)
3. **Simple to implement** (single `redis.publish()` call)
4. **Decouples instances** (no direct server-to-server calls)

But remember its limitations:
- **No persistence** (offline instances miss messages)
- **No guaranteed delivery** (network issues = lost events)
- **No message history** (can't recover old events)

**Best practice:** Combine Pub/Sub with TTL-based cache expiration. Pub/Sub gives *fast* consistency across instances. TTL gives *eventual* consistency if Pub/Sub fails.

---

## Next Module

**Module 08.5: Write-Through Caching** - Ensure cache and database stay synchronized using synchronous write-then-read patterns.
