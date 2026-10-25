/**
 * Redis Pub/Sub Controller
 * Handles publish/subscribe operations and room management
 */

class PubSubController {
  constructor(io, redisPublisher) {
    this.io = io;
    this.redisPublisher = redisPublisher;
    this.channels = new Map();
    this.metrics = { published: 0, received: 0 };
  }

  /**
   * Publish message to Redis channel
   */
  async publishMessage(channel, message) {
    try {
      const count = await this.redisPublisher.publish(
        channel,
        JSON.stringify(message)
      );
      this.metrics.published++;
      return { success: true, channel, subscribers: count, message };
    } catch (error) {
      throw { code: 'PUBLISH_ERROR', message: error.message };
    }
  }

  /**
   * Broadcast to a room
   */
  async broadcastToRoom(roomId, messageType, data) {
    const message = {
      type: messageType,
      data,
      timestamp: Date.now(),
      roomId
    };

    // Publish to Redis
    await this.publishMessage(`room:${roomId}`, message);

    // Also emit via Socket.io
    this.io.to(`room:${roomId}`).emit('room-broadcast', message);

    return { sent: true, roomId, type: messageType };
  }

  /**
   * Send notification to specific user
   */
  async notifyUser(userId, notification) {
    const message = {
      type: 'notification',
      userId,
      ...notification,
      timestamp: Date.now()
    };

    await this.publishMessage(`user:${userId}:notifications`, message);
    return { sent: true, userId };
  }

  /**
   * Get active rooms
   */
  getActiveRooms() {
    const rooms = Array.from(this.io.sockets.adapter.rooms.entries())
      .filter(([name]) => name.startsWith('room:'))
      .map(([name, members]) => ({
        roomId: name.replace('room:', ''),
        memberCount: members.size
      }));
    return rooms;
  }

  /**
   * Get room members
   */
  getRoomMembers(roomId) {
    const room = this.io.sockets.adapter.rooms.get(`room:${roomId}`);
    if (!room) return [];

    return Array.from(room).map(socketId => {
      const socket = this.io.sockets.sockets.get(socketId);
      return {
        socketId,
        userId: socket?.userId,
        userName: socket?.userName
      };
    });
  }

  /**
   * Get controller metrics
   */
  getMetrics() {
    return {
      published: this.metrics.published,
      received: this.metrics.received,
      activeRooms: this.getActiveRooms().length,
      totalConnections: this.io.sockets.sockets.size
    };
  }
}

module.exports = PubSubController;

