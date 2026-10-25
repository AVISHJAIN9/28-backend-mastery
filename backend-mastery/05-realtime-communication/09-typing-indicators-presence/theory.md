# Typing Indicators & Presence - Theory

## Typing Indicators

### Purpose
Show to other users that someone is actively typing.

### Basic Flow
```
User starts typing
   ↓
Client emits 'typing:start'
   ↓
Server broadcasts to room
   ↓
Others see "User is typing..."
   ↓
User stops typing / pauses 3s
   ↓
Client emits 'typing:stop'
   ↓
"typing" indicator disappears
```

### Debouncing
```
Problem: Emit on every keystroke = excessive events
Solution: Debounce emission

KeyPress 1 → Emit 'typing:start'
KeyPress 2 → No emit (within 2s)
KeyPress 3 → No emit (within 2s)
Pause 3s → Emit 'typing:stop'

Result: 1 start + 1 stop per typing session
```

### Implementation
```javascript
let typingTimeout;

input.addEventListener('keypress', () => {
  if (!isTyping) {
    socket.emit('typing:start', {room: 'chat_1'});
    isTyping = true;
  }
  
  clearTimeout(typingTimeout);
  typingTimeout = setTimeout(() => {
    socket.emit('typing:stop', {room: 'chat_1'});
    isTyping = false;
  }, 3000);
});
```

## User Presence

### Status Types
```
Online: User connected and active
Away: Connected but inactive (30+ min)
Offline: Not connected
Idle: Connected but browser unfocused
Do Not Disturb: User set manually
```

### Tracking Presence
```javascript
// On connect
socket.on('connect', () => {
  io.to(`presence:${userId}`).emit('status:online');
  setStatus('online');
});

// Heartbeat (detect inactivity)
document.addEventListener('mousemove', () => {
  idle = false;
  lastActivity = Date.now();
});

setInterval(() => {
  if (Date.now() - lastActivity > 30 * 60 * 1000) {
    setStatus('away');
  }
}, 60000);

// On disconnect
socket.on('disconnect', () => {
  setStatus('offline');
});
```

### Storage Options

#### Memory (Fast)
```
const presence = new Map();
presence.set('user_123', {
  status: 'online',
  lastSeen: Date.now()
});

Pros: Instant access
Cons: Lost on restart
```

#### Redis (Recommended)
```
SETEX presence:user_123 3600 online
GET presence:user_123

Pros: Persistent, accessible cluster-wide
Cons: Network overhead (~5ms)
```

#### Database (Slow)
```
UPDATE users SET last_seen = NOW()

Pros: Permanent history
Cons: Too slow for real-time
```

## Last Seen Tracking

### Update Last Seen
```
On every message sent
On every page/view
On periodic heartbeat (every 5 min)

Trade-off: Accuracy vs Frequency
```

### Displaying "Last Seen"
```
Online → "Online"
Away → "Active 30m ago"
Offline < 1 day → "Seen 2h ago"
Offline > 1 day → "Seen yesterday"
Offline > 1 week → "Seen 5 days ago"
```

## Presence Rooms

### Pattern
```javascript
// Each user has personal presence room
socket.join(`presence:${userId}`);

// Broadcast status changes
io.to(`presence:${userId}`).emit('status:change', {
  status: 'online',
  timestamp: Date.now()
});

// Others listen for changes
socket.on('status:change', (data) => {
  updateUserStatus(data.userId, data.status);
});
```

## Scalability Concerns

### Issue
With 100k users, broadcast to all presence rooms is expensive.

### Solution 1: Only Track Friends
```
Only track presence of people in user's friend list
Reduces broadcast scope significantly
```

### Solution 2: Presence Room Sampling
```
Sample presences every 30 seconds
Not real-time but sufficient
```

### Solution 3: Redis Presence Pub/Sub
```
Redis handles presence routing
Application doesn't broadcast everything
```

## Privacy Considerations

### Who Can See My Presence?
```
Option 1: Friends only
Option 2: Users in same group
Option 3: Only admins
Option 4: Public (everyone)
```

### Implementation
```javascript
socket.on('status:change', (newStatus) => {
  // Check user's visibility settings
  const visibility = getCurrentUser().presenceVisibility;
  
  // Only broadcast to allowed users
  const allowedUsers = getAllowedUsers(userId, visibility);
  allowedUsers.forEach(uid => {
    io.to(`presence:${uid}`).emit('status:change', {
      userId, newStatus
    });
  });
});
```

## Performance Metrics

### Typing Indicators
```
Per user: ~500 bytes per "typing" state
10k users typing: ~5MB overhead
```

### Presence
```
Per user: ~100 bytes
100k users: ~10MB
```

## Best Practices

✅ Debounce typing events
✅ Use 3-5 second typing timeout
✅ Track last activity
✅ Store presence in Redis
✅ Update "last seen" periodically
✅ Respect privacy settings
✅ Use presence rooms
✅ Clean up stale presence data
✅ Test with many users
✅ Monitor presence latency
