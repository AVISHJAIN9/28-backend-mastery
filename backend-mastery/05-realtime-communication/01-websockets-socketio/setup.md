# WebSockets & Socket.io - Setup Guide

## Prerequisites

```bash
Node.js 16+
npm or yarn
Express.js application
```

## Installation

```bash
npm install socket.io socket.io-client joi cors express http
```

## Environment Configuration

Create `.env` file:
```env
PORT=4000
CLIENT_URL=http://localhost:3000
NODE_ENV=development
```

## Server Setup

```javascript
const express = require('express');
const http = require('http');
const socketRoutes = require('./05-realtime-communication/01-websockets-socketio/routes');

const app = express();
const server = http.createServer(app);

// Mount Socket.io routes
const wsRouter = socketRoutes(app, server);
app.use('/api/ws', wsRouter);

const PORT = process.env.PORT || 4000;
server.listen(PORT, () => {
  console.log(`🚀 WebSocket server running on port ${PORT}`);
});
```

## Client Setup

```javascript
import { io } from 'socket.io-client';

const socket = io('http://localhost:4000', {
  auth: {
    token: 'guest_user_123'
  }
});

socket.on('connect', () => {
  console.log('Connected to server');
  socket.emit('user:join', {
    userId: 'user_123',
    username: 'John'
  });
});

socket.on('message:received', (message) => {
  console.log('Message:', message);
});
```

## Testing

```bash
# Start server
npm start

# Send test message via curl
curl -X POST http://localhost:4000/api/ws/broadcast \
  -H "Content-Type: application/json" \
  -d '{"message": "Hello everyone"}'
```

## Common Issues

**Issue:** Connection refused
- **Solution:** Ensure server is running and PORT is correct

**Issue:** CORS errors
- **Solution:** Check CLIENT_URL matches your frontend URL

**Issue:** Auth fails
- **Solution:** Verify token format matches middleware expectations

## Next Steps

1. Implement proper JWT authentication
2. Add message persistence to database
3. Implement Redis adapter for horizontal scaling
4. Add room management
