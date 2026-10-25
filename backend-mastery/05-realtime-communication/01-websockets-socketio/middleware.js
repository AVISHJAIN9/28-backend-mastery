// WebSocket Middleware - Authentication and validation

const socketAuthMiddleware = (socket, next) => {
  try {
    const token = socket.handshake.auth.token;
    
    if (!token) {
      return next(new Error('Authentication token required'));
    }

    // Verify token (simplified - use JWT in production)
    if (token.startsWith('guest_')) {
      socket.userId = token;
      socket.isAuthenticated = true;
      next();
    } else {
      next(new Error('Invalid authentication token'));
    }
  } catch (error) {
    next(new Error(`Auth middleware error: ${error.message}`));
  }
};

const errorHandler = (error, socket, next) => {
  console.error('Socket middleware error:', error.message);
  socket.emit('auth:error', { message: error.message });
  socket.disconnect(true);
};

module.exports = {
  socketAuthMiddleware,
  errorHandler
};

