/**
 * Middleware for Unit Testing Module
 * Middleware that itself should be tested
 */

const { validateTestCase, validateCalculate } = require('./schema');

// ==================== Error Handling ====================

const errorHandler = (err, req, res, next) => {
  const status = err.status || 500;
  const message = err.message || 'Internal Server Error';
  
  console.error(`[Error] ${message}`, err);
  
  res.status(status).json({
    error: message,
    status: status,
    timestamp: new Date().toISOString()
  });
};

// ==================== Request Validation ====================

const validateRequest = (schema) => {
  return (req, res, next) => {
    const { error, value } = schema.validate(req.body);
    
    if (error) {
      return res.status(400).json({
        error: 'Validation failed',
        details: error.details.map(d => ({
          field: d.path.join('.'),
          message: d.message
        }))
      });
    }
    
    req.validatedData = value;
    next();
  };
};

// ==================== Logging ====================

const requestLogger = (req, res, next) => {
  const start = Date.now();
  
  res.on('finish', () => {
    const duration = Date.now() - start;
    console.log(`[${new Date().toISOString()}] ${req.method} ${req.path} - ${res.statusCode} (${duration}ms)`);
  });
  
  next();
};

// ==================== Test Utilities ====================

// Middleware that calculates test statistics
const testStatisticsMiddleware = (req, res, next) => {
  req.testStats = {
    total: 0,
    passed: 0,
    failed: 0,
    skipped: 0
  };
  next();
};

// Middleware to track test execution time
const testTimingMiddleware = (req, res, next) => {
  req.executionTimes = [];
  
  req.recordTiming = (name, time) => {
    req.executionTimes.push({ name, time });
  };
  
  next();
};

// ==================== Rate Limiting for Tests ====================

const testRateLimit = (() => {
  const requestCounts = new Map();
  const LIMIT = 100;
  const WINDOW = 60000; // 1 minute
  
  return (req, res, next) => {
    const key = req.ip;
    const now = Date.now();
    
    if (!requestCounts.has(key)) {
      requestCounts.set(key, []);
    }
    
    const times = requestCounts.get(key);
    const recentRequests = times.filter(t => now - t < WINDOW);
    
    if (recentRequests.length >= LIMIT) {
      return res.status(429).json({
        error: 'Too many test requests',
        retryAfter: Math.ceil((recentRequests[0] + WINDOW - now) / 1000)
      });
    }
    
    recentRequests.push(now);
    requestCounts.set(key, recentRequests);
    next();
  };
})();

// ==================== Response Formatting ====================

const formatSuccessResponse = (data, message = 'Success') => {
  return {
    status: 'success',
    message,
    data,
    timestamp: new Date().toISOString()
  };
};

const formatErrorResponse = (error, statusCode = 500) => {
  return {
    status: 'error',
    error: error instanceof Error ? error.message : error,
    statusCode,
    timestamp: new Date().toISOString()
  };
};

// Response wrapper middleware
const responseWrapper = (req, res, next) => {
  req.sendSuccess = (data, message, statusCode = 200) => {
    res.status(statusCode).json(formatSuccessResponse(data, message));
  };
  
  req.sendError = (error, statusCode = 500) => {
    res.status(statusCode).json(formatErrorResponse(error, statusCode));
  };
  
  next();
};

module.exports = {
  errorHandler,
  validateRequest,
  requestLogger,
  testStatisticsMiddleware,
  testTimingMiddleware,
  testRateLimit,
  formatSuccessResponse,
  formatErrorResponse,
  responseWrapper
};

