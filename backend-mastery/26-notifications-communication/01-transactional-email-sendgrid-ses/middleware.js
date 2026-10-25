const jwt = require('jsonwebtoken');
const validator = require('email-validator');

// ==================== JWT Authentication ====================

const verifyToken = (req, res, next) => {
  const token = req.headers.authorization?.split(' ')[1];
  if (!token) {
    return res.status(401).json({ error: 'No authentication token provided' });
  }

  try {
    const decoded = jwt.verify(token, process.env.JWT_SECRET || 'test-secret-key');
    req.user = decoded;
    next();
  } catch (error) {
    return res.status(401).json({ error: 'Invalid or expired token' });
  }
};

// ==================== Email Validation ====================

const validateEmailInput = (req, res, next) => {
  const { recipientEmail, subject, template, body } = req.body;

  // Check required fields
  if (!recipientEmail) {
    return res.status(400).json({ error: 'recipientEmail is required' });
  }
  if (!subject) {
    return res.status(400).json({ error: 'subject is required' });
  }
  if (!template && !body) {
    return res.status(400).json({ error: 'Either template or body is required' });
  }

  // Validate email format
  if (!validator.validate(recipientEmail)) {
    return res.status(400).json({ error: 'Invalid email format' });
  }

  // Validate subject length
  if (subject.length > 200) {
    return res.status(400).json({ error: 'Subject must be less than 200 characters' });
  }

  next();
};

// ==================== Rate Limiting ====================

const emailRateLimiter = (() => {
  const limits = {}; // { userId: { count, resetTime } }
  const LIMIT = 10; // emails per minute
  const WINDOW = 60 * 1000; // 1 minute

  return (req, res, next) => {
    const userId = req.user?.id || req.ip;
    const now = Date.now();

    if (!limits[userId]) {
      limits[userId] = { count: 0, resetTime: now + WINDOW };
    }

    if (now > limits[userId].resetTime) {
      limits[userId] = { count: 0, resetTime: now + WINDOW };
    }

    limits[userId].count++;

    if (limits[userId].count > LIMIT) {
      return res.status(429).json({ 
        error: 'Rate limit exceeded: 10 emails per minute',
        retryAfter: Math.ceil((limits[userId].resetTime - now) / 1000)
      });
    }

    next();
  };
})();

// ==================== Error Handler ====================

const errorHandler = (err, req, res, next) => {
  console.error('Error:', err.message);

  if (err.name === 'ValidationError') {
    return res.status(400).json({ error: err.message });
  }

  if (err.name === 'AuthenticationError') {
    return res.status(401).json({ error: err.message });
  }

  res.status(500).json({ error: 'Internal server error' });
};

module.exports = {
  verifyToken,
  validateEmailInput,
  emailRateLimiter,
  errorHandler
};

