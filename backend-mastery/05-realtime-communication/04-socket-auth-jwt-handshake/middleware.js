module.exports = {
  socketAuthMiddleware: (socket, next) => {
    const token = socket.handshake.auth.token;
    if (!token) return next(new Error('Token required'));
    try {
      const decoded = jwt.verify(token, process.env.JWT_SECRET);
      socket.userId = decoded.userId;
      next();
    } catch (e) { next(new Error('Invalid token')); }
  }
};