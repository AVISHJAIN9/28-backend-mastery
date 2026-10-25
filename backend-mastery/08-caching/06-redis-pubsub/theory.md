# Module 08.6: Redis Pub/Sub Pattern

## What is Redis Pub/Sub?

**Pub/Sub** (Publish/Subscribe) is a messaging pattern where publishers send messages to named channels, and subscribers receive messages published to those channels they're listening to. It's used for **real-time event broadcasting** with no message persistence.

**Key Difference from Queues:**
- **Queues (Jobs)**: Messages persist until consumed; one consumer processes each message
- **Pub/Sub**: Messages are transient; delivered only to active subscribers; no persistence

**Flow:**
```
Publisher sends message to channel:example
    ↓
Redis broadcasts to ALL active subscribers on channel:example
    ├─ Client A receives immediately
    ├─ Client B receives immediately
    └─ If Client C isn't subscribed, misses the message
```

## When to Use Pub/Sub

### ✅ Good Use Cases
- **Real-time notifications** - Alert all connected users
- **Chat rooms** - Broadcast messages to room members
- **Live updates** - Stock prices, scores, activity feeds
- **Event broadcasting** - System events to multiple services
- **Presence tracking** - Online/offline status changes
- **Collaborative features** - Typing indicators, cursor positions

### ❌ Bad Use Cases
- **Critical job processing** - Use Queues (BullMQ) instead
- **Message guarantee required** - Pub/Sub loses messages if no subscribers
- **Offline delivery** - Messages don't persist
- **Fire-and-forget without delivery confirmation** - No acknowledgment

## Architecture

### Core Components

1. **Publisher** - Sends messages to channels
   ```javascript
   redis.publish('notifications', JSON.stringify({ userId: 123, message: 'Hello' }));
   ```

2. **Subscriber** - Listens to channels
   ```javascript
   subscriber.subscribe('notifications', (message) => console.log(message));
   ```

3. **Channel** - Named communication pathway
   - Channels are created dynamically
   - No pre-registration needed
   - Pattern matching supported (e.g., `user:*:messages`)

### Message Flow

```
┌─────────────┐
│ Publisher A │ ──┐
└─────────────┘   │
                  ├──→ Redis ──→ Channel: chat:general
┌─────────────┐   │
│ Publisher B │ ──┘
└─────────────┘

Redis broadcasts to all subscribers:
    ├─→ Subscriber A (connected)
    ├─→ Subscriber B (connected)
    └─→ Subscriber C (disconnected - MISSES message)
```

## Implementation Patterns

### 1. Basic Pub/Sub

```javascript
const redis = require('redis');
const pub = redis.createClient();
const sub = redis.createClient();

// Subscribe
sub.subscribe('channel:alerts', (message) => {
  console.log('Alert:', message);
});

// Publish
pub.publish('channel:alerts', 'System maintenance in 5 minutes');
```

### 2. Pattern-Based Subscriptions

```javascript
// Subscribe to pattern
sub.pSubscribe('user:*/messages', (message, channel) => {
  console.log(`Channel: ${channel}, Message: ${message}`);
});

// Publishers send to specific channels
pub.publish('user:123/messages', 'Hello User 123');
pub.publish('user:456/messages', 'Hello User 456');
```

### 3. Multiple Channels

```javascript
const channels = ['notifications', 'alerts', 'updates'];
channels.forEach(ch => sub.subscribe(ch));

sub.on('message', (channel, message) => {
  console.log(`[${channel}]: ${message}`);
});
```

### 4. Request/Reply Pattern (Pseudo-RPC)

```javascript
// Server waiting for requests
sub.subscribe('requests:calculate', async (jsonData) => {
  const data = JSON.parse(jsonData);
  const result = data.a + data.b;
  pub.publish(data.replyChannel, JSON.stringify({ result }));
});

// Client sends request and waits for reply
const replyChannel = `reply:${Date.now()}`;
const replySub = redis.createClient();
replySub.subscribe(replyChannel, (reply) => {
  console.log('Result:', reply);
});

pub.publish('requests:calculate', JSON.stringify({
  a: 10,
  b: 20,
  replyChannel
}));
```

## Advanced Topics

### 1. Avoiding Message Loss

