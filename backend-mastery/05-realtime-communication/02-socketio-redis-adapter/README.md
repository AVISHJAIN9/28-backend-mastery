# Socket.io Redis Adapter - Horizontal Scaling

## What is this?

Socket.io Redis Adapter enables **horizontal scaling** of WebSocket connections across multiple servers using Redis pub/sub for message synchronization.

## Why does it matter?

- **Unlimited Scalability** - Add more servers without losing cross-server messaging
- **High Availability** - One server down doesn't break the cluster
- **Global State** - Shared insight into all connections cluster-wide

## How it works (step by step)

### 1. Setup Redis
```javascript
const pubClient = redis.createClient();
const subClient = pubClient.duplicate();
```

### 2. Create adapter
```javascript
const adapter = createAdapter(pubClient, subClient);
io.adapter(adapter);
```

### 3. Messages route through Redis to all servers

## Key concepts

- **Pub/Sub Channel** - Redis channel routing messages
- **Room Broadcasting** - `io.to('room').emit()`
- **Fetch All Sockets** - `io.fetchSockets()`

## Common mistakes

❌ Using single Redis connection for both pub and sub
❌ No Redis failover strategy
❌ Not monitoring Redis latency

## Real world usage

- Multi-server chat applications
- Global notification systems
- Collaborative editing tools
