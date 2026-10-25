# 05: Live Streaming Rooms

## Isolated Real-Time Spaces for Multi-User Broadcasting

Create managed rooms for separate groups of users with independent streaming sessions, user tracking, and selective broadcasting.

---

## Features

✓ **Room Creation & Management** - Create, update, delete rooms via REST API  
✓ **Real-Time Room Broadcasting** - Send events to specific rooms only  
✓ **Viewer Tracking** - Monitor current and total viewers per room  
✓ **Private Rooms** - Optional private room support  
✓ **User Join/Leave Notifications** - Real-time presence tracking  
✓ **Capacity Management** - Set max viewers per room  
✓ **Live Chat** - Room-specific messaging  
✓ **Typing Indicators** - Show who's typing in real-time  
✓ **Room Statistics** - Track messages, viewers, uptime  

---

## Architecture Overview

```
┌─────────────────────────────────────────────────────────┐
│               Socket.io Server (4005)                   │
├─────────────────────────────────────────────────────────┤
│                                                         │
│  Room Management           Broadcasting              │
│  ├─ Create Rooms           ├─ io.to(roomId).emit() │
│  ├─ Delete Rooms           ├─ socket.broadcast.to() │
│  ├─ Track Viewers          ├─ io.emit() global     │
│  ├─ Update Settings        └─ io.to(userId)        │
│  └─ Get Statistics                                  │
│                                                     │
│  Event Handlers          REST API                  │
│  ├─ room:join            ├─ POST /api/rooms       │
│  ├─ room:leave           ├─ GET /api/rooms        │
│  ├─ message:send         ├─ GET /api/rooms/:id    │
│  ├─ stream:data          ├─ PUT /api/rooms/:id    │
│  └─ user:typing          └─ DELETE /api/rooms/:id │
│                                                     │
└─────────────────────────────────────────────────────────┘
         ↓                              ↓
    ┌─────────┐                    ┌──────────┐
    │ Browser │                    │ Browser  │
    │ Room A  │                    │ Room B   │
    └─────────┘                    └──────────┘
```

---

## Use Cases

### 1. **Live Streaming Platforms**
- Stream to multiple viewers simultaneously
- Different channels for different streamers
- Real-time viewer count and chat

### 2. **Gaming Lobbies**
- Separate game rooms for different matches
- Player join/leave notifications
- Matchmaking via room capacity

### 3. **Collaborative Sessions**
- Codelab streaming to students
- Workshop/presentation rooms
- Q&A with chat moderation

### 4. **Private Conversations**
- Direct messages in isolated rooms
- `room_id = sorted([user1_id, user2_id])`
- End-to-end messaging

### 5. **Chat Channels**
- Slack-like channels
- Public/private room support
- Persistent message history

---

## API Endpoints

### Room Management

#### Create Room
```bash
POST /api/rooms
Content-Type: application/json

{
  "roomId": "stream-1",
  "name": "Main Live Stream",
  "description": "Live stream channel",
  "isPrivate": false,
  "isLive": true,
  "maxViewers": 1000
}

Response (201):
{
  "success": true,
  "room": {
    "id": "stream-1",
    "name": "Main Live Stream",
    "currentViewers": 0,
    "totalViewers": 0,
    "createdAt": "2024-03-30T10:00:00Z"
  }
}
```

#### List All Rooms
```bash
GET /api/rooms?filter=live&search=gaming

Response (200):
{
  "success": true,
  "count": 3,
  "rooms": [
    {
      "id": "stream-1",
      "name": "Main Live Stream",
      "currentViewers": 45,
      "totalViewers": 120,
      "isLive": true,
      "messageCount": 312
    }
  ]
}
```

#### Get Room Details
```bash
GET /api/rooms/stream-1

Response (200):
{
  "success": true,
  "room": {
    "id": "stream-1",
    "name": "Main Live Stream",
    "currentViewers": 45,
    "viewers": [
      {
        "socketId": "abc123",
        "userId": "user1",
        "username": "Alice",
        "joinedAt": "2024-03-30T10:05:00Z"
      }
    ]
  },
  "stats": {
    "currentViewers": 45,
    "totalViewers": 120,
    "messageCount": 312,
    "uptime": 3600000
  }
}
```

#### Update Room
```bash
PUT /api/rooms/stream-1
{
  "name": "Updated Stream Name",
  "isLive": false,
  "maxViewers": 500
}
```

#### Delete Room
```bash
DELETE /api/rooms/stream-1
```

#### Get Room Viewers
```bash
GET /api/rooms/stream-1/viewers

Response (200):
{
  "success": true,
  "roomId": "stream-1",
  "viewerCount": 45,
  "viewers": [
    {
      "socketId": "abc123",
      "userId": "user1",
      "username": "Alice"
    }
  ]
}
```