**Problem**: If no subscriber exists when message is published, it's lost forever.

**Solutions:**

**a) Use Message Queue instead**
```javascript
// Use Bull/BullMQ for guaranteed delivery
const queue = new Queue('tasks', { connection: redis });
await queue.add('taskType', { data });
```

**b) Pre-subscribe before publishing**
```javascript
// Ensure subscribers are connected BEFORE publishing
await subscriber.subscribe('channel');
// Now safe to publish
await publisher.publish('channel', 'message');
```

**c) Hybrid approach (Event Sourcing)**
```javascript
// 1. Store event to database
await db.events.insert({ type: 'userCreated', data: {} });
// 2. Publish to subscribers
redis.publish('events', JSON.stringify({ type: 'userCreated' }));
// 3. New subscribers can check event history
```

### 2. Handling Disconnections

```javascript
subscriber.on('error', (err) => {
  logger.error('Subscriber error', err);
});

subscriber.on('disconnect', () => {
  logger.warn('Lost Redis connection, reconnecting...');
  // Reconnect and re-subscribe
  setTimeout(() => resubscribe(), 1000);
});

async function resubscribe() {
  await subscriber.connect();
  await subscriber.subscribe('channel1', 'channel2');
}
```

### 3. Channel Namespacing

```javascript
const ROOT = 'v1';

const channels = {
  USER_CREATED: `${ROOT}:user:created`,
  USER_DELETED: `${ROOT}:user:deleted`,
  CHAT_MESSAGE: `${ROOT}:chat:message:${roomId}`,
  NOTIFICATION: `${ROOT}:notifications:${userId}`
};

// Publish
redis.publish(channels.USER_CREATED, JSON.stringify({ userId: 123 }));

// Subscribe
subscriber.subscribe(channels.NOTIFICATION);
```

### 4. Metrics and Monitoring

```javascript
const metrics = {
  messagesPublished: 0,
  messagesReceived: 0,
  errors: 0,
  activeSubs: 0
};

redis.on('message', (channel, message) => {
  metrics.messagesReceived++;
  metrics[channel] = (metrics[channel] || 0) + 1;
});

// Monitor
setInterval(() => {
  console.log(`Pub/Sub Metrics:`, metrics);
  metrics.messagesReceived = 0; // Reset
}, 60000);
```

## Common Patterns

### Room Broadcasting (Chat)

```javascript
class ChatService {
  constructor(redis) {
    this.redis = redis;
    this.subscribedRooms = new Map();
  }

  async joinRoom(userId, roomId) {
    const channel = `room:${roomId}`;
    const sub = redis.createClient();
    await sub.subscribe(channel, (message) => {
      console.log(`User ${userId} in room ${roomId}:`, message);
    });
    this.subscribedRooms.set(`${userId}:${roomId}`, sub);
  }

  async sendToRoom(roomId, message) {
    const channel = `room:${roomId}`;
    await this.redis.publish(channel, JSON.stringify(message));
  }

  async broadcast(message) {
    await this.redis.publish('global:messages', JSON.stringify(message));
  }
}
```

### Event Notification System

```javascript
class NotificationService {
  constructor(redis) {
    this.redis = redis;
  }

  // Subscribe to user's personal channel
  listenForNotifications(userId, callback) {
    const sub = redis.createClient();
    sub.subscribe(`user:${userId}:notifications`, callback);
    return sub;
  }

  // Send notification to specific user
  async notifyUser(userId, notification) {
    await this.redis.publish(
      `user:${userId}:notifications`,
      JSON.stringify(notification)
    );
  }

  // Broadcast to all users (using pattern)
  async broadcastToAll(message) {
    // Note: This reaches only already-subscribed users
    await this.redis.publish('broadcast', JSON.stringify(message));
  }
}
```

## Comparison: Pub/Sub vs Other Patterns

| Feature | Pub/Sub | Queue | Streams |
|---------|---------|-------|---------|
| **Persistence** | ❌ No | ✅ Yes | ✅ Yes |
| **Guarantee** | ❌ None | ✅ Yes | ✅ Yes |
| **1:1 or 1:N** | 1:N | 1:1 | 1:N |
| **Latency** | ⚡ Low | ⏱️ Configurable | ⏱️ Low |
| **Use Case** | Real-time | Background jobs | Event log |
| **Message Loss** | ✅ Possible | ❌ Safe | ❌ Safe |
| **Subscriber Absent** | ❌ Lost | ✅ Queued | ✅ Persisted |

