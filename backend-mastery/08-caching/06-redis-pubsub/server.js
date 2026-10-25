import express from 'express';
import cors from 'cors';
import helmet from 'helmet';
import winston from 'winston';
import dotenv from 'dotenv';
import redis from 'redis';
import { createServer } from 'http';
import { Server as SocketIOServer } from 'socket.io';

dotenv.config();

const app = express();
const server = createServer(app);
const HTTP_PORT = process.env.HTTP_PORT || 6414;
const REDIS_URL = process.env.REDIS_URL || 'redis://localhost:6379';

// Socket.io server
const io = new SocketIOServer(server, {
  cors: { origin: process.env.FRONTEND_URL || 'http://localhost:3000', credentials: true }
});

// Middleware
app.use(cors({ origin: process.env.FRONTEND_URL || 'http://localhost:3000' }));
app.use(helmet());
app.use(express.json());

// Logger
const logger = winston.createLogger({
  level: 'info',
  format: winston.format.json(),
  transports: [
    new winston.transports.Console({ format: winston.format.simple() })
  ]
});

// Redis clients (separate for pub/sub and regular commands)
const redisClient = redis.createClient({ url: REDIS_URL });
const redisSubscriber = redis.createClient({ url: REDIS_URL });
const redisPublisher = redis.createClient({ url: REDIS_URL });

redisClient.on('error', (err) => logger.error('Redis error', { error: err.message }));
redisSubscriber.on('error', (err) => logger.error('Redis subscriber error', { error: err.message }));
redisPublisher.on('error', (err) => logger.error('Redis publisher error', { error: err.message }));

// Metrics
const metrics = {
  publishedMessages: 0,
  receivedMessages: 0,
  activeSubscriptions: 0,
  errors: 0
};

// Keep track of subscribed channels
const subscriptionMap = new Map();

// Connect Redis clients
(async () => {
  try {
    await redisClient.connect();
    await redisSubscriber.connect();
    await redisPublisher.connect();
    logger.info('Connected to Redis');
  } catch (err) {
    logger.error('Redis connection failed', { error: err.message });
  }
})();

// ==================== Socket.io Event Handlers ====================

io.on('connection', (socket) => {
  logger.info(`Client connected: ${socket.id}`);

  // User joins a chat room
  socket.on('join-room', async (data) => {
    const { roomId, userId, userName } = data;
    socket.join(`room:${roomId}`);
    
    // Store user info
    socket.roomId = roomId;
    socket.userId = userId;
    socket.userName = userName;

    // Publish event that user joined
    await redisPublisher.publish(`room:${roomId}`, JSON.stringify({
      type: 'user-joined',
      userId,
      userName,
      timestamp: Date.now()
    }));

    // Broadcast to room members
    io.to(`room:${roomId}`).emit('user-joined', {
      userId,
      userName,
      timestamp: new Date().toISOString()
    });

    logger.info(`User ${userId} joined room ${roomId}`);
  });

  // User sends a message to room
  socket.on('send-message', async (data) => {
    const { roomId, text } = data;
    const message = {
      type: 'message',
      userId: socket.userId,
      userName: socket.userName,
      text,
      timestamp: Date.now(),
      roomId
    };

    // Publish to Redis (for other services to consume)
    await redisPublisher.publish(`room:${roomId}`, JSON.stringify(message));

    // Also emit via Socket.io for connected clients
    io.to(`room:${roomId}`).emit('new-message', {
      userId: socket.userId,
      userName: socket.userName,
      text,
      timestamp: new Date().toISOString()
    });

    metrics.publishedMessages++;
    logger.info(`Message published to room ${roomId}`);
  });

  // Subscribe to a custom channel
  socket.on('subscribe-channel', async (data) => {
    const { channel } = data;
    socket.join(`pubsub:${channel}`);

    // Create a redis subscriber for this channel if needed
    if (!subscriptionMap.has(channel)) {
      const channelSub = redis.createClient({ url: REDIS_URL });
      await channelSub.connect();
      await channelSub.subscribe(channel, (message) => {
        metrics.receivedMessages++;
        // Broadcast to all socket.io clients subscribed to this channel
        io.to(`pubsub:${channel}`).emit('channel-message', {
          channel,
          message: typeof message === 'string' ? JSON.parse(message) : message,
          timestamp: new Date().toISOString()
        });
      });
      subscriptionMap.set(channel, channelSub);
      metrics.activeSubscriptions++;
    }

    socket.emit('subscribed', { channel, status: 'success' });
    logger.info(`Socket ${socket.id} subscribed to channel ${channel}`);
  });

  socket.on('disconnect', () => {
    logger.info(`Client disconnected: ${socket.id}`);
  });
});

