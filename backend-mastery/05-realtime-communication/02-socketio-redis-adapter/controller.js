// Redis Adapter Controller - Multi-server Socket.io scaling

const redis = require('redis');
const { messageSchema } = require('./schema');

class RedisAdapterController {
  constructor(io, redisConfig) {
    this.io = io;
    this.redisConfig = redisConfig;
    this.redisClient = null;
    this.subscriber = null;
    this.serverMetrics = {
      serverId: process.env.SERVER_ID || `server_${Date.now()}`,
      startTime: Date.now(),
      messagesSent: 0,
      messagesReceived: 0,
      connectionCount: 0
    };
  }

  /**
   * Initialize Redis connection and pub/sub
   */
  async initialize() {
    try {
      // Main Redis client for cache/operations
      this.redisClient = redis.createClient(this.redisConfig);
      
      // Subscriber for pub/sub
      this.subscriber = this.redisClient.duplicate();

      // Connect both clients
      await this.redisClient.connect();
      await this.subscriber.connect();

      console.log('✓ Redis connections established');

      // Subscribe to cross-server channels
      await this.subscriber.subscribe('socket:broadcast', (message) => {
        this.handleRedisMessage(message);
      });

      return true;
    } catch (error) {
      console.error('Redis initialization failed:', error);
      return false;
    }
  }

  /**
   * Handle socket connection
   */
  handleSocketConnection(socket) {
    this.serverMetrics.connectionCount++;

    // Store socket info in Redis
    this.storeSocketInRedis(socket);

    // Listen for socket events
    socket.on('message:send', (data) => this.handleMessage(socket, data));
    socket.on('presence:update', (data) => this.handlePresenceUpdate(socket, data));
    socket.on('disconnect', () => this.handleDisconnect(socket));

    console.log(`📡 Connection from server ${this.serverMetrics.serverId}: ${socket.id}`);
  }

  /**
   * Store socket info in Redis (cross-server access)
   */
  async storeSocketInRedis(socket) {
    try {
      const socketData = {
        socketId: socket.id,
        serverId: this.serverMetrics.serverId,
        userId: socket.userId || 'anonymous',
        connectedAt: Date.now(),
        ip: socket.handshake.address
      };

      await this.redisClient.setEx(
        `socket:${socket.id}`,
        3600, // 1 hour TTL
        JSON.stringify(socketData)
      );

      // Add to server's socket list
      await this.redisClient.sAdd(
        `server:${this.serverMetrics.serverId}:sockets`,
        socket.id
      );
    } catch (error) {
      console.error('Error storing socket in Redis:', error);
    }
  }

  /**
   * Handle incoming message - broadcast via Redis
   */
  async handleMessage(socket, messageData) {
    try {
      const { error, value } = messageSchema.validate(messageData);
      if (error) {
        socket.emit('error', { error: error.message });
        return;
      }

      const messagePayload = {
        id: `msg_${Date.now()}_${Math.random()}`,
        senderId: socket.userId,
        serverId: this.serverMetrics.serverId,
        content: value.content,
        timestamp: new Date(),
        channel: value.channel
      };

      // Publish to Redis (all servers subscribe to this)
      await this.redisClient.publish(
        'socket:broadcast',
        JSON.stringify(messagePayload)
      );

      this.serverMetrics.messagesSent++;
      console.log(`► Message published: ${value.content.substring(0, 30)}`);
    } catch (error) {
      console.error('Error handling message:', error);
    }
  }

  /**
   * Handle Redis published messages
   */
  handleRedisMessage(message) {
    try {
      const data = JSON.parse(message);
      this.serverMetrics.messagesReceived++;

      // Broadcast to all connected sockets on this server
      this.io.emit('message:received', data);

      console.log(`◄ Message received (from ${data.serverId}): ${data.content.substring(0, 30)}`);
    } catch (error) {
      console.error('Error handling Redis message:', error);
    }
  }

  /**
   * Handle presence updates (online/offline/away)
   */
  async handlePresenceUpdate(socket, presenceData) {
    try {
      const presence = {
        userId: socket.userId,
        status: presenceData.status,
        serverId: this.serverMetrics.serverId,
        timestamp: Date.now()
      };

      // Store in Redis
      await this.redisClient.setEx(
        `presence:${socket.userId}`,
        1800, // 30 min TTL
        JSON.stringify(presence)
      );

      // Broadcast presence change
      await this.redisClient.publish(
        'socket:broadcast',
        JSON.stringify({
          type: 'presence:changed',
          ...presence
        })
      );
    } catch (error) {
      console.error('Error updating presence:', error);
    }
  }

  /**
   * Handle disconnect
   */
  async handleDisconnect(socket) {
    try {
      this.serverMetrics.connectionCount--;

      await this.redisClient.del(`socket:${socket.id}`);
      await this.redisClient.sRem(
        `server:${this.serverMetrics.serverId}:sockets`,
        socket.id
      );

      console.log(`✗ Disconnected: ${socket.id}`);
    } catch (error) {
      console.error('Error handling disconnect:', error);
    }
  }

  /**
   * Get metrics from all servers
   */
  async getClusterMetrics() {
    try {
      const servers = await this.redisClient.keys('server:*:sockets');
      let totalConnections = 0;

      for (const serverKey of servers) {
        const count = await this.redisClient.sCard(serverKey);
        totalConnections += count;
      }

      return {
        servers: servers.length,
        totalConnections,
        localConnections: this.serverMetrics.connectionCount,
        messagesSent: this.serverMetrics.messagesSent,
        messagesReceived: this.serverMetrics.messagesReceived,
        uptime: Date.now() - this.serverMetrics.startTime
      };
    } catch (error) {
      console.error('Error getting cluster metrics:', error);
      return null;
    }
  }

  /**
   * Cleanup on shutdown
   */
  async shutdown() {
    try {
      if (this.redisClient) {
        await this.redisClient.quit();
      }
      if (this.subscriber) {
        await this.subscriber.quit();
      }
      console.log('Redis connections closed');
    } catch (error) {
      console.error('Error during shutdown:', error);
    }
  }
}

module.exports = RedisAdapterController;