#### Check Room Capacity
```bash
GET /api/rooms/stream-1/capacity

Response (200):
{
  "success": true,
  "maxViewers": 1000,
  "currentViewers": 45,
  "availableSlots": 955,
  "isFull": false
}
```

### Statistics

#### Global Statistics
```bash
GET /api/stats/global

Response (200):
{
  "success": true,
  "stats": {
    "totalRooms": 5,
    "liveRooms": 3,
    "totalViewers": 234,
    "totalMessages": 1567
  }
}
```

#### Room Statistics
```bash
GET /api/rooms/stream-1/stats
```

### Search & Filter

```bash
GET /api/search/live          # Get live rooms only
GET /api/search/public        # Get public rooms only
GET /api/search?q=gaming      # Search by name/description
```

---

## WebSocket Events

### Client → Server

#### Join Room
```javascript
socket.emit('room:join', {
  roomId: 'stream-1',
  userId: 'user_123',
  username: 'Alice'
});
```

#### Leave Room
```javascript
socket.emit('room:leave', {
  roomId: 'stream-1'
});
```

#### Send Message
```javascript
socket.emit('message:send', {
  roomId: 'stream-1',
  text: 'Hello everyone!'
});
```

#### Stream Data
```javascript
socket.emit('stream:data', {
  roomId: 'stream-1',
  type: 'video-frame',
  payload: { /* video data */ }
});
```

#### Typing Indicator
```javascript
socket.emit('user:typing', {
  roomId: 'stream-1',
  isTyping: true
});
```

### Server → Client

#### User Joined
```javascript
socket.on('user:joined', (data) => {
  console.log(`${data.username} joined`);
  console.log(`Current viewers: ${data.viewerCount}`);
});
```

#### User Left
```javascript
socket.on('user:left', (data) => {
  console.log(`${data.username} left`);
  console.log(`Current viewers: ${data.viewerCount}`);
});
```

#### Room Viewers
```javascript
socket.on('room:viewers', (data) => {
  console.log(`Active viewers: ${data.viewerCount}`);
  data.viewers.forEach(v => console.log(v.username));
});
```

#### Message Received
```javascript
socket.on('message:received', (data) => {
  console.log(`${data.username}: ${data.text}`);
});
```

#### User Typing
```javascript
socket.on('user:typing', (data) => {
  if (data.isTyping) {
    console.log(`${data.username} is typing...`);
  }
});
```

#### Room Closed
```javascript
socket.on('room:closed', (data) => {
  console.log(`Room closed: ${data.message}`);
  // Disconnect from room
});
```

---

## Code Examples

### Creating & Joining a Room (React)

```javascript
import { useEffect, useRef, useState } from 'react';
import io from 'socket.io-client';

export function LiveStreamer() {
  const socketRef = useRef(null);
  const [viewers, setViewers] = useState([]);
  const [messages, setMessages] = useState([]);

  useEffect(() => {
    // Connect to server
    const socket = io('http://localhost:4005');
    socketRef.current = socket;

    // Listen for viewer updates
    socket.on('room:viewers', (data) => {
      setViewers(data.viewers);
    });

    // Listen for messages
    socket.on('message:received', (data) => {
      setMessages(prev => [...prev, data]);
    });

    return () => socket.close();
  }, []);

  const joinRoom = async (roomId) => {
    // First create room via REST API
    await fetch('http://localhost:4005/api/rooms', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        roomId,
        name: roomId,
        isLive: true
      })
    });

    // Then join via WebSocket
    socketRef.current.emit('room:join', {
      roomId,
      userId: 'user_123',
      username: 'Alice'
    });
  };

  const sendMessage = (text) => {
    socketRef.current.emit('message:send', {
      roomId: 'stream-1',
      text
    });
  };

  return (
    <div>
      <h2>Viewers: {viewers.length}</h2>
      <ul>
        {viewers.map(v => <li key={v.socketId}>{v.username}</li>)}
      </ul>
      <div>
        {messages.map((msg, i) => (
          <p key={i}><strong>{msg.username}:</strong> {msg.text}</p>
        ))}
      </div>
      <textarea onKeyPress={(e) => {
        if (e.key === 'Enter') {
          sendMessage(e.target.value);
          e.target.value = '';
        }
      }} />
    </div>
  );
}
```

### Room Management (Node.js Controller)