// ==================== HTTP API Endpoints ====================

app.get('/api/health', (req, res) => {
  res.json({ status: 'ok', timestamp: new Date().toISOString() });
});

// Publish message to a channel
app.post('/api/publish', async (req, res) => {
  try {
    const { channel, message } = req.body;
    if (!channel || !message) {
      return res.status(400).json({ error: 'channel and message required' });
    }

    const count = await redisPublisher.publish(channel, JSON.stringify(message));
    metrics.publishedMessages++;

    res.json({
      success: true,
      channel,
      subscribersReceived: count,
      timestamp: new Date().toISOString()
    });

    logger.info(`Published to channel ${channel}`, { subscribers: count });
  } catch (err) {
    logger.error('Publish error', { error: err.message });
    metrics.errors++;
    res.status(500).json({ error: 'Publish failed' });
  }
});

// Get metrics
app.get('/api/metrics', (req, res) => {
  res.json({
    metrics,
    uptime: process.uptime(),
    timestamp: new Date().toISOString()
  });
});

// ==================== Real-Time Notifications Example ====================

// Endpoint to send a system-wide notification
app.post('/api/broadcast-notification', async (req, res) => {
  try {
    const { title, message, severity = 'info' } = req.body;
    const notification = { type: 'notification', title, message, severity, timestamp: Date.now() };

    // Publish to a system-wide channel
    await redisPublisher.publish('system:notifications', JSON.stringify(notification));

    // Also emit via Socket.io
    io.emit('system-notification', {
      title,
      message,
      severity,
      timestamp: new Date().toISOString()
    });

    res.json({ success: true, sent: true });
    logger.info('System notification broadcasted');
  } catch (err) {
    logger.error('Broadcast notification error', { error: err.message });
    metrics.errors++;
    res.status(500).json({ error: 'Broadcast failed' });
  }
});

// ==================== Presence Tracking (Typing Indicators) ====================

io.on('connection', (socket) => {
  socket.on('typing', async (data) => {
    const { roomId, userName } = data;
    
    // Broadcast typing indicator
    io.to(`room:${roomId}`).emit('user-typing', {
      userId: socket.userId,
      userName,
      timestamp: new Date().toISOString()
    });

    // Publish to Redis for backend services
    await redisPublisher.publish(`room:${roomId}:events`, JSON.stringify({
      type: 'user-typing',
      userId: socket.userId,
      userName,
      timestamp: Date.now()
    }));
  });

  socket.on('stopped-typing', async (data) => {
    const { roomId } = data;
    io.to(`room:${roomId}`).emit('user-stopped-typing', {
      userId: socket.userId,
      timestamp: new Date().toISOString()
    });
  });
});

// ==================== Room Management ====================

app.get('/api/rooms', (req, res) => {
  const rooms = Array.from(io.sockets.adapter.rooms.entries())
    .filter(([name]) => name.startsWith('room:'))
    .map(([name, members]) => ({
      roomId: name.replace('room:', ''),
      memberCount: members.size
    }));

  res.json({ rooms });
});

app.get('/api/rooms/:roomId/members', (req, res) => {
  const { roomId } = req.params;
  const room = io.sockets.adapter.rooms.get(`room:${roomId}`);
  
  if (!room) {
    return res.json({ members: [] });
  }

  const members = Array.from(room).map(socketId => {
    const socket = io.sockets.sockets.get(socketId);
    return {
      socketId,
      userId: socket?.userId || 'unknown',
      userName: socket?.userName || 'unknown'
    };
  });

  res.json({ roomId, members, count: members.length });
});

// ==================== Error Handling ====================

app.use((err, req, res, next) => {
  logger.error('Unhandled error', { error: err.message, stack: err.stack });
  res.status(500).json({ error: 'Internal server error' });
});

// ==================== Graceful Shutdown ====================

process.on('SIGTERM', async () => {
  logger.info('SIGTERM signal received, shutting down gracefully...');
  
  // Close server
  server.close(() => {
    logger.info('Express server closed');
    process.exit(0);
  });

  // Cleanup Redis connections
  await redisClient.quit();
  await redisSubscriber.quit();
  await redisPublisher.quit();
  
  subscriptionMap.forEach(sub => sub.quit());
});

// ==================== Start Server ====================

server.listen(HTTP_PORT, () => {
  logger.info(`✅ Redis Pub/Sub server running on port ${HTTP_PORT}`);
  logger.info(`📊 Metrics endpoint: http://localhost:${HTTP_PORT}/api/metrics`);
  logger.info(`🏥 Health check: http://localhost:${HTTP_PORT}/api/health`);
});

export default app;
