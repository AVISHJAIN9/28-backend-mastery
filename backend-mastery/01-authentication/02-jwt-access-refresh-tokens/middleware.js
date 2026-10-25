const jwt = require('jsonwebtoken');
const Joi = require('joi');

/**
 * Verify JWT access token middleware
 * Extracts and validates the JWT token from Authorization header
 */
exports.authenticate = (req, res, next) => {
  try {
    const authHeader = req.headers.authorization;
    
    if (!authHeader || !authHeader.startsWith('Bearer ')) {
      return res.status(401).json({ error: 'Missing or invalid authorization header' });
    }

    const token = authHeader.substring(7); // Remove 'Bearer ' prefix

    const decoded = jwt.verify(
      token,
      process.env.JWT_SECRET || 'your-secret-key'
    );

    // Check if token is access token
    if (decoded.type !== 'access') {
      return res.status(401).json({ error: 'Invalid token type' });
    }

    req.user = decoded;
    next();
  } catch (error) {
    console.error('Authentication error:', error);
    
    if (error.name === 'TokenExpiredError') {
      return res.status(401).json({ error: 'Access token expired' });
    }
    
    if (error.name === 'JsonWebTokenError') {
      return res.status(401).json({ error: 'Invalid token' });
    }

    res.status(401).json({ error: 'Authentication failed' });
  }
};

/**
 * Optional authentication - doesn't fail if token is invalid
 * Useful for endpoints that can work with or without authentication
 */
exports.optionalAuth = (req, res, next) => {
  try {
    const authHeader = req.headers.authorization;
    
    if (authHeader && authHeader.startsWith('Bearer ')) {
      const token = authHeader.substring(7);
      const decoded = jwt.verify(
        token,
        process.env.JWT_SECRET || 'your-secret-key'
      );
      
      if (decoded.type === 'access') {
        req.user = decoded;
      }
    }
    
    next();
  } catch (error) {
    // Silently ignore errors and continue without authentication
    next();
  }
};

/**
 * Validate request body against provided schema
 * @param {Joi.Schema} schema - Joi validation schema
 */
exports.validateRequest = (schema) => {
  return (req, res, next) => {
    try {
      const { error, value } = schema.validate(req.body, {
        abortEarly: false,
        stripUnknown: true
      });

      if (error) {
        const errors = error.details.map(detail => ({
          field: detail.path.join('.'),
          message: detail.message
        }));
        
        return res.status(400).json({
          error: 'Validation failed',
          details: errors
        });
      }

      req.validatedBody = value;
      req.body = value;
      next();
    } catch (err) {
      console.error('Validation error:', err);
      res.status(500).json({ error: 'Validation failed' });
    }
  };
};

/**
 * Check if token is about to expire (within 5 minutes)
 * Useful for alerting client to refresh
 */
exports.checkTokenExpiry = (req, res, next) => {
  try {
    const authHeader = req.headers.authorization;
    
    if (!authHeader || !authHeader.startsWith('Bearer ')) {
      return next();
    }

    const token = authHeader.substring(7);
    const decoded = jwt.decode(token); // Decode without verifying

    if (decoded && decoded.exp) {
      const expiresIn = decoded.exp * 1000 - Date.now();
      const fiveMinutes = 5 * 60 * 1000;

      if (expiresIn > 0 && expiresIn < fiveMinutes) {
        res.setHeader('X-Token-Expires-Soon', 'true');
        res.setHeader('X-Token-Expires-In', Math.floor(expiresIn / 1000));
      }
    }

    next();
  } catch (error) {
    next();
  }
};

/**
 * Rate limiting middleware for login/refresh endpoints
 */
exports.rateLimit = (maxAttempts = 5, windowMs = 15 * 60 * 1000) => {
  const attempts = new Map();

  return (req, res, next) => {
    const identifier = req.ip;
    const now = Date.now();

    if (!attempts.has(identifier)) {
      attempts.set(identifier, []);
    }

    const userAttempts = attempts.get(identifier);
    
    // Remove old attempts outside the window
    const recentAttempts = userAttempts.filter(time => now - time < windowMs);
    
    if (recentAttempts.length >= maxAttempts) {
      return res.status(429).json({
        error: 'Too many attempts. Please try again later.',
        retryAfter: Math.ceil((recentAttempts[0] + windowMs - now) / 1000)
      });
    }

    recentAttempts.push(now);
    attempts.set(identifier, recentAttempts);
    next();
  };
};

