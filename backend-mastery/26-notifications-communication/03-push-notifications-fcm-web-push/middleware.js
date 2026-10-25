/**
 * Push Notifications Middleware
 * Handles JWT verification, device token validation, platform validation, and rate limiting
 */

const jwt = require('jsonwebtoken');

const JWT_SECRET = process.env.JWT_SECRET || 'test-secret-key';

// ==================== JWT Authentication ====================

const verifyToken = (req, res, next) => {
  const token = req.headers.authorization?.split(' ')[1];
  if (!token) {
    return res.status(401).json({ error: 'No authentication token provided' });
  }

  try {
    const decoded = jwt.verify(token, JWT_SECRET);
    req.user = decoded;
    next();
  } catch (error) {
    return res.status(401).json({ error: 'Invalid or expired token' });
  }
};

// ==================== Device Token Validation ====================

const validateDeviceToken = (req, res, next) => {
  const { token, platform, subscriptionEndpoint, subscriptionAuth } = req.body;

  const validPlatforms = ['android', 'ios', 'web', 'macos', 'windows'];
  if (!validPlatforms.includes(platform)) {
    return res.status(400).json({ error: 'Invalid platform' });
  }

  if (!token && !subscriptionEndpoint) {
    return res.status(400).json({ error: 'Token or subscriptionEndpoint required' });
  }

  if ((platform === 'web' || platform === 'macos' || platform === 'windows') && subscriptionEndpoint) {
    if (!subscriptionAuth || !subscriptionAuth.auth || !subscriptionAuth.p256dh) {
      return res.status(400).json({ error: 'Invalid subscription auth format' });
    }
  }

  next();
};

// ==================== Notification Validation ====================

const validateNotificationPayload = (req, res, next) => {
  const { title, body } = req.body;

  if (!title || title.length === 0) {
    return res.status(400).json({ error: 'Title is required' });
  }
  if (title.length > 200) {
    return res.status(400).json({ error: 'Title exceeds 200 characters' });
  }

  if (!body || body.length === 0) {
    return res.status(400).json({ error: 'Body is required' });
  }
  if (body.length > 4000) {
    return res.status(400).json({ error: 'Body exceeds 4000 characters' });
  }

  const totalSize = JSON.stringify(req.body).length;
  if (totalSize > 4096) {
    return res.status(413).json({ error: 'Payload exceeds 4KB limit' });
  }

  next();
};

// ==================== Batch Notification Validation ====================

const validateBatchNotification = (req, res, next) => {
  const { deviceIds, title, body } = req.body;

  if (!Array.isArray(deviceIds) || deviceIds.length === 0) {
    return res.status(400).json({ error: 'deviceIds must be a non-empty array' });
  }

  if (deviceIds.length > 1000) {
    return res.status(400).json({ error: 'Cannot send to more than 1000 devices per request' });
  }

  if (!title || !body) {
    return res.status(400).json({ error: 'Title and body are required' });
  }

  next();
};

// ==================== Rate Limiting ====================

const createRateLimiter = (limit, windowMs) => {
  const limits = {};
  
  return (req, res, next) => {
    const key = req.user?.id || req.ip;
    const now = Date.now();
    
    if (!limits[key]) {
      limits[key] = { count: 0, resetTime: now + windowMs };
    }
    
    if (now > limits[key].resetTime) {
      limits[key] = { count: 0, resetTime: now + windowMs };
    }
    
    limits[key].count++;
    
    if (limits[key].count > limit) {
      return res.status(429).json({
        error: 'Rate limit exceeded',
        retryAfter: Math.ceil((limits[key].resetTime - now) / 1000)
      });
    }
    
    next();
  };
};

const rateLimiterSingle = createRateLimiter(100, 15 * 60 * 1000); // 100 per 15 min
const rateLimiterBatch = createRateLimiter(10, 60 * 60 * 1000);   // 10 per hour
const rateLimiterRegister = createRateLimiter(50, 60 * 60 * 1000); // 50 per hour

// ==================== Error Handling ====================

const asyncHandler = (fn) => (req, res, next) => {
  Promise.resolve(fn(req, res, next)).catch(next);
};

// ==================== Logging ====================

const logOperation = (req, res, next) => {
  const startTime = Date.now();
  
  res.on('finish', () => {
    const duration = Date.now() - startTime;
    console.log(`[${req.method}] ${req.path} - ${res.statusCode} (${duration}ms) - User: ${req.user?.id || 'anonymous'}`);
  });
  
  next();
};

module.exports = {
  verifyToken,
  validateDeviceToken,
  validateNotificationPayload,
  validateBatchNotification,
  rateLimiterSingle,
  rateLimiterBatch,
  rateLimiterRegister,
  asyncHandler,
  logOperation
};
 
      error: 'Invalid or expired token',
      code: 'INVALID_TOKEN'
    });
  }
};

/**
 * Device Token Validation Middleware
 * Validates that FCM or Web Push tokens are properly formatted
 * FCM: 152+ character alphanumeric string
 * Web Push: Base64 encoded subscription object required
 */
