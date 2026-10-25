require('dotenv').config();
const express = require('express');
const cors = require('cors');
const helmet = require('helmet');
const { createServer } = require('http');
const { Server } = require('socket.io');
const RoomsController = require('./controller');

const app = express();
const HTTP_PORT = process.env.HTTP_PORT || 4005;
const server = createServer(app);

// ==================== Socket.io Setup ====================

const io = new Server(server, {
  cors: {
    origin: process.env.FRONTEND_URL || 'http://localhost:3000',
    methods: ['GET', 'POST'],
    credentials: true
  }
});

// Initialize rooms controller with io instance
const roomsController = new RoomsController(io);

// ==================== Middleware ====================

// Security
app.use(helmet());
app.use(cors({
  origin: process.env.FRONTEND_URL || 'http://localhost:3000',
  credentials: true
}));

// Body parsing
app.use(express.json());
app.use(express.urlencoded({ extended: true }));

// ==================== REST Routes ====================

const rolesRoute = require('./routes');
app.use('/api', rolesRoute(io, roomsController));

// ==================== Socket.io Event Handlers ====================

io.on('connection', (socket) => {
  console.log(`✓ User connected: ${socket.id}`);

  // Join room event
  socket.on('room:join', (data) => {
    const { roomId, userId, username } = data;
    
    if (!roomId) {
      socket.emit('error', { message: 'Room ID required' });
      return;
    }

    // Store user info on socket
    socket.userId = userId;
    socket.username = username;
    socket.roomId = roomId;

    // Join the room
    socket.join(roomId);

    // Track viewer in controller
    roomsController.addViewer(roomId, socket.id, { userId, username });

    // Get total viewers in room
    const viewerCount = io.sockets.adapter.rooms.get(roomId)?.size || 0;

    // Notify others in room
    socket.broadcast.to(roomId).emit('user:joined', {
      socketId: socket.id,
      userId,
      username,
      viewerCount,
      timestamp: new Date().toISOString()
    });

    // Send current viewers to joining user
    const viewers = roomsController.getViewers(roomId);
    socket.emit('room:viewers', {
      viewers,
      viewerCount,
      timestamp: new Date().toISOString()
    });

    console.log(`✓ ${username} joined room ${roomId} (Total: ${viewerCount})`);
  });

  // Leave room event
  socket.on('room:leave', (data) => {
    const { roomId } = data;
    
    if (!roomId) return;

    socket.leave(roomId);
    
    // Remove viewer from controller
    roomsController.removeViewer(roomId, socket.id);

    // Get updated viewer count
    const viewerCount = io.sockets.adapter.rooms.get(roomId)?.size || 0;

    // Notify others
    io.to(roomId).emit('user:left', {
      socketId: socket.id,
      username: socket.username,
      viewerCount,
      timestamp: new Date().toISOString()
    });

    console.log(`✓ ${socket.username} left room ${roomId} (Total: ${viewerCount})`);
  });

  // Stream data event
  socket.on('stream:data', (data) => {
    const { roomId, type, payload } = data;
    
    if (!roomId) return;

    // Broadcast to all in room except sender
    socket.broadcast.to(roomId).emit('stream:update', {
      socketId: socket.id,
      username: socket.username,
      type,
      payload,
      timestamp: new Date().toISOString()
    });

    console.log(`✓ Stream data sent to room ${roomId}: ${type}`);
  });

  // Message event
  socket.on('message:send', (data) => {
    const { roomId, text } = data;
    
    if (!roomId || !text) return;

    // Broadcast to all in room including sender
    io.to(roomId).emit('message:received', {
      socketId: socket.id,
      username: socket.username,
      text,
      timestamp: new Date().toISOString()
    });

    console.log(`✓ Message in room ${roomId} from ${socket.username}`);
  });

  // Typing indicator
  socket.on('user:typing', (data) => {
    const { roomId, isTyping } = data;
    
    if (!roomId) return;

    socket.broadcast.to(roomId).emit('user:typing', {
      socketId: socket.id,
      username: socket.username,
      isTyping,
      timestamp: new Date().toISOString()
    });
  });

  // Disconnect event
  socket.on('disconnect', () => {
    const roomId = socket.roomId;
    
    if (roomId) {
      socket.leave(roomId);
      roomsController.removeViewer(roomId, socket.id);
      
      const viewerCount = io.sockets.adapter.rooms.get(roomId)?.size || 0;
      
      io.to(roomId).emit('user:left', {
        socketId: socket.id,
        username: socket.username,
        viewerCount,
        timestamp: new Date().toISOString()
      });

      console.log(`✓ ${socket.username} disconnected from room ${roomId}`);
    }

    console.log(`✓ User disconnected: ${socket.id}`);
  });

  // Error handling
  socket.on('error', (error) => {
    console.error('Socket error:', error);
  });
});

// ==================== Health Check ====================

app.get('/health', (req, res) => {
  res.json({ 
    status: 'ok',
    module: '05 Live Streaming Rooms',
    category: 'Realtime Communication',
    port: HTTP_PORT,
    sockets: io.engine.clientsCount,
    timestamp: new Date().toISOString()
  });
});

// ==================== Root Endpoint ====================

app.get('/', (req, res) => {
  res.json({
    name: '05 Live Streaming Rooms',
    module: '05-realtime-communication',
    description: 'Real-time streaming with Socket.io rooms',
    version: '1.0.0',
    features: [
      'Create and manage rooms',
      'Track viewers in real-time',
      'Broadcast within rooms',
      'User join/leave notifications',
      'Live stream messages',
      'Typing indicators'
    ],
    endpoints: {
      health: '/health',
      api: '/api',
      rooms: '/api/rooms',
      sockets: '/api/sockets'
    }
  });
});

// ==================== Error Handler ====================

app.use((err, req, res, next) => {
  console.error('Error:', err.message);
  res.status(err.status || 500).json({
    error: err.message || 'Internal server error',
    status: err.status || 500
  });
});

// ==================== Start Server ====================

server.listen(HTTP_PORT, () => {
  console.log(`\n${'='.repeat(60)}`);
  console.log(`✓ 05 Live Streaming Rooms running on http://localhost:${HTTP_PORT}`);
  console.log(`✓ WebSocket ready for connections`);
  console.log(`✓ Health check: http://localhost:${HTTP_PORT}/health`);
  console.log(`✓ API root: http://localhost:${HTTP_PORT}/`);
  console.log(`${'='.repeat(60)}\n`);
});

// Graceful shutdown
process.on('SIGTERM', () => {
  console.log('SIGTERM received, shutting down gracefully');
  server.close(() => {
    console.log('Server closed');
    process.exit(0);
  });
});

module.exports = { app, server, io };