## Anti-Patterns

### ❌ Anti-Pattern 1: Relying on Pub/Sub for Critical Data
```javascript
// BAD - What if user isn't listening?
redis.publish('critical:alert', 'Your account compromised');

// GOOD - Use combination with persistent storage
await db.alerts.insert({ userId, message: 'Account compromised' });
redis.publish('notification', JSON.stringify({ userId, message }));
```

### ❌ Anti-Pattern 2: No Error Handling
```javascript
// BAD
subscriber.subscribe('channel', (msg) => {
  processMessage(msg); // What if processMessage throws?
});

// GOOD
subscriber.subscribe('channel', async (msg) => {
  try {
    await processMessage(msg);
  } catch (err) {
    logger.error('Processing failed', { msg, error: err });
    // Optionally publish to dead-letter channel
    redis.publish('dlq', JSON.stringify({ msg, error: err.message }));
  }
});
```

### ❌ Anti-Pattern 3: Unlimited Subscribers
```javascript
// BAD - New subscriber for every request
app.get('/subscribe/:room', (req, res) => {
  const sub = redis.createClient();
  sub.subscribe(req.params.room); // Exhausts Redis memory
});

// GOOD - Reuse connections, use Socket.io
io.on('connection', (socket) => {
  socket.on('join-room', (room) => {
    socket.join(room);
  });
});
```

## Performance Considerations

### Throughput
- **Pub**: ~22,500 msgs/sec (on single Redis instance)
- **Sub**: Depends on message size and processing

### Latency
- **Network latency**: ~0.1ms (local) to 10ms (cloud)
- **Redis latency**: ~0.05ms
- **Processing**: Depends on subscriber code

### Memory
- **Messages**: Not stored (transient)
- **Subscriptions**: ~64 bytes per subscription
- **Channels**: Minimal overhead

### When to Shard

```javascript
// Multiple publishers to same channel
app1.publish('channel', msg);
app2.publish('channel', msg);
// Both reach all subscribers - OK

// But if one process is bottleneck:
// Use multiple publishers
publishers.forEach(pub => pub.publish(channel, msg));
```

## Real-World Examples

### 1. Live Chat
```javascript
class LiveChat {
  async sendMessage(roomId, userId, text) {
    const message = { userId, text, timestamp: Date.now() };
    // Publish to room
    redis.publish(`room:${roomId}`, JSON.stringify(message));
    // Store in database for history
    db.messages.insert({ roomId, ...message });
  }
}
```

### 2. User Activity Feed
```javascript
class ActivityService {
  async recordActivity(userId, action) {
    const event = { userId, action, timestamp: Date.now() };
    // Notify followers
    const followers = await db.followers.find({ followingId: userId });
    followers.forEach(f => {
      redis.publish(`user:${f.userId}:feed`, JSON.stringify(event));
    });
  }
}
```

### 3. System Alerts
```javascript
class AlertService {
  async alertAdmins(severity, message) {
    const alert = { severity, message, timestamp: Date.now() };
    // All admin clients subscribed to this
    redis.publish('admin:alerts', JSON.stringify(alert));
  }
}
```

## Troubleshooting

| Problem | Root Cause | Solution |
|---------|-----------|----------|
| Messages not received | Subscriber not listening when published | Pre-subscribe before publishing; use Queues for critical data |
| High memory usage | Too many subscribers/connections | Connection pooling, reduce channels |
| Latency spikes | Network congestion | Monitor Redis CPU/memory; add caching |
| Lost messages | Subscriber disconnected | Persist critical messages separately |
| Slow processing | Blocking callback | Make callbacks async; use workers |

## Summary

- **Pub/Sub**: Real-time, transient, no persistence
- **Use for**: Chat, notifications, live updates, presence
- **Don't use for**: Critical data, guaranteed delivery, offline processing
- **Redis limits**: Max subscribers per channel is unlimited; message throughput ~22k/sec
- **Best practice**: Combine Pub/Sub with persistent storage for important messages
