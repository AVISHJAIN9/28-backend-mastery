const jwt = require('jsonwebtoken');

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

// ==================== Request Validation ====================

const validateQueueInput = (req, res, next) => {
  const { recipientEmail, subject } = req.body;

  if (!recipientEmail) {
    return res.status(400).json({ error: 'recipientEmail is required' });
  }
  if (!subject) {
    return res.status(400).json({ error: 'subject is required' });
  }

  // Basic email validation
  const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
  if (!emailRegex.test(recipientEmail)) {
    return res.status(400).json({ error: 'Invalid email format' });
  }

  next();
};

const validateBounceWebhook = (req, res, next) => {
  const { email } = req.body;

  if (!email) {
    return res.status(400).json({ error: 'email is required' });
  }

  const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
  if (!emailRegex.test(email)) {
    return res.status(400).json({ error: 'Invalid email format' });
  }

  // Optional: Verify webhook signature
  const signature = req.headers['x-webhook-signature'];
  if (process.env.VERIFY_WEBHOOKS === 'true' && !signature) {
    return res.status(401).json({ error: 'Invalid webhook signature' });
  }

  next();
};

// ==================== Rate Limiting ====================

const queueRateLimiter = (() => {
  const limits = {}; // { userId: { count, resetTime } }
  const LIMIT = 100; // requests per minute
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
        error: 'Rate limit exceeded: 100 requests per minute',
        retryAfter: Math.ceil((limits[userId].resetTime - now) / 1000)
      });
    }

    next();
  };
})();

// ==================== Logging Middleware ====================

const logQueueOperation = (req, res, next) => {
  const startTime = Date.now();

  res.on('finish', () => {
    const duration = Date.now() - startTime;
    const logData = {
      timestamp: new Date().toISOString(),
      method: req.method,
      path: req.path,
      statusCode: res.statusCode,
      duration: `${duration}ms`,
      userId: req.user?.id || 'anonymous'
    };

    if (res.statusCode >= 400) {
      console.error('Queue operation error:', logData);
    } else {
      console.log('Queue operation:', logData);
    }
  });

  next();
};

module.exports = {
  verifyToken,
  validateQueueInput,
  validateBounceWebhook,
  queueRateLimiter,
  logQueueOperation
};

