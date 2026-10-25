# Setup Guide - Live Streaming Rooms

## Quick Start (2 minutes)

### 1. Install Dependencies
```bash
npm install
```

### 2. Start Server
```bash
npm start
```

Server runs on `http://localhost:4005`

### 3. Test Server
```bash
curl http://localhost:4005/health
```

### 4. Open Preview
Open `preview.html` in your browser to test the UI

---

## Detailed Setup

### Prerequisites
- **Node.js** >= 14.x
- **npm** >= 6.x
- **macOS/Linux/Windows**

### Step 1: Clone/Navigate to Module
```bash
cd 05-live-streaming-rooms
```

### Step 2: Install Dependencies
```bash
npm install
```

Expected dependencies:
```
express@^4.18.2
cors@^2.8.5
helmet@^7.0.0
dotenv@^16.3.1
socket.io@^4.7.2
```

### Step 3: Configuration
Copy and edit `.env` file:
```bash
cp .env.example .env
```

Edit `.env`:
```env
NODE_ENV=development
HTTP_PORT=4005
FRONTEND_URL=http://localhost:3000
LOG_LEVEL=info
```

### Step 4: Start Development Server
```bash
# Production
npm start

# Development (with auto-restart)
npm run dev
```

Server will start on port **4005** by default.

---

## Testing

### API Testing with cURL

#### 1. Create a Room
```bash
curl -X POST http://localhost:4005/api/rooms \
  -H "Content-Type: application/json" \
  -d '{
    "roomId": "room1",
    "name": "My First Stream",
    "description": "Welcome to my stream!",
    "isLive": true,
    "maxViewers": 100
  }'
```

Expected Response:
```json
{
  "success": true,
  "message": "Room room1 created",
  "room": {
    "id": "room1",
    "name": "My First Stream",
    "currentViewers": 0,
    "createdAt": "2024-03-30T10:00:00Z"
  }
}
```

#### 2. List All Rooms
```bash
curl http://localhost:4005/api/rooms
```

#### 3. Get Room Details
```bash
curl http://localhost:4005/api/rooms/room1
```

#### 4. Get Room Viewers
```bash
curl http://localhost:4005/api/rooms/room1/viewers
```

#### 5. Check Capacity
```bash
curl http://localhost:4005/api/rooms/room1/capacity
```

#### 6. Get Statistics
```bash
curl http://localhost:4005/api/stats/global
```

#### 7. Update Room
```bash
curl -X PUT http://localhost:4005/api/rooms/room1 \
  -H "Content-Type: application/json" \
  -d '{
    "name": "Updated Room Name",
    "isLive": false
  }'
```

#### 8. Delete Room
```bash
curl -X DELETE http://localhost:4005/api/rooms/room1
```

### Browser Testing

#### 1. Open Preview
```
Open file:///absolute/path/to/preview.html in your browser
```

#### 2. Create Room
- Enter Room ID: `demo-room`
- Enter Room Name: `Demo Stream`
- Click "Create Room"

#### 3. Join Room
- Room should appear in the list
- Click "Join" button

#### 4. Send Messages
- Type in message input
- Press Enter to send
- Messages appear in chat

#### 5. Open Multiple Windows
- Open same preview.html in another window
- Both join the same room
- Send messages to each other
- See real-time updates

#### 6. Test Viewer Tracking
- Watch viewer count update in real-time
- See active viewers list update
- Leave the room and see count decrease

---

## Development Workflow

### File Structure
```
05-live-streaming-rooms/
├── server.js              # Express + Socket.io server
├── controller.js          # Room management logic
├── routes.js              # REST API endpoints
├── middleware.js          # Auth, validation, logging
├── schema.js              # Input validation schemas
├── App.jsx                # React testing component
├── preview.html           # Standalone HTML preview
├── theory.md              # Concepts & architecture
├── README.md              # Full documentation
├── setup.md               # This file
├── .env.example           # Environment template
├── package.json           # Dependencies
└── checklist.md           # Feature checklist
```

### Making Changes

#### 1. Modify Controller Logic
Edit `controller.js` to add new methods for room management.

#### 2. Add New API Endpoints
Edit `routes.js` to add new REST endpoints.

#### 3. Add Socket Events
Edit `server.js` to add new WebSocket event handlers.

#### 4. Test Changes
- Restart server: `npm start`
- Refresh preview.html in browser
- Test via cURL or UI

#### 5. Debug Issues
- Check console output in terminal
- Check browser console (F12)
- Check `.env` configuration

---

## Environment Variables

### Available Variables

| Variable | Default | Description |
|----------|---------|-------------|
| `NODE_ENV` | `development` | Environment mode |
| `HTTP_PORT` | `4005` | Server port |
| `FRONTEND_URL` | `http://localhost:3000` | CORS frontend URL |
| `LOG_LEVEL` | `info` | Logging level |

### Setting Variables

