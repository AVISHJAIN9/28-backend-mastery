class PresenceController {
  constructor(io, redis) { this.io = io; this.redis = redis; this.typingUsers = new Map(); }
  handleUserOnline(userId) {
    this.io.emit('presence:online', { userId, timestamp: Date.now() });
  }
  handleUserTyping(userId, roomId) {
    if(this.typingUsers.has(userId)) return;
    this.typingUsers.set(userId, true);
    this.io.to(roomId).emit('typing:start', { userId });
    setTimeout(() => { this.typingUsers.delete(userId); this.io.to(roomId).emit('typing:stop', { userId }); }, 3000);
  }
  handleUserOffline(userId) {
    this.io.emit('presence:offline', { userId, timestamp: Date.now() });
  }
  getActiveUsers() { return Array.from(this.typingUsers.keys()); }
}
module.exports = PresenceController;