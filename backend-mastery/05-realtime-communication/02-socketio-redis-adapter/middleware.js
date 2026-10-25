// Redis Adapter Middleware - Authentication and caching

const redisAuthMiddleware = (redisClient) => {
  return async (socket, next) => {
    try {
      const token = socket.handshake.auth.token;

      if (!token) {
        return next(new Error('Auth token required'));
      }

      // Check if user is already connected on another server
      const existingSession = await redisClient.get(`session:${token}`);
      
      if (existingSession) {
        const session = JSON.parse(existingSession);
        socket.userId = session.userId;
        socket.isAuthenticated = true;
      }

      next();
    } catch (error) {
      next(new Error(`Auth middleware error: ${error.message}`));
    }
  };
};

const errorHandler = (error, socket, next) => {
  console.error('Socket error:', error.message);
  socket.emit('error', { message: error.message, code: error.code });
  socket.disconnect(true);
};

module.exports = {
  redisAuthMiddleware,
  errorHandler
};

