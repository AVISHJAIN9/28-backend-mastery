/**
 * Middleware for Generics & API Response Patterns
 * Validation and generic response formatting
 */

const logger = require('winston');

/**
 * Validate user creation request
 * Returns: Result<User> | void (passes to next if valid)
 */
const validateUserCreation = (req, res, next) => {
  try {
    const { name, email, role } = req.body;

    const errors = [];

    if (!name || typeof name !== 'string' || name.trim().length === 0) {
      errors.push('name is required and must be a non-empty string');
    }

    if (!email || !email.includes('@')) {
      errors.push('email is required and must be valid');
    }

    if (role && !['admin', 'user', 'moderator'].includes(role)) {
      errors.push('role must be admin, user, or moderator');
    }

    if (errors.length > 0) {
      return res.status(400).json({
        ok: false,
        error: {
          message: 'Validation failed',
          code: 'VALIDATION_ERROR',
          details: errors
        },
        timestamp: Date.now()
      });
    }

    next();
  } catch (error) {
    return res.status(400).json({
      ok: false,
      error: { message: error.message, code: 'VALIDATION_ERROR' },
      timestamp: Date.now()
    });
  }
};

/**
 * Validate pagination parameters
 * Returns: Result<void>
 */
const validatePageParams = (req, res, next) => {
  try {
    const page = parseInt(req.query.page);
    const pageSize = parseInt(req.query.pageSize);

    if (page && (page < 1 || !Number.isInteger(page))) {
      return res.status(400).json({
        ok: false,
        error: {
          message: 'page must be a positive integer',
          code: 'INVALID_PAGE'
        },
        timestamp: Date.now()
      });
    }

    if (pageSize && (pageSize < 1 || pageSize > 100 || !Number.isInteger(pageSize))) {
      return res.status(400).json({
        ok: false,
        error: {
          message: 'pageSize must be between 1 and 100',
          code: 'INVALID_PAGE_SIZE'
        },
        timestamp: Date.now()
      });
    }

    next();
  } catch (error) {
    return res.status(400).json({
      ok: false,
      error: { message: error.message, code: 'VALIDATION_ERROR' },
      timestamp: Date.now()
    });
  }
};

/**
 * Validate user ID
 * Returns: Result<void>
 */
const validateUserId = (req, res, next) => {
  try {
    const id = parseInt(req.params.id);

    if (!Number.isInteger(id) || id < 1) {
      return res.status(400).json({
        ok: false,
        error: { message: 'Invalid user ID', code: 'INVALID_ID' },
        timestamp: Date.now()
      });
    }

    next();
  } catch (error) {
    return res.status(400).json({
      ok: false,
      error: { message: error.message, code: 'VALIDATION_ERROR' },
      timestamp: Date.now()
    });
  }
};

/**
 * Request logger
 * Logs metadata about incoming request
 */
const requestLogger = (req, res, next) => {
  req.startTime = Date.now();

  console.log('[REQUEST]', {
    method: req.method,
    path: req.path,
    query: req.query,
    timestamp: new Date().toISOString()
  });

  // Log response
  const originalJson = res.json;
  res.json = function(data) {
    const duration = Date.now() - req.startTime;
    console.log('[RESPONSE]', {
      method: req.method,
      path: req.path,
      status: res.statusCode,
      duration: `${duration}ms`,
      timestamp: new Date().toISOString()
    });

    return originalJson.call(this, data);
  };

  next();
};

/**
 * Error handler
 * Returns: Result<void> error response
 * Should be registered last
 */
const errorHandler = (err, req, res, next) => {
  console.error('[ERROR]', {
    message: err.message,
    stack: process.env.NODE_ENV === 'development' ? err.stack : undefined,
    timestamp: new Date().toISOString()
  });

  const statusCode = err.statusCode || 500;
  const errorResponse = {
    ok: false,
    error: {
      message: process.env.NODE_ENV === 'production' ? 'Internal server error' : err.message,
      code: err.code || 'INTERNAL_ERROR'
    },
    timestamp: Date.now()
  };

  res.status(statusCode).json(errorResponse);
};

/**
 * 404 Not Found handler
 * Returns: Result<void> not found response
 */
const notFoundHandler = (req, res) => {
  res.status(404).json({
    ok: false,
    error: {
      message: `Route ${req.method} ${req.path} not found`,
      code: 'NOT_FOUND'
    },
    timestamp: Date.now()
  });
};

/**
 * Generic response formatter middleware
 * Ensures all responses follow Result<T> pattern
 */
const responseFormatter = (req, res, next) => {
  // Store original json method
  const originalJson = res.json;

  res.json = function(data) {
    // Ensure response has ok property
    if (!data.ok && data.ok !== false) {
      data.ok = res.statusCode >= 400 ? false : true;
    }

    // Ensure timestamp exists
    if (!data.timestamp) {
      data.timestamp = Date.now();
    }

    return originalJson.call(this, data);
  };

  next();
};

/**
 * Conditional error middleware
 * Demonstrates generic error handling
 */
const conditionalErrorHandler = (condition, errorCode, errorMessage) => {
  return (req, res, next) => {
    if (condition(req)) {
      return res.status(400).json({
        ok: false,
        error: {
          message: errorMessage,
          code: errorCode
        },
        timestamp: Date.now()
      });
    }
    next();
  };
};

/**
 * Type-safe error creator
 * Generic function that creates properly typed error responses
 */
const createErrorResult = (message, code = 'ERROR', statusCode = 400) => {
  return {
    statusCode,
    result: {
      ok: false,
      error: { message, code },
      timestamp: Date.now()
    }
  };
};

/**
 * Type-safe success creator
 * Generic function that creates properly typed success responses
 */
const createSuccessResult = (data, statusCode = 200) => {
  return {
    statusCode,
    result: {
      ok: true,
      data,
      timestamp: Date.now()
    }
  };
};

module.exports = {
  validateUserCreation,
  validatePageParams,
  validateUserId,
  requestLogger,
  errorHandler,
  notFoundHandler,
  responseFormatter,
  conditionalErrorHandler,
  createErrorResult,
  createSuccessResult
};

