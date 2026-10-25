// WebSocket Setup Routes - Configure Socket.io on Express server

const express = require('express');
const { Server } = require('socket.io');
const WebSocketController = require('./controller');
const { socketAuthMiddleware, errorHandler } = require('./middleware');

module.exports = (app, server) => {
  // Initialize Socket.io
  const io = new Server(server, {
    cors: {
      origin: process.env.CLIENT_URL || 'http://localhost:3000',
      methods: ['GET', 'POST'],
      allowedHeaders: ['Content-Type'],
      credentials: true
    },
    reconnection: true,
    reconnectionDelay: 1000,
    reconnectionDelayMax: 5000,
    reconnectionAttempts: 5,
    transports: ['websocket', 'polling']
  });

  // Apply middleware
  io.use(socketAuthMiddleware);
  io.on('connection_error', errorHandler);

  // Initialize controller
  const wsController = new WebSocketController(io);

  // Handle connections
  io.on('connection', (socket) => {
    console.log(`📡 New connection: ${socket.id}`);
    
    // Initialize event handlers
    wsController.initializeHandlers(socket);
  });

  // Expose io to app for use in other routes
  app.locals.io = io;

  // REST API endpoints
  const router = express.Router();

  router.get('/health', (req, res) => {
    res.json({
      status: 'ok',
      activeConnections: wsController.getActiveUsersCount(),
      timestamp: new Date()
    });
  });

  router.post('/broadcast', (req, res) => {
    const { message } = req.body;
    wsController.broadcastSystemMessage(message);
    res.json({ success: true, message: 'Broadcast sent' });
  });

  return router;
};

