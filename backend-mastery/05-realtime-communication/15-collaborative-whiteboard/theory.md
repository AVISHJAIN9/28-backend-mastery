# Collaborative Whiteboard - Theory

## Real-Time Drawing System

### Challenges
```
1. Multiple users drawing simultaneously
2. Network latency (100-500ms)
3. Rendering performance
4. Shape coordination
5. Undo/redo with multiple users
```

## Drawing Coordination

### Approach: Event-Based
```
User1 draws line
   ↓
Create draw event:
{
  type: 'line',
  startX, startY,
  endX, endY,
  color, width
}
   ↓
Send to server
   ↓
Server broadcasts to all
   ↓
All clients draw the line
```

### Event Lossy?
```
Network can drop events
Solution: Resend entire drawing state on join
New user: Reconnect → Receive all existing shapes
```

## Canvas Rendering

### Update Rate
```
Client draws 60 FPS (if smooth)
Send coordinates to server:
- Could send 60x per second = 60 events
- Bandwidth intensive
- Processing overhead

Better: Send on mouse up
- One event per draw
- Low bandwidth
- Slight lag but acceptable
```

### Rendering Optimization
```
Option 1: Redraw everything each frame (simple)
- 1000 shapes, 60 FPS = 60k draw calls
- Too slow

Option 2: Append new shapes (efficient)
- Draw backgrounds once
- Append new shapes incrementally
- 60 FPS smooth

Option 3: Canvas layers
- Layer per user
- Combine on render
- Easy to hide/show users
```

## Shape Types

### Primitive Shapes
```
Line: startX, startY, endX, endY
Circle: centerX, centerY, radius
Rectangle: topLeftX, topLeftY, width, height
Text: text, x, y, fontSize, fontFamily
Path: array of points
```

### Shape Structure
```javascript
{
  id: 'shape_123',
  type: 'line',
  startX: 10, startY: 20,
  endX: 100, endY: 150,
  color: '#000000',
  strokeWidth: 2,
  opacity: 1,
  userId: 'user_1',
  createdAt: timestamp,
  zIndex: 10
}
```

## Cursor Tracking

### Show Other Users' Cursors
```
User moves mouse
   ↓
Emit cursor position (throttled, every 100ms)
   ↓
Server broadcasts to room
   ↓
Others see cursor position
   ↓
Draw cursor with label
```

### Throttling Cursor Events
```
Without throttle: 60 events/second
With throttle: 10 events/second (every 100ms)
UI still responsive, bandwidth reduced
```

## Undo/Redo in Collaboration

### Problem
```
Server: [Shape1, Shape2, Shape3]
User1: Undo → [Shape1, Shape3]
User2: Draws Shape4 → [Shape1, Shape2, Shape3, Shape4]

When synced: [Shape1, Shape3, Shape4]
User1 or User2 confused?
```

### Solution: CRDT-Based
```
Each shape has unique ID
Track which user deleted
Undo only affects user's shapes
Other users' shapes stay
```

### Solution: Stack-Based
```
Keep operation history
User1 undo: Remove from User1's operation
Rebuild document from all operations
```

## Performance Metrics

### Drawing Performance
```
Smooth drawing: <16ms per frame (60 FPS)
Network: 100-500ms latency
Typical: Draw locally, sync to others
```

### Memory Usage
```
1000 shapes in memory
Each shape: ~500 bytes
Total: ~500 KB

In 2 hours, 10k shapes:
= ~5 MB per whiteboard session
```

### Network Bandwidth
```
Per draw event: 200-500 bytes
1 draw/second: 200 bytes/sec
1k users: 200 KB/sec per whiteboard
Acceptable for collaborative app
```

## Layers & Z-Index

### Layering System
```
z-index: Controls which shape on top
Higher z-index = on top
Ascending order when rendering
```

### Bring to Front
```
Used when: Shape drawn over another
Solution: Increase z-index
- Current max z-index: 100
- Set new shape z-index: 101
- Now appears on top
```

## Saving & Export

### Save to Database
```javascript
await database.save({
  whiteboardId,
  shapes: whiteboard.shapes,
  timestamp: Date.now()
});
```

### Export as Image
```javascript
const canvas = document.getElementById('board');
const image = canvas.toDataURL('image/png');
download(image, 'whiteboard.png');
```

### Export as PDF
```
Use library: jsPDF, pdfkit
Draw shapes on PDF
Include metadata (user, timestamp)
```

## Real-Time Challenges

### Connection Lost
```
User drawing, connection drops
Solution:
1. Show "reconnecting..." message
2. Buffer local draws
3. On reconnect, send buffered draws
```

### Concurrent Deletes
```
User1: Deletes shape A
User2: Trying to draw on shape A
Solution:
- Send delete event
- All clients remove shape
- User2's draw event ignored (shape gone)
```

## Best Practices

✅ Throttle cursor updates
✅ Throttle shape broadcasts
✅ Show user indicators (colors, labels)
✅ Implement layer management
✅ Allow shape grouping
✅ Implement grid/snap-to-grid
✅ Keyboard shortcuts (Ctrl+Z)
✅ Prevent concurrent moves
✅ Test with high latency
✅ Save periodically to database
✅ Implement clear canvas
✅ Add lock on shapes
