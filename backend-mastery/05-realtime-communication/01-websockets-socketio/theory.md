# WebSockets & Socket.io - Theory & Deep Dive

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