const validateDeviceToken = (req, res, next) => {
  const { platform, token, endpoint, p256dh, auth } = req.body;

  // Validate platform
  if (!platform || !['fcm', 'web-push'].includes(platform)) {
    return res.status(400).json({
      error: 'Invalid platform. Must be "fcm" or "web-push"',
      code: 'INVALID_PLATFORM'
    });
  }

  // FCM token validation
  if (platform === 'fcm') {
    if (!token || typeof token !== 'string' || token.length < 100) {
      logger.warn('Invalid FCM token format', { 
        userId: req.user?.id,
        tokenLength: token?.length 
      });
      return res.status(400).json({
        error: 'Invalid FCM token. Must be a string of at least 100 characters',
        code: 'INVALID_FCM_TOKEN'
      });
    }
  }

  // Web Push validation
  if (platform === 'web-push') {
    if (!endpoint || typeof endpoint !== 'string') {
      return res.status(400).json({
        error: 'Web Push requires valid endpoint URL',
        code: 'INVALID_ENDPOINT'
      });
    }

    // Validate subscription keys
    if (!p256dh || !auth) {
      return res.status(400).json({
        error: 'Web Push requires p256dh and auth keys from subscription',
        code: 'MISSING_SUBSCRIPTION_KEYS'
      });
    }

    // Validate base64 format of keys
    const isValidBase64 = (str) => {
      try {
        return Buffer.from(str, 'base64').toString('base64') === str;
      } catch (e) {
        return false;
      }
    };

    if (!isValidBase64(p256dh) || !isValidBase64(auth)) {
      return res.status(400).json({
        error: 'Invalid subscription keys format. Must be base64 encoded',
        code: 'INVALID_KEY_FORMAT'
      });
    }
  }

  next();
};

/**
 * Platform Validation Middleware
 * Ensures platform-specific fields are present in the request
 */
const validatePlatform = (req, res, next) => {
  const { platform } = req.body;

  if (!platform) {
    return res.status(400).json({
      error: 'Platform is required',
      code: 'MISSING_PLATFORM'
    });
  }

  if (!['fcm', 'web-push'].includes(platform)) {
    return res.status(400).json({
      error: 'Invalid platform. Supported: fcm, web-push',
      code: 'UNSUPPORTED_PLATFORM'
    });
  }

  next();
};

/**
 * Notification Payload Validation Middleware
 * Validates notification title, body, and optional data
 */
const validateNotificationPayload = (req, res, next) => {
  const { title, body, data, actions } = req.body;

  // Validate required fields
  if (!title || typeof title !== 'string' || title.length === 0) {
    return res.status(400).json({
      error: 'Title is required and must be a non-empty string',
      code: 'INVALID_TITLE'
    });
  }

  if (!body || typeof body !== 'string' || body.length === 0) {
    return res.status(400).json({
      error: 'Body is required and must be a non-empty string',
      code: 'INVALID_BODY'
    });
  }

  // Validate title and body length (FCM limits)
  if (title.length > 200) {
    return res.status(400).json({
      error: 'Title must be 200 characters or less',
      code: 'TITLE_TOO_LONG'
    });
  }

  if (body.length > 4000) {
    return res.status(400).json({
      error: 'Body must be 4000 characters or less',
      code: 'BODY_TOO_LONG'
    });
  }

  // Validate optional data object
  if (data && typeof data !== 'object') {
    return res.status(400).json({
      error: 'Data must be an object',
      code: 'INVALID_DATA'
    });
  }

  // Validate optional actions array
  if (actions && typeof actions !== 'string') {
    return res.status(400).json({
      error: 'Actions must be a string (JSON serialized)',
      code: 'INVALID_ACTIONS'
    });
  }

  next();
};

/**
 * Rate Limiting Middleware
 * Prevents abuse of notification endpoints
 */
const notificationRateLimiter = rateLimit({
  windowMs: 15 * 60 * 1000, // 15 minutes
  max: 100, // 100 requests per 15 minutes
  message: 'Too many notification requests, try again later',
  standardHeaders: true,
  legacyHeaders: false,
  skip: (req) => {
    // Skip rate limiting for admin users (if role exists)
    return req.user?.role === 'admin';
  }
});

/**
 * Strict rate limiting for batch notifications
 * More restrictive than single notifications
 */
const batchNotificationRateLimiter = rateLimit({
  windowMs: 60 * 60 * 1000, // 1 hour
  max: 10, // 10 batch requests per hour
  message: 'Too many batch notification requests, try again later',
  standardHeaders: true,
  legacyHeaders: false
});

/**
 * Device Registration Rate Limiter
 * Prevents token flooding
 */
const deviceRegistrationLimiter = rateLimit({
  windowMs: 60 * 60 * 1000, // 1 hour
  max: 50, // 50 registrations per hour per user
  message: 'Too many device registrations, try again later',
  standardHeaders: true,
  legacyHeaders: false
});

/**
 * Error Handling Middleware
 * Catches async errors and formats responses
 */
const asyncHandler = (fn) => (req, res, next) => {
  Promise.resolve(fn(req, res, next)).catch((error) => {
    logger.error('Unhandled error', {
      error: error.message,
      stack: error.stack,
      userId: req.user?.id,
      path: req.path
    });

    res.status(500).json({
      error: 'Internal server error',
      code: 'INTERNAL_ERROR'
    });
  });
};

/**
 * Request Logging Middleware
 * Logs all requests with user context
 */
const requestLogger = (req, res, next) => {
  res.on('finish', () => {
    logger.info('Request completed', {
      method: req.method,
      path: req.path,
      statusCode: res.statusCode,
      userId: req.user?.id,
      ip: req.ip
    });
  });
  next();
};

module.exports = {
  verifyToken,
  validateDeviceToken,
  validatePlatform,
  validateNotificationPayload,
  notificationRateLimiter,
  batchNotificationRateLimiter,
  deviceRegistrationLimiter,
  asyncHandler,
  requestLogger,
  logger
};
