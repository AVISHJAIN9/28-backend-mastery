// Redis Adapter Routes - Multi-server Socket.io setup

const express = require('express');
const { Server } = require('socket.io');
const { createAdapter } = require('@socket.io/redis-adapter');
const redis = require('redis');
const RedisAdapterController = require('./controller');
const { redisAuthMiddleware, errorHandler } = require('./middleware');

module.exports = async (app, server) => {
  try {
    // Create Redis clients
    const pubClient = redis.createClient({
      host: process.env.REDIS_HOST || 'localhost',
      port: process.env.REDIS_PORT || 6379,
      password: process.env.REDIS_PASSWORD
    });

    const subClient = pubClient.duplicate();

    // Connect Redis clients
    await pubClient.connect();
    await subClient.connect();

    // Initialize Socket.io with Redis adapter
    const io = new Server(server, {
      cors: {
        origin: process.env.CLIENT_URL || 'http://localhost:3000',
        methods: ['GET', 'POST'],
        credentials: true
      },
      transports: ['websocket', 'polling'],
      adapter: createAdapter(pubClient, subClient)
    });

    // Apply middleware
    io.use(redisAuthMiddleware(pubClient));
    io.on('connection_error', errorHandler);

    // Initialize controller
    const redisController = new RedisAdapterController(io, {
      host: process.env.REDIS_HOST || 'localhost',
      port: process.env.REDIS_PORT || 6379,
      password: process.env.REDIS_PASSWORD
    });

    await redisController.initialize();

    // Handle connections
    io.on('connection', (socket) => {
      redisController.handleSocketConnection(socket);
    });

    // Store in app locals
    app.locals.io = io;
    app.locals.redisController = redisController;
    app.locals.redisClient = pubClient;

    // Setup graceful shutdown
    process.on('SIGTERM', async () => {
      await redisController.shutdown();
    });

    // REST API endpoints
    const router = express.Router();

    router.get('/health', async (req, res) => {
      const metrics = await redisController.getClusterMetrics();
      res.json({
        status: 'ok',
        metrics,
        timestamp: new Date()
      });
    });

    router.get('/metrics', async (req, res) => {
      const metrics = await redisController.getClusterMetrics();
      res.json(metrics);
    });

    router.post('/broadcast', async (req, res) => {
      const { message, channel } = req.body;
      
      await pubClient.publish(
        channel || 'socket:broadcast',
        JSON.stringify({
          type: 'system',
          content: message,
          timestamp: new Date()
        })
      );

      res.json({ success: true, message: 'Message broadcast to all servers' });
    });

    return router;
  } catch (error) {
    console.error('Error setting up Redis Adapter:', error);
    throw error;
  }
};