```javascript
class RoomsController {
  constructor(io) {
    this.io = io;
    this.rooms = new Map();
    this.roomViewers = new Map();
  }

  createRoom(roomId, data) {
    const room = {
      id: roomId,
      name: data.name,
      isLive: data.isLive,
      maxViewers: data.maxViewers || 1000,
      createdAt: new Date(),
      messageCount: 0,
      totalViewers: 0
    };
    
    this.rooms.set(roomId, room);
    this.roomViewers.set(roomId, new Map());
    return room;
  }

  addViewer(roomId, socketId, viewerData) {
    const viewers = this.roomViewers.get(roomId);
    viewers.set(socketId, {
      socketId,
      userId: viewerData.userId,
      username: viewerData.username,
      joinedAt: new Date()
    });

    const room = this.rooms.get(roomId);
    room.totalViewers++;
  }

  recordMessage(roomId) {
    const room = this.rooms.get(roomId);
    if (room) room.messageCount++;
  }

  getRoomStats(roomId) {
    const room = this.rooms.get(roomId);
    const viewers = this.roomViewers.get(roomId);
    
    return {
      roomId,
      name: room.name,
      currentViewers: viewers.size,
      totalViewers: room.totalViewers,
      messageCount: room.messageCount,
      uptime: Date.now() - room.createdAt.getTime()
    };
  }
}
```

---

## Key Concepts

### Room Isolation
Each room broadcasts independently:
```javascript
// Send to specific room only
io.to('stream-1').emit('message', data);

// Send to all except sender
socket.broadcast.to('stream-1').emit('user:joined', data);

// Send to all globally
io.emit('event', data);
```

### Viewer Tracking
Track who's in each room:
```javascript
const viewers = io.sockets.adapter.rooms.get('stream-1');
console.log(viewers.size); // Current viewers in room
```

### Socket Rooms
A socket can be in multiple rooms:
```javascript
socket.join('stream-1');
socket.join(`user_${userId}`);  // Personal room for DMs
socket.join('notifications');   // Global notifications

// Now socket receives broadcasts to all 3 rooms
```

### Leaving Rooms
```javascript
socket.leave('stream-1');
socket.leaveAll();  // Leave all rooms
```

---

## Common Patterns

### Pattern 1: Broadcasting to Viewers
```javascript
io.to(roomId).emit('stream:update', {
  type: 'video-frame',
  data: videoFrame
});
```

### Pattern 2: Notifying Others
```javascript
socket.broadcast.to(roomId).emit('user:joined', {
  username: socket.username,
  viewerCount: io.sockets.adapter.rooms.get(roomId).size
});
```

### Pattern 3: Private Messages
```javascript
// Send to specific user
io.to(`user_${userId}`).emit('message:direct', {
  from: senderName,
  text: message
});
```

### Pattern 4: Presence Tracking
```javascript
// Room view list
const viewers = Array.from(
  io.sockets.adapter.rooms.get(roomId)
).map(socketId => /* get user info */);

io.to(roomId).emit('room:viewers', viewers);
```

---

## Testing

### Test Create Room
```bash
curl -X POST http://localhost:4005/api/rooms \
  -H "Content-Type: application/json" \
  -d '{"roomId":"test1","name":"Test Room"}'
```

### Test Join Room (via preview.html)
1. Open `preview.html` in browser
2. Create a room using form
3. Click "Join" button
4. Open another browser window
5. Join same room
6. Send messages

### Test Capacity
```bash
curl http://localhost:4005/api/rooms/test1/capacity
```

---

## Performance Considerations

1. **Memory** - Each viewer in memory per room
2. **Scaling** - Use Redis adapter for multiple servers
3. **Cleanup** - Remove inactive rooms periodically
4. **Limits** - Set reasonable maxViewers per room
5. **Compression** - Enable Socket.io compression for large messages

---

## Deployment Checklist

- [ ] Environment variables set (.env)
- [ ] Node.js and npm installed
- [ ] Dependencies installed (`npm install`)
- [ ] Port 4005 available
- [ ] Database/cache configured if needed
- [ ] Error logging configured
- [ ] CORS configured for frontend URL
- [ ] Rate limiting enabled
- [ ] Socket.io namespace configured
- [ ] Graceful shutdown implemented

---

## Related Modules

**Series: 05 Realtime Communication**
- 01: WebSockets & Socket.io (basics)
- 02: Socket.io with Redis Adapter (scaling)
- 03: Server-Sent Events (SSE)
- 04: Socket.io Auth & JWT Handshake
- **05: Live Streaming Rooms** ← You are here
- 06: Message Queue (BullMQ)
- 07: Broadcast Alerts
- 08: Push Notifications (FCM)
- 09: Typing Indicators & Presence
- 10: Email Queue (Resend)
- 11: Ephemeral Chat (auto-delete)
- 12: WebRTC Peer-to-Peer
- 13: Poll Real-time Updates
- 14: CRDT Collaborative Editing
- 15: Collaborative Whiteboard

---

## License

Educational Module - Backend Mastery Series

**Created:** March 2024  
**Version:** 1.0.0