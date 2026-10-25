const passport = require('passport');

const protectedRoute = (req, res, next) => {
  if (req.isAuthenticated?.()) {
    return next();
  }
  res.status(401).json({ error: 'Not authenticated' });
};

const jwtAuth = (req, res, next) => {
  const token = req.headers.authorization?.split(' ')[1];
  if (!token) {
    return res.status(401).json({ error: 'No token provided' });
  }
  // Verify token logic here
  next();
};

module.exports = { protectedRoute, jwtAuth };
