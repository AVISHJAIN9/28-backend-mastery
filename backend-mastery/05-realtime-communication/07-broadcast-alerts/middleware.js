module.exports = { alertAuth: (req, res, next) => {
  if (!req.user || !req.user.isAdmin) return res.status(403).json({ error: 'Admin only' });
  next();
} };