**Option 1: .env file**
```env
NODE_ENV=development
HTTP_PORT=4005
FRONTEND_URL=http://localhost:3000
```

**Option 2: Command line**
```bash
PORT=5000 npm start
```

**Option 3: Inside server.js**
```javascript
const PORT = process.env.HTTP_PORT || 4005;
```

---

## Troubleshooting

### Port Already in Use
```bash
# Kill process on port 4005
lsof -i :4005  # Find process
kill -9 <PID>  # Kill by ID

# Or use different port
HTTP_PORT=5005 npm start
```

### Module Not Found
```bash
# Reinstall dependencies
rm -rf node_modules package-lock.json
npm install
```

### Socket.io Connection Failed
- Check if server is running: `npm start`
- Check if port 4005 is open
- Check FRONTEND_URL in .env matches your frontend

### CORS Errors
Edit `.env`:
```env
FRONTEND_URL=http://localhost:3000
```

Make sure it matches your actual frontend URL.

### Room Creation Fails
```bash
curl http://localhost:4005/api/rooms -v
```
Check the error message for validation issues.

### WebSocket Events Not Firing
1. Check browser console for errors
2. Verify Socket.io connection in preview.html
3. Restart server: `npm start`
4. Clear browser cache

---

## Performance Tips

### 1. Monitor Memory Usage
```bash
# In separate terminal
watch -n 1 'ps aux | grep node'
```

### 2. Limit Room Size
```env
MAX_VIEWERS_PER_ROOM=500
```

### 3. Enable Compression
Socket.io compression is enabled by default.

### 4. Use Redis for Scaling
For multi-server setups, add redis adapter:
```bash
npm install socket.io-redis socket.io-parser
```

---

## Deployment

### Production .env
```env
NODE_ENV=production
HTTP_PORT=4005
FRONTEND_URL=https://yourdomain.com
LOG_LEVEL=warn
```

### Start Production Server
```bash
npm start
```

### Using Process Manager (pm2)
```bash
# Install pm2
npm install -g pm2

# Start server
pm2 start server.js --name "live-streaming"

# View logs
pm2 logs live-streaming

# Restart on changes
pm2 restart live-streaming
```

### Docker Deployment
```dockerfile
FROM node:18-alpine

WORKDIR /app
COPY package*.json ./
RUN npm install

COPY . .

EXPOSE 4005
CMD ["npm", "start"]
```

Build and run:
```bash
docker build -t live-streaming .
docker run -p 4005:4005 live-streaming
```

---

## Advanced Features

### 1. Persistent Room Database
Replace in-memory Map with database:
```javascript
// Instead of this.rooms = new Map()
const rooms = await db.collection('rooms').find().toArray();
```

### 2. Redis Adapter for Scaling
```javascript
const redisAdapter = require("socket.io-redis");
io.adapter(redisAdapter.createAdapter(pubClient, subClient));
```

### 3. Authentication
```javascript
io.use(async (socket, next) => {
  const token = socket.handshake.auth.token;
  const user = await verifyToken(token);
  if (!user) return next(new Error('Unauthorized'));
  socket.userId = user.id;
  next();
});
```

### 4. Rate Limiting
```javascript
app.use(rateLimit({
  windowMs: 15 * 60 * 1000,
  max: 100
}));
```

---

## Common Tasks

### Task 1: Add Custom Event
In `server.js`:
```javascript
socket.on('custom:event', (data) => {
  io.to(data.roomId).emit('custom:response', { success: true });
});
```

### Task 2: Store Messages
In `controller.js`:
```javascript
saveMessage(roomId, message) {
  if (!this.messages) this.messages = new Map();
  if (!this.messages.has(roomId)) {
    this.messages.set(roomId, []);
  }
  this.messages.get(roomId).push(message);
}
```

### Task 3: Add Moderation
In `routes.js`:
```javascript
router.post('/rooms/:roomId/kick/:userId', (req, res) => {
  io.to(req.params.userId).emit('room:kicked', {
    reason: req.body.reason
  });
});
```

---

## Useful Commands

```bash
# Install dependencies
npm install

# Start server
npm start

# Development mode (auto-reload)
npm run dev

# Test via API
curl http://localhost:4005/api/rooms

# Check running processes
ps aux | grep node

# View logs
npm start 2>&1 | tee server.log

# Kill server
pkill -f "node server.js"
```

---

## Support

For issues:
1. Check .env configuration
2. Verify port 4005 is available
3. Check browser console (F12)
4. Review server logs
5. Read README.md for detailed docs

---

## Next Steps

1. ✅ Complete setup
2. 📚 Read `theory.md` to understand concepts
3. 🧪 Test all API endpoints
4. 🎨 Customize preview.html UI
5. 🚀 Deploy to production
6. 📖 Explore other modules in series

---

**Module Version:** 1.0.0  
**Last Updated:** March 2024  
**Status:** Production Ready