# Socket.io Redis Adapter - Advanced Scaling Theory

## Why Redis Adapter?

By default, Socket.io stores all connections in server memory. This creates problems:

### Without Redis Adapter
```
Users (1-10k)
    │
    └─→ Single Server
         └─ Memory: ~20MB for 10k connections
         └ Problem: Only serves own connections
```

### With Redis Adapter
```
Users (100k+)
    │
    ├─→ Server 1  ┐
    ├─→ Server 2  ├─→ Redis Pub/Sub ←─→ Synchronized across cluster
    └─→ Server 3  ┘
         
All servers can reach all users regardless of connection location
```

## Redis Pub/Sub Architecture

### Components
1. **Pub Client** - Publishes messages
2. **Sub Client** - Subscribes to channels
3. **Adapter** - Manages pub/sub logic

### Message Flow
```
User A on Server 1 sends message
         ↓
Server 1 publishes to Redis channel
         ↓
Redis broadcasts to all subscribers
         ↓
Server 1, 2, 3 receive message
         ↓
Each server delivers to local users
         ↓
All users get message regardless of server
```

## The Adapter Pattern

Socket.io Adapter implements three key patterns:

### 1. Socket Lookup
Determine which server has a socket:
```javascript
// Client connects to Server 2
// Server 1 needs to send to that socket
io.to(socketId).emit() // Adapter routes through Redis
```

### 2. Room Broadcasting
Broadcast within a room across all servers:
```javascript
io.to('room123').emit()
// Reaches users in room on BOTH Server 1 AND Server 2
```

### 3. Namespace Isolation
Each namespace uses separate Redis channels:
```
/chat uses channel: socket.io#/chat#broadcast
/notifications uses channel: socket.io#/notifications#broadcast
```

## Consistency Model

### Eventual Consistency
- Not all servers see data at exact same time
- Redis Pub/Sub is fire-and-forget
- Typical delay: 5-10ms (acceptable for most apps)

### Implementation
```javascript
// Server 1
io.to('room').emit('update', {score: 100});

// Server 2 (slightly delayed)
socket.on('update', (data) => {
  // May not receive immediately
  // But WILL receive within milliseconds
});
```

## Failover & Resilience

### Redis Failure
If Redis goes down:
```
✅ Connections stay active
✅ Local emit works: socket.emit()
✅ Broadcast to local server: io.emit()
❌ Cross-server messaging fails
✅ Can re-add Redis connection
```

### Server Failure
If Server 1 goes down:
```
- Users on Server 1 disconnect
- Load balancer routes to Server 2
- New connections to Server 2
- Redis has no saved state
- Must re-authenticate users
```

## Performance Characteristics

### Latency
```
Single Server: <1ms
With Redis: ~5-10ms added latency
- Network roundtrip to Redis
- Redis pub/sub processing
- Network back to other servers
```

### Throughput
```
Redis limitation: ~50,000 commands/second
With 3 servers: ~150,000 events/second possible
(each emit can generate multiple Redis commands)
```

### Memory
```
Redis stores:
- Socket metadata
- Room assignments
- Session data

Typical: 1-5MB per 1000 connections
```

## Clustering Strategies

### Strategy 1: Sticky Sessions
Same user always goes to same server:
```
Load Balancer
    ├─ Server 1 (User 1, 3, 5)
    ├─ Server 2 (User 2, 4, 6)
    └─ Server 3 (User 7, 8, 9)

Pros: Reduced cross-server communication
Cons: Uneven load distribution
```

### Strategy 2: Random Distribution
Load balanced across all servers:
```
Load Balancer
    ├─ Server 1 (Random users)
    ├─ Server 2 (Random users)
    └─ Server 3 (Random users)

Pros: Even load distribution
Cons: More Redis traffic
```

## Key Redis Operations

### Pub/Sub Channels
```
socket.io#:broadcast     - All messages
socket.io#/chat#:        - Namespace messages
socket.io#/chat#:room1:: - Room messages
```

### Data Storage
```
socket:${socketId}       - Socket metadata (1hr TTL)
server:${serverId}:sockets - Set of server's socket IDs
presence:${userId}       - User presence data
```

## Monitoring & Metrics

### Key Metrics
1. **Redis Latency** - Should be <5ms
2. **Pub/Sub Lag** - Messages should arrive <50ms
3. **Connection Distribution** - Check evenness across servers
4. **Memory Usage** - Monitor Redis RAM consumption

### Alerts
- Redis latency > 10ms → Performance degradation
- Lost Redis connection → Fallback to single-server
- Memory > 80% capacity → Need more Redis RAM

## Best Practices

✅ Always use dedicated Redis instance
✅ Monitor Redis connection pool
✅ Implement Redis connection retry
✅ Use Redis Cluster for high availability
✅ Set appropriate Redis timeouts
✅ Store session data in Redis
✅ Clean up expired socket metadata
✅ Test failover scenarios
✅ Monitor cross-server message latency
✅ Use consistent hashing for user distribution
