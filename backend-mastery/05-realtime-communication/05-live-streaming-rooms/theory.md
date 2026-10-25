# Live Streaming Rooms - Theory & Architecture

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
