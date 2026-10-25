#!/usr/bin/env python3
"""Update all theory.md files with comprehensive content"""

import os

BASE = "/Users/avishjain/Downloads/backend-mastery/05-realtime-communication"

THEORY = {
    "01-websockets-socketio": """# WebSockets & Socket.io - Theory & Deep Dive

## What is WebSocket?

WebSocket is a communication protocol that provides full-duplex (bidirectional) communication over a single TCP connection. Unlike HTTP, which is stateless and request-response based, WebSocket maintains a persistent connection allowing both client and server to send data at any time.

### HTTP vs WebSocket

| Feature | HTTP | WebSocket |
|---------|------|-----------|
| Connection | Stateless, closes after response | Persistent, stays open |
| Initiation | Client always initiates | Both can send anytime |
| Overhead | Headers on every request (1KB+) | Minimal frame overhead (2-14 bytes) |
| Latency | High (request-response cycle) | Low (instant delivery) |
| Use Case | Static/dynamic content | Real-time applications |
| Scalability | Horizontal (stateless) | Requires state management |

## Socket.io Architecture

Socket.io abstracts WebSocket complexity and provides:

1. **Automatic Fallback** - Uses polling if WebSocket unavailable
2. **Message Buffering** - Queues messages if connection drops
3. **Automatic Reconnection** - Reconnects with exponential backoff
4. **Rooms & Namespaces** - Organize connections into groups
5. **Event Acknowledgments** - Client confirmation of received messages

## Connection Lifecycle

```
1. Client connects: io('http://server.com')
                    ↓
2. Handshake performed (auth tokens validated)
                    ↓
3. 'connection' event fired on server
                    ↓
4. Socket ready for event emission
                    ↓
5. Both sides can emit/receive events
                    ↓
6. On disconnect, cleanup occurs
```

## Event Flow Architecture

```
Client Socket                          Server Socket
    │                                      │
    ├─ socket.emit('event', data) ───────→├─ socket.on('event', handler)
    │                                      │
    ├─ socket.on('message') ←────── io.emit('message', data)
    │                                      │
    └─ Acknowledgment ────────────────────→ callback(response)
```

## Namespaces & Rooms

### Namespaces
Separate communication channels for different features:
```javascript
// Server
io.of('/chat').on('connection', socket => { });
io.of('/notifications').on('connection', socket => { });

// Client
const chatSocket = io('http://server.com/chat');
```

### Rooms
Group sockets within a namespace for selective broadcasting:
```javascript
// Join room
socket.join('room123');

// Broadcast to room
io.to('room123').emit('message', data);

// Leave room
socket.leave('room123');
```

## Broadcasting Patterns

1. **To One Client**
   ```javascript
   socket.emit('event', data);
   ```

2. **To Everyone**
   ```javascript
   io.emit('event', data);
   ```

3. **To Everyone Except Sender**
   ```javascript
   socket.broadcast.emit('event', data);
   ```

4. **To Specific Room**
   ```javascript
   io.to('room').emit('event', data);
   ```

5. **To Specific User**
   ```javascript
   io.to(`user_${userId}`).emit('event', data);
   ```

## Memory Management

Socket.io stores connections in memory by default. Issues:

1. **Single Server**: All connections in RAM
2. **Multiple Servers**: Each server only knows its own connections
3. **Reconnections**: Previous connection data lost

Solutions:
- Use Redis Adapter for multiple servers
- Store session data in Redis
- Implement heartbeat for dead connection cleanup
- Monitor memory usage continuously

## Performance Considerations

### Message Size
- Smaller is better (reduces bandwidth)
- Compress large payloads
- Limit to under 100KB per message

### Frequency
- Throttle rapid events
- Debounce client input
- Batch multiple updates

### Connections
- WebSocket per connection uses ~1-2MB RAM
- 10,000 connections = ~20MB RAM
- Single server limit ~50,000 concurrent connections

## Security

1. **Authentication**
   - Validate tokens on connection
   - Re-validate on sensitive operations
   - Auto-disconnect on auth failure

2. **Authorization**
   - Verify user can access room/namespace
   - Validate data before broadcasting

3. **Input Validation**
   - Sanitize all incoming data
   - Check message size limits
   - Rate limit events per user

4. **Transport Security**
   - Use WSS (WebSocket Secure) not WS
   - Enable CORS properly
   - Validate origins

## Common Pitfalls

❌ **Not handling disconnections** - Messages sent to disconnected users are lost
❌ **Blocking event handlers** - One slow handler delays all sockets
❌ **Memory leaks** - Not removing event listeners
❌ **Broadcasting to everyone** - Use rooms for targeted messages
❌ **No error handling** - Silent failures cause issues
❌ **Storing all data in memory** - No persistence on restart
❌ **Single WebSocket for everything** - Use namespaces to separate concerns

## Best Practices

✅ Always implement heartbeat for connection health
✅ Use rooms to organize connections logically
✅ Implement proper error handling on both sides
✅ Validate all incoming data
✅ Cache heartbeat intervals (don't create on each event)
✅ Use Redis Adapter for horizontal scaling
✅ Monitor connection metrics
✅ Implement graceful degradation
✅ Test disconnect/reconnect scenarios
✅ Set appropriate timeouts for hanging connections
""",

    "02-socketio-redis-adapter": """# Socket.io Redis Adapter - Advanced Scaling Theory

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
""",

    "03-sse-server-sent-events": """# Server-Sent Events - Theory & Use Cases

## What is SSE?

Server-Sent Events (SSE) is a web standard for one-way server-to-client communication over HTTP. Unlike WebSocket which is bidirectional, SSE is purely unidirectional: server pushes data to client.

## HTTP vs SSE vs WebSocket

| Feature | HTTP | SSE | WebSocket |
|---------|------|-----|-----------|
| Direction | Request → Response | Server → Client | Bidirectional |
| Connection | Closes after response | Persistent (long-lived) | Persistent |
| Protocol | HTTP/1.1 | HTTP/1.1 | Upgraded protocol |
| Proxies/Firewalls | Works everywhere | Works most places | May be blocked |
| CPU Usage | Low (per request) | Low (polling) | Medium |
| Use Case | Static responses | Server push, unidirectional | Real-time chat |

## Event Stream Format

SSE uses a simple text-based format:

```
event: message_type
data: {"id": 1, "content": "Hello"}
retry: 5000
id: 1

:this is a comment
data: line 1
data: line 2

event: ping
data: keep-alive
```

### Field Meanings
- `event` - Event type name (optional, default "message")
- `data` - Payload (can be multiple lines)
- `id` - Event ID for reconnection
- `retry` - Milliseconds before client retries connection
- `:` - Comment (ignored by client)

## Connection Management

### Client Connection
```javascript
const source = new EventSource('/api/stream?userId=123');

// Listen for any event
source.addEventListener('message', (e) => {
  console.log('Data:', e.data);
});

// Listen for specific event
source.addEventListener('custom_event', (e) => {
  console.log('Custom:', e.data);
});

// Error handling
source.addEventListener('error', (e) => {
  if (e.readyState === EventSource.CLOSED) {
    console.log('Connection closed');
  }
});

// Cleanup
source.close();
```

### Server Connection
```javascript
// HTTP Headers
response.writeHead(200, {
  'Content-Type': 'text/event-stream',
  'Cache-Control': 'no-cache',
  'Connection': 'keep-alive',
  'Access-Control-Allow-Origin': '*'
});

// Send event
response.write('event: message\n');
response.write('data: {"content":"hello"}\n');
response.write('id: 1\n');
response.write('\n');

// Heartbeat every 30s
setInterval(() => {
  response.write(':heartbeat\n\n');
}, 30000);

// Cleanup on close
response.on('close', () => {
  clearInterval(heartbeat);
});
```

## Automatic Reconnection

SSE provides built-in reconnection:

```
1. Connection established
2. Server sends events successfully
3. Connection drops (network/server issue)
4. Browser waits for retry interval
5. Automatically reconnects
6. Server receives reconnection request with last event ID
7. Server can resend missed events
```

### Event ID Tracking
```javascript
// Server
let eventId = 1;
response.write(`id: ${eventId++}\n\n`);

// Client receives
source.addEventListener('message', (e) => {
  console.log('Event ID:', e.lastEventId);
  // If reconnect, lastEventId contains last received ID
});
```

## Use Cases

### 1. Live Notifications
```
Notification Server → Multiple clients
Each client gets notifications instantly
No client-to-server communication needed
```

### 2. Activity Feed
```
Message Feed → Web Browser
New posts/likes streamed to feed
Chronological order maintained
```

### 3. Stock Ticker
```
Price Updates → Dashboard
Continuous price updates
One-way data flow
```

### 4. Logs/Monitoring
```
Application Logs → Console
Stream server logs to browser
Live debugging capability
```

### 5. Push Alerts
```
System Alerts → Users
Critical system notifications
Real-time status updates
```

## Advantages Over WebSocket

✅ **Simpler Protocol** - Standard HTTP, no protocol upgrade
✅ **Works Through Proxies** - Standard HTTP proxy support
✅ **Lower Latency** - No connection handshake delay
✅ **Fallback Support** - Built-in polling fallback
✅ **Less Code** - Browser handles most complexity
✅ **Better Browser Support** - Works in IE 10+

## Disadvantages vs WebSocket

❌ **No Client→Server** - Can't send data over SSE
❌ **Connection Per User** - One connection per client
❌ **No Binary Data** - Only text/UTF-8
❌ **Max 6 Connections** - Browser limits concurrent SSE connections
❌ **No Message Ordering Guarantee** - Under heavy load

## Performance Characteristics

### Memory Usage
```
Per connection: ~50-100KB base
+ Event data in buffer
10,000 connections ≈ 500MB-1GB
```

### CPU Usage
```
Low: ~1-5% per 1000 connections
Mainly I/O bound (network, not CPU)
```

### Bandwidth
```
Connection established: ~1KB headers
Per event: 2 bytes overhead + payload
Heartbeat: ~50 bytes every 30s
```

## Best Practices

✅ Always set Content-Type header correctly
✅ Implement heartbeat to detect dead connections
✅ Use event IDs for missed event recovery
✅ Set reasonable retry intervals (3-5 seconds)
✅ Handle reconnections gracefully
✅ Monitor connection count
✅ Implement rate limiting per user
✅ Clean up old connections after timeout
✅ Test with network failures
✅ Consider SSE + WebSocket hybrid approach
""",

    "04-socket-auth-jwt-handshake": """# Socket.io Authentication & JWT Theory

## Why Authentication Matters

WebSocket connections bypass normal HTTP request cycle, so they need explicit authentication:

```
Traditional HTTP
GET /api/data HTTP/1.1
Authorization: Bearer JWT_TOKEN
→ Middleware validates token
→ Route handler checks auth
→ Response sent

WebSocket
socket.connect()
→ No Authorization header in handshake
→ Must validate in Socket.io middleware
→ Connection proceeds or denies
```

## JWT (JSON Web Tokens)

### Structure
```
Header.Payload.Signature

header: { "alg": "HS256", "typ": "JWT" }
payload: { "userId": "123", "iat": 1234567890, "exp": 1234571490 }
signature: HMACSHA256(header + payload, secret)
```

### Token Lifecycle
```
1. User logs in with credentials
                ↓
2. Server generates JWT with expiry
                ↓
3. Client stores JWT (localStorage/sessionStorage)
                ↓
4. Client sends JWT in Socket.io auth header
                ↓
5. Server verifies signature and expiry
                ↓
6. Socket connection allowed or denied
                ↓
7. JWT expires after time limit
                ↓
8. Client requests new token (refresh token)
```

## Socket.io Authentication Flow

### Handshake Process
```javascript
// Client
const socket = io('http://server.com', {
  auth: {
    token: 'eyJhbGc...'
  }
});

// Server
io.use((socket, next) => {
  const token = socket.handshake.auth.token;
  
  if (!token) {
    return next(new Error('Auth required'));
  }
  
  try {
    const decoded = jwt.verify(token, secret);
    socket.userId = decoded.userId;
    next(); // Allow connection
  } catch(error) {
    next(new Error('Invalid token')); // Deny connection
  }
});

io.on('connection', (socket) => {
  console.log('User connected:', socket.userId);
});
```

## Token Refresh Strategy

### Problem
JWT tokens expire. After expiry, connection remains active but becomes unauthorized.

### Solution 1: Expire Everything
```
Expiry: 1 hour
Client: Reconnect every 50 minutes with new token
Pros: Simple
Cons: Frequent reconnections, session loss
```

### Solution 2: Refresh Token
```
Access Token: 15 minutes (short-lived)
Refresh Token: 7 days (long-lived)

Flow:
1. Access token sent in auth header
2. On expiry, client requests new access token using refresh token
3. Refresh token stored securely (HttpOnly cookie)
4. Updated access token sent, continues connection
```

### Implementation
```javascript
// Server
socket.on('token:refresh', (oldToken, callback) => {
  try {
    const decoded = jwt.decode(oldToken);
    const newToken = jwt.sign(
      { userId: decoded.userId },
      secret,
      { expiresIn: '15m' }
    );
    callback({ token: newToken });
  } catch(error) {
    callback({ error: 'Invalid token' });
  }
});

// Client
setInterval(() => {
  socket.emit('token:refresh', currentToken, (response) => {
    if (response.token) {
      currentToken = response.token;
    } else {
      // Redirect to login
      window.location.href = '/login';
    }
  });
}, 10 * 60 * 1000); // Every 10 minutes
```

## Security Considerations

### 1. Token Storage
```
❌ localStorage - XSS vulnerability
❌ sessionStorage - XSS vulnerability
✅ HttpOnly Cookie - Cannot access via JS (XSS safe)
✅ Memory - Lost on page refresh
✅ Encrypted localStorage - Better than plain
```

### 2. Token Transmission
```
❌ Query parameter: socket.io('?token=xyz')
❌ Custom header (HTTP): Limited support
✅ Auth object: socket.io({auth: {token}})
✅ HttpOnly cookie: Most secure
```

### 3. CSRF Prevention
```javascript
// Include CSRF token in JWT payload
jwt.sign({
  userId: user.id,
  csrfToken: generateToken()
}, secret);

// Verify on Socket.io connection
socket.handshake.auth.csrfToken === socket.handshake.headers['x-csrf-token']
```

### 4. Token Expiry
```
Too short (5 min): Frequent reconnections, bad UX
Too long (1 year): Compromised token remains valid
Optimal: 15-60 minutes for access token
```

## Multi-Device Scenarios

### Problem
Same user on multiple devices (phone, laptop, tablet) = multiple tokens
Logging out on one device shouldn't affect others

### Solution 1: Device ID in Token
```javascript
jwt.sign({
  userId: '123',
  deviceId: 'device_abc123'
}, secret);
```

### Solution 2: Token Blacklist
```javascript
// When user logs out
const tokenBlacklist = new Set();
tokenBlacklist.add(token);

// On connection
io.use((socket, next) => {
  if (tokenBlacklist.has(socket.handshake.auth.token)) {
    return next(new Error('Token revoked'));
  }
  next();
});
```

## OAuth2 Integration

### With OAuth2 Providers (Google, GitHub)
```
1. User logs in via OAuth on website
2. Server generates JWT based on OAuth profile
3. JWT sent to client
4. Client uses JWT for WebSocket auth
5. Socket connection established
```

## Common Pitfalls

❌ **Storing token in query string** - Visible in logs
❌ **No HTTPS/WSS** - Token intercepted in transit
❌ **No token expiry** - Stale tokens remain valid
❌ **Validating only on connect** - Should validate each critical action
❌ **Not handling token refresh** - Connection hangs on expiry
❌ **Same token for all devices** - Security risk
❌ **No rate limiting** - Brute force JWT attacks
❌ **Weak signing key** - Easy to forge tokens

## Best Practices

✅ Use HTTPS/WSS always (never WS)
✅ Keep signing key secret and strong
✅ Short token expiry (15-60 minutes)
✅ Use refresh tokens for long sessions
✅ Store tokens in HttpOnly cookies when possible
✅ Validate token on critical operations
✅ Implement token blacklist for logout
✅ Use strong cryptographic algorithms (HS256+)
✅ Include user constraints in token (deviceId, etc)
✅ Log authentication failures for security monitoring
""",

    "05-live-streaming-rooms": """# Live Streaming Rooms - Theory & Architecture

## Room Concept

Rooms are logical groupings of sockets for selective broadcasting:

```
Global Broadcast
    io.emit() → All connected users

Room Broadcast
    io.to('room1').emit() → Only sockets in room1

Targeted Broadcast
    io.to(`user_${userId}`).emit() → Single user
```

## Room Types

### 1. Chat Rooms
```
- Users join/leave visible rooms
- Active members list shown
- Messages only in room
- Leave notifies others
```

### 2. Live Streams
```
- Multiple viewers in same "stream" room
- Streamer broadcasts to room
- Viewer count tracked
- Leave drops from stream
```

### 3. Game Lobbies
```
- Players join lobby room
- Match starts with subset in game room
- Game events in game room
- Spectators in separate room
```

### 4. Private Conversations
```
- Room for each pair of users
- room_id = sorted(user1, user2)
- Messages private to both
```

## Room Membership Management

### Joining
```javascript
socket.join('room_name');
// Socket now receives broadcasts to this room

// Can join multiple rooms
socket.join('room1');
socket.join('room2');
socket.join(`user_${userId}`);
```

### Leaving
```javascript
socket.leave('room_name');
// Stop receiving broadcasts

// Leave all rooms
socket.leaveAll();
```

### Getting Room Members
```javascript
// Get all sockets in a room
io.in('room_name').fetchSockets();

// Get socket's rooms
socket.rooms; // Set of room names

// Check if socket in room
socket.rooms.has('room_name');
```

## Broadcasting Scope

### Patterns
```javascript
// To specific room
io.to('room_name').emit('event', data);

// To specific socket
io.to(socketId).emit('event', data);

// To everyone except sender
socket.broadcast.to('room_name').emit('event', data);

// To specific user
io.to(`user_${userId}`).emit('event', data);

// Multiple rooms (combine)
io.to('room1').to('room2').emit('event', data);
```

## Room-Specific Features

### Live Viewer Count
```
function getViewerCount(roomId) {
  const clients = io.sockets.adapter.rooms.get(roomId);
  return clients ? clients.size : 0;
}

// Broadcast count updates
setInterval(() => {
  const count = getViewerCount('stream_123');
  io.to('stream_123').emit('viewers:updated', { count });
}, 5000);
```

### Room Persistence
```
When all users leave a room, room is deleted in Socket.io
To maintain room state:
- Store in database/Redis
- Re-join users on reconnection
- Load previous room state
```

### Room Metadata
```javascript
// Store room info in Map
const rooms = new Map();
rooms.set('stream_1', {
  id: 'stream_1',
  title: 'Live Coding',
  owner: 'user_123',
  createdAt: Date.now(),
  isPrivate: false,
  maxViewers: 100
});

// Add to room
socket.room_data = rooms.get('stream_1');
```

## Scaling with Multiple Servers

### Issue
Without Redis Adapter, Server 1 can't broadcast to users on Server 2.

### Solution: Redis Adapter
```
User joins "room_123" on Server 1 and Server 2
Server 1: io.to('room_123').emit()
        ↓ publishes to Redis
        ↓ Redis broadcasts to Server 2
Server 2: receives and emits to local room_123 members
```

## Room Access Control

### Public Rooms
```
io.to('public_chat').emit('message', msg);
// Anyone can join
// Messages visible to all
```

### Private Rooms
```
// Check authorization before join
socket.on('room:join', (roomId) => {
  if (hasAccessToRoom(socket.userId, roomId)) {
    socket.join(roomId);
  } else {
    socket.emit('error', 'Access denied');
  }
});
```

### Password Protected
```
socket.on('room:join', (roomId, password) => {
  const room = roamsDatabase.get(roomId);
  if (room.password && bcrypt.compare(password, room.hashedPassword)) {
    socket.join(roomId);
  } else {
    socket.emit('error', 'Invalid password');
  }
});
```

## Performance Considerations

### Memory Per Room
```
Each socket has:
- Socket ID
- User metadata
- Room list

Per room:
- Member list (Set)
- Room metadata

1000 rooms × 100 members = 100k socket references
Typical: ~500MB memory
```

### Broadcast Performance
```
io.to('room').emit() performance:
- Linear with room size
- 100 members: <1ms
- 10,000 members: ~100ms (noticeable)

Solution: Limit room size or use sharding
```

## Room Naming Conventions

```javascript
// Chat rooms
'chat:general'
'chat:random'
'chat:user_123_456' // Private between 2 users

// Live streams
'stream:twitch_123'
'stream:youtube_abc'

// Games
'game:lobby_456'
'game:match_789'

// Notifications
'notifications:user_123'
'notifications:admin'
```

## Best Practices

✅ Use meaningful room names
✅ Implement access control for private rooms
✅ Clean up empty rooms after time
✅ Track room membership in database
✅ Broadcast room updates (member join/leave)
✅ Implement max room size limits
✅ Monitor room size metrics
✅ Test with large room broadcasts
✅ Use room namespacing for organization
✅ Implement room search functionality if needed
""",
}

def write_theory(module_dir, content):
    path = f"{BASE}/{module_dir}/theory.md"
    with open(path, 'w') as f:
        f.write(content)
    return path

for module, theory_content in THEORY.items():
    write_theory(module, theory_content)
    print(f"✅ Updated {module}/theory.md ({len(theory_content)} chars)")

print(f"\n✅ All 5 theory.md files updated with comprehensive content!")
