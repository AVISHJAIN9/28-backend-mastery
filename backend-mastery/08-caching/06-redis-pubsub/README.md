# Module 08.6: Redis Pub/Sub Pattern

## What This Covers

This module teaches **Redis Pub/Sub** - a real-time messaging pattern for broadcasting messages to multiple subscribers through named channels.

### Key Concepts
- **Publish/Subscribe model** - Publishers send, subscribers receive
- **Transient messages** - No persistence; lost if no subscribers
- **Real-time broadcasting** - Immediate delivery to all connected clients
- **Channel-based routing** - Route messages by channel name
- **Socket.io integration** - Web-based real-time communication

## Project Structure

```
06-redis-pubsub/
├── theory.md           # Detailed concepts & patterns
├── server.js           # Express + Socket.io server
├── controller.js       # Pub/Sub logic
├── routes.js           # API endpoints
├── middleware.js       # Validation middleware
├── App.jsx             # React testing UI
├── package.json        # Dependencies
├── .env.example        # Environment template
└── README.md           # This file
```

## Setup

### 1. Install Dependencies
```bash
npm install
```

### 2. Set Environment Variables
```bash
cp .env.example .env
# Edit .env with your values
```

### 3. Start Redis
```bash
redis-server
# or with Docker:
docker run -d -p 6379:6379 redis:latest
```

### 4. Start Server
```bash
npm start
# Server runs on http://localhost:6406
```

### 5. Start Frontend
```bash
npm run dev
# Then open http://localhost:3000
```

## Key Features Demonstrated

### 1. **Room Broadcasting**
- Users join rooms
- Messages published to room channel
- All room members receive instantly

### 2. **Pattern-Based Channels**
- Subscribe to `user:*:notifications`
- Publish to `user:123:notifications`
- Multiple subscribers automatically notified

### 3. **System Notifications**
- Broadcast alerts to all users
- No subscription required pre-emptively
- Events reach only active connections

### 4. **Metrics & Monitoring**
- Track published messages
- Monitor active subscriptions
- Get connection stats

## API Endpoints

### Publish to Channel
```bash
POST /api/publish
Content-Type: application/json

{
  "channel": "demo_abc123",
  "message": {
    "text": "Hello",
    "sender": "Alice"
  }
}
```

### Broadcast to Room
```bash
POST /api/broadcast-room
{
  "roomId": "room_123",
  "messageType": "announcement",
  "data": { "content": "Important message" }
}
```

### Send User Notification
```bash
POST /api/notify-user
{
  "userId": "user_456",
  "title": "Alert",
  "message": "Something happened"
}
```

### Get Active Rooms
```bash
GET /api/rooms

Response: {
  "rooms": [
    { "roomId": "room_1", "memberCount": 3 },
    { "roomId": "room_2", "memberCount": 1 }
  ],
  "total": 2
}
```

### Get Room Members
```bash
GET /api/rooms/:roomId/members

Response: {
  "roomId": "room_1",
  "members": [
    { "userId": "user_1", "userName": "Alice" },
    { "userId": "user_2", "userName": "Bob" }
  ],
  "count": 2
}
```

### Get Metrics
```bash
GET /api/metrics

Response: {
  "published": 42,
  "received": 156,
  "activeRooms": 3,
  "totalConnections": 7
}
```

## Socket.io Events

### Client → Server

**Join Room**
```javascript
socket.emit('join-room', { roomId: 'room_1', userId: 'user_1', userName: 'Alice' });
```

**Send Message**
```javascript
socket.emit('send-message', { roomId: 'room_1', text: 'Hello!' });
```

**Subscribe to Channel**
```javascript
socket.emit('subscribe-channel', { channel: 'notifications' });
```

### Server → Client

**New Message**
```javascript
socket.on('new-message', (data) => {
  // { userId, userName, text, timestamp }
});
```

**User Joined Room**
```javascript
socket.on('user-joined', (data) => {
  // { userId, userName, timestamp }
});
```

**System Notification**
```javascript
socket.on('system-notification', (data) => {
  // { title, message, severity, timestamp }
});
```

**Channel Message**
```javascript
socket.on('channel-message', (data) => {
  // { channel, message, timestamp }
});
```

## Real-World Use Cases

### 1. Chat Application
```javascript
// Join room
socket.emit('join-room', { roomId: 'general', userId: 'user_1', userName: 'Alice' });

// Send message
socket.emit('send-message', { roomId: 'general', text: 'Hello everyone!' });

// Other users receive: new-message event
```

### 2. Live Notifications
```javascript
// Backend publishes to user channel
redis.publish('user:123:notifications', JSON.stringify({
  title: 'Order Shipped',
  message: 'Your order #456 has shipped'
}));

// Frontend receives: system-notification event
```

### 3. System Alerts
```javascript
// Broadcast critical alert to all users
io.emit('system-notification', {
  title: 'Maintenance',
  message: 'Server going down in 5 minutes',
  severity: 'critical'
});
```

## Common Patterns

### Room Broadcasting
```javascript
// Team members in project room get updates
publishToRoom('project:123', 'file-updated', { fileName: 'index.js' });
```

### User Targeting
```javascript
// Send to specific user
notifyUser('user_456', { title: 'DM from Alice', message: 'Hi!' });
```

### System-Wide Broadcast
```javascript
// All connected users get alert
broadcastNotification({ title: 'Alert', message: 'Important update' });
```

## Exercises

1. **Create a notification system**
   - Admin sends alerts to users
   - Different severity levels
   - Persist unread notifications

2. **Build a typing indicator**
   - Show who's typing
   - Debounce typing events
   - Auto-clear after 3 seconds

3. **Implement presence tracking**
   - Track online/offline status
   - Show last seen
   - List active users

4. **Add message history**
   - Store messages in database
   - Show last 50 messages on join
   - Archive old messages

## Troubleshooting

### Messages Not Appearing?
- Ensure subscriber is connected BEFORE message is published
- Check Redis connection is active
- Verify channel name matches exactly

### High Memory Usage?
- Limit number of open connections
- Use connection pooling
- Clean up stale subscriptions

### Latency Issues?
- Check Redis server performance
- Reduce message size
- Use message compression

## When NOT to Use Pub/Sub

- ❌ Need message persistence
- ❌ Critical delivery guarantee required
- ❌ Offline message delivery needed
- ❌ Complex routing logic

Use **Bull/BullMQ** (job queues) instead for these cases.

## Next Steps

- Module 08.7: Redis Distributed Locks (Redlock)
- Module 08.8: Redis Streams
- Module 09.x: Scaling with sharding
