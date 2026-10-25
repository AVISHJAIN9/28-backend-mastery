const logger = require('./logger');

// ==================== CONTENT TYPE VALIDATION ====================

/**
 * Middleware to validate content-type for multipart uploads
 */
const validateContentType = (req, res, next) => {
  const contentType = req.get('content-type');
  const contentLength = req.get('content-length');

  if (!contentType || !contentLength) {
    logger.warn('Missing content-type or content-length header', {
      endpoint: req.path,
      method: req.method,
      ip: req.ip
    });
    return res.status(400).json({
      error: 'Missing content-type or content-length header',
      required: ['content-type', 'content-length']
    });
  }

  // Validate content-length is a valid number
  const parsedLength = parseInt(contentLength);
  if (isNaN(parsedLength) || parsedLength <= 0) {
    return res.status(400).json({
      error: 'Invalid content-length header'
    });
  }

  // Check max chunk size
  const maxChunkSize = parseInt(process.env.CHUNK_SIZE_BYTES || 5242880);
  if (parsedLength > maxChunkSize) {
    logger.warn('Chunk exceeds max size', {
      contentLength: parsedLength,
      maxChunkSize
    });
    return res.status(413).json({
      error: `Chunk size exceeds maximum of ${maxChunkSize} bytes`,
      received: parsedLength,
      max: maxChunkSize
    });
  }

  req.contentLength = parsedLength;
  next();
};

// ==================== ERROR HANDLING ====================

/**
 * Middleware to handle multipart upload errors
 */
const handleUploadErrors = (err, req, res, next) => {
  logger.error('Upload error', {
    error: err.message,
    code: err.code,
    statusCode: err.statusCode,
    endpoint: req.path,
    method: req.method,
    uploadId: req.body?.uploadId || req.query?.uploadId,
    ip: req.ip
  });

  // AWS S3 specific errors
  if (err.code === 'NoSuchUpload') {
    return res.status(404).json({
      error: 'Upload ID not found',
      code: 'NoSuchUpload'
    });
  }

  if (err.code === 'InvalidPart') {
    return res.status(400).json({
      error: 'Invalid part number or ETag',
      code: 'InvalidPart'
    });
  }

  if (err.code === 'EntityTooSmall') {
    return res.status(400).json({
      error: 'Part too small (minimum 5MB except last part)',
      code: 'EntityTooSmall'
    });
  }

  if (err.code === 'NoSuchKey') {
    return res.status(404).json({
      error: 'File not found',
      code: 'NoSuchKey'
    });
  }

  // Network/Connection errors
  if (err.code === 'ECONNREFUSED' || err.code === 'ETIMEDOUT') {
    return res.status(503).json({
      error: 'Service temporarily unavailable',
      code: err.code
    });
  }

  // Generic server error
  return res.status(err.statusCode || 500).json({
    error: 'Upload failed',
    message: process.env.NODE_ENV === 'development' ? err.message : 'Internal server error',
    requestId: req.id
  });
};

/**
 * Middleware to wrap async route handlers
 */
const asyncHandler = (fn) => (req, res, next) => {
  Promise.resolve(fn(req, res, next)).catch((err) => {
    logger.error('Unhandled promise rejection', {
      error: err.message,
      stack: err.stack,
      endpoint: req.path,
      requestId: req.id
    });
    next(err);
  });
};

// ==================== REQUEST LOGGING ====================

/**
 * Middleware to log requests
 */
const requestLogger = (req, res, next) => {
  const start = Date.now();

  // Assign request ID for tracking
  req.id = `${Date.now()}-${Math.random().toString(36).substr(2, 9)}`;

  // Log incoming request
  logger.debug('Incoming request', {
    requestId: req.id,
    method: req.method,
    path: req.path,
    ip: req.ip,
    contentLength: req.get('content-length')
  });

  // Intercept response to log completion
  const originalSend = res.send;
  res.send = function (data) {
    const duration = Date.now() - start;

    logger.debug('Request completed', {
      requestId: req.id,
      method: req.method,
      path: req.path,
      statusCode: res.statusCode,
      duration: `${duration}ms`,
      ip: req.ip
    });

    return originalSend.call(this, data);
  };

  next();
};

