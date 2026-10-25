// WebSocket Controller - Core Socket.io logic

const { messageSchema, userPresenceSchema } = require('./schema');

class WebSocketController {
  constructor(io) {
    this.io = io;
    this.activeUsers = new Map(); // socketId -> userInfo
  }

  /**
   * Initialize Socket.io event handlers
   */
  initializeHandlers(socket) {
    socket.on('user:join', (userData) => this.handleUserJoin(socket, userData));
    socket.on('message:send', (message) => this.handleMessageSend(socket, message));
    socket.on('user:typing', (typingData) => this.handleUserTyping(socket, typingData));
    socket.on('disconnect', () => this.handleUserDisconnect(socket));
    socket.on('error', (error) => this.handleSocketError(socket, error));
  }

  /**
   * Handle user join event
   */
  handleUserJoin(socket, userData) {
    try {
      const userInfo = {
        userId: userData.userId,
        username: userData.username,
        socketId: socket.id,
        joinedAt: new Date()
      };

      this.activeUsers.set(socket.id, userInfo);

      // Broadcast user joined to all connected clients
      this.io.emit('user:joined', {
        user: userInfo,
        totalUsers: this.activeUsers.size
      });

      // Send active users list to newly joined user
      socket.emit('users:list', Array.from(this.activeUsers.values()));

      console.log(`✓ User ${userData.username} (${socket.id}) joined`);
    } catch (error) {
      this.handleSocketError(socket, error);
    }
  }

  /**
   * Handle incoming message
   */
  handleMessageSend(socket, messageData) {
    try {
      // Validate message
      const { error, value } = messageSchema.validate(messageData);
      if (error) {
        socket.emit('message:error', { error: error.message });
        return;
      }

      const sender = this.activeUsers.get(socket.id);
      if (!sender) {
        socket.emit('message:error', { error: 'User not registered' });
        return;
      }

      const messagePayload = {
        id: `msg_${Date.now()}_${Math.random()}`,
        senderId: sender.userId,
        senderName: sender.username,
        content: value.content,
        timestamp: value.timestamp || new Date(),
        recipientId: value.recipientId
      };

      // Emit to recipient or broadcast to all
      if (value.recipientId && value.recipientId !== 'all') {
        // Private message
        this.io.emit('message:private', messagePayload);
      } else {
        // Broadcast to all
        this.io.emit('message:received', messagePayload);
      }

      console.log(`► Message from ${sender.username}: ${value.content.substring(0, 50)}`);
    } catch (error) {
      this.handleSocketError(socket, error);
    }
  }

  /**
   * Handle typing indicator
   */
  handleUserTyping(socket, typingData) {
    try {
      const user = this.activeUsers.get(socket.id);
      if (!user) return;

      this.io.emit('user:typing', {
        userId: user.userId,
        username: user.username,
        isTyping: typingData.isTyping
      });
    } catch (error) {
      console.error('Typing error:', error);
    }
  }

  /**
   * Handle user disconnect
   */
  handleUserDisconnect(socket) {
    const user = this.activeUsers.get(socket.id);
    if (user) {
      this.activeUsers.delete(socket.id);
      this.io.emit('user:left', {
        userId: user.userId,
        username: user.username,
        totalUsers: this.activeUsers.size
      });
      console.log(`✗ User ${user.username} disconnected`);
    }
  }

  /**
   * Handle socket errors
   */
  handleSocketError(socket, error) {
    console.error('Socket error:', error);
    socket.emit('socket:error', {
      message: 'An error occurred',
      code: error.code || 'UNKNOWN'
    });
  }

  /**
   * Get active users count
   */
  getActiveUsersCount() {
    return this.activeUsers.size;
  }

  /**
   * Broadcast system message
   */
  broadcastSystemMessage(message) {
    this.io.emit('system:message', {
      message,
      timestamp: new Date()
    });
  }
}

module.exports = WebSocketController;

