const jwt = require('jsonwebtoken');

/**
 * Verify JWT access token middleware
 */
exports.authenticate = (req, res, next) => {
  try {
    const authHeader = req.headers.authorization;
    
    if (!authHeader || !authHeader.startsWith('Bearer ')) {
      return res.status(401).json({ error: 'Missing or invalid authorization' });
    }

    const token = authHeader.substring(7);
    const decoded = jwt.verify(
      token,
      process.env.JWT_SECRET || 'secret'
    );

    if (decoded.type !== 'access') {
      return res.status(401).json({ error: 'Invalid token type' });
    }

    req.user = decoded;
    next();
  } catch (error) {
    console.error('Auth middleware error:', error);
    if (error.name === 'TokenExpiredError') {
      return res.status(401).json({ error: 'Token expired' });
    }
    res.status(401).json({ error: 'Authentication failed' });
  }
};

/**
 * Validate request schema
 */
exports.validateRequest = (schema) => {
  return (req, res, next) => {
    const { error, value } = schema.validate(req.body, { abortEarly: false });
    
    if (error) {
      const errors = error.details.map(e => ({
        field: e.path.join('.'),
        message: e.message
      }));
      return res.status(400).json({ error: 'Validation failed', details: errors });
    }

    req.body = value;
    next();
  };
};

/**
 * Rate limiting middleware
 */
exports.rateLimit = (maxAttempts = 10, windowMs = 15 * 60 * 1000) => {
  const attempts = new Map();
  
  return (req, res, next) => {
    const key = req.ip;
    const now = Date.now();
    
    if (!attempts.has(key)) {
      attempts.set(key, []);
    }
    
    const userAttempts = attempts.get(key).filter(time => now - time < windowMs);
    
    if (userAttempts.length >= maxAttempts) {
      return res.status(429).json({ error: 'Too many attempts' });
    }
    
    userAttempts.push(now);
    attempts.set(key, userAttempts);
    next();
  };
};