// ==================== VALIDATION ERROR HANDLER ====================

/**
 * Middleware to handle validation errors
 */
const validationErrorHandler = (err, req, res, next) => {
  if (err.isJoi) {
    const details = err.details.map((detail) => ({
      field: detail.path.join('.'),
      message: detail.message,
      type: detail.type
    }));

    logger.warn('Validation error', {
      endpoint: req.path,
      errors: details,
      ip: req.ip
    });

    return res.status(400).json({
      error: 'Validation failed',
      details
    });
  }

  next(err);
};

// ==================== TIMEOUT HANDLING ====================

/**
 * Middleware to handle request timeouts
 */
const timeoutHandler = (req, res, next) => {
  const timeout = parseInt(process.env.REQUEST_TIMEOUT_MS || 300000);
  
  const timeoutId = setTimeout(() => {
    logger.warn('Request timeout', {
      endpoint: req.path,
      method: req.method,
      timeout: `${timeout}ms`,
      ip: req.ip,
      uploadId: req.body?.uploadId || req.query?.uploadId
    });

    if (!res.headersSent) {
      res.status(408).json({
        error: 'Request timeout',
        timeout: `${timeout}ms`
      });
    }
  }, timeout);

  // Clear timeout if response is sent
  res.on('finish', () => {
    clearTimeout(timeoutId);
  });

  next();
};

// ==================== RATE LIMITING ====================

/**
 * Simple in-memory rate limiter for upload initiation
 */
const uploadInitiationLimiter = (() => {
  const ipMap = new Map();
  const windowMs = 60 * 1000; // 1 minute
  const maxRequests = 10; // Max 10 initiations per minute

  return (req, res, next) => {
    const ip = req.ip;
    const now = Date.now();
    
    if (!ipMap.has(ip)) {
      ipMap.set(ip, { count: 1, resetTime: now + windowMs });
      return next();
    }

    const record = ipMap.get(ip);
    
    if (now > record.resetTime) {
      record.count = 1;
      record.resetTime = now + windowMs;
      return next();
    }

    if (record.count >= maxRequests) {
      logger.warn('Rate limit exceeded', {
        ip,
        endpoint: '/initiate',
        requests: record.count,
        maxRequests
      });
      return res.status(429).json({
        error: 'Too many upload initiations',
        retryAfter: Math.ceil((record.resetTime - now) / 1000)
      });
    }

    record.count++;
    next();
  };
})();

// ==================== 404 HANDLER ====================

/**
 * Middleware to handle 404 routes
 */
const notFoundHandler = (req, res) => {
  logger.warn('Route not found', {
    path: req.path,
    method: req.method,
    ip: req.ip
  });

  res.status(404).json({
    error: 'Route not found',
    path: req.path,
    method: req.method
  });
};

// ==================== GLOBAL ERROR HANDLER ====================

/**
 * Global error handler middleware
 */
const globalErrorHandler = (err, req, res, next) => {
  if (res.headersSent) {
    return next(err);
  }

  logger.error('Global error handler', {
    error: err.message,
    stack: err.stack,
    statusCode: err.statusCode || 500,
    endpoint: req.path,
    method: req.method,
    requestId: req.id,
    ip: req.ip
  });

  res.status(err.statusCode || 500).json({
    error: process.env.NODE_ENV === 'production' 
      ? 'Internal server error' 
      : err.message,
    requestId: req.id
  });
};

// ==================== EXPORTS ====================

module.exports = {
  validateContentType,
  handleUploadErrors,
  asyncHandler,
  requestLogger,
  validationErrorHandler,
  timeoutHandler,
  uploadInitiationLimiter,
  notFoundHandler,
  globalErrorHandler
};

