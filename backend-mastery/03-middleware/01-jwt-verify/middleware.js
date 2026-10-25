const jwt = require('jsonwebtoken');

const jwtVerifyMiddleware = (req, res, next) => {
  const token = req.headers.authorization?.split(' ')[1];
  
  if (!token) {
    req.user = null;
    return next();
  }
  
  try {
    const secret = process.env.JWT_SECRET || 'your_secret_key';
    const decoded = jwt.verify(token, secret);
    req.user = decoded;
    next();
  } catch (err) {
    req.user = null;
    res.status(401).json({ error: 'Invalid token', details: err.message });
  }
};

const requireAuth = (req, res, next) => {
  if (!req.user) {
    return res.status(401).json({ error: 'Authentication required' });
  }
  next();
};

module.exports = { jwtVerifyMiddleware, requireAuth };
