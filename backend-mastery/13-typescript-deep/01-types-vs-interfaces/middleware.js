/**
 * TypeScript Types vs Interfaces Middleware
 * Demonstrates practical use of types and interfaces
 */

/**
 * Validate user creation payload
 * Demonstrates Type usage for request validation
 */
const validateUserCreation = (req, res, next) => {
  const { name, email, role } = req.body;

  if (!name || typeof name !== 'string') {
    return res.status(400).json({
      success: false,
      error: { message: 'name must be a string', code: 'VALIDATION_ERROR' }
    });
  }

  if (!email || typeof email !== 'string' || !email.includes('@')) {
    return res.status(400).json({
      success: false,
      error: { message: 'email must be a valid email', code: 'VALIDATION_ERROR' }
    });
  }

  if (!role || !['admin', 'user', 'moderator'].includes(role)) {
    return res.status(400).json({
      success: false,
      error: { message: 'role must be admin, user, or moderator', code: 'VALIDATION_ERROR' }
    });
  }

  next();
};

/**
 * Validate user ID parameter
 */
const validateUserId = (req, res, next) => {
  const { id } = req.params;
  const userId = parseInt(id);

  if (isNaN(userId) || userId < 1) {
    return res.status(400).json({
      success: false,
      error: { message: 'Invalid user ID', code: 'INVALID_ID' }
    });
  }

  req.userId = userId;
  next();
};

/**
 * Validate role parameter
 */
const validateRole = (req, res, next) => {
  const { role } = req.params;
  const validRoles = ['admin', 'user', 'moderator'];

  if (!validRoles.includes(role)) {
    return res.status(400).json({
      success: false,
      error: {
        message: `role must be one of: ${validRoles.join(', ')}`,
        code: 'INVALID_ROLE'
      }
    });
  }

  next();
};

/**
 * Request logging middleware
 * Demonstrates Interface usage for logger context
 */
const requestLogger = (req, res, next) => {
  const startTime = Date.now();
  const requestInfo = {
    method: req.method,
    path: req.path,
    timestamp: new Date().toISOString(),
    ip: req.ip,
    contentLength: req.get('content-length') || 0
  };

  res.on('finish', () => {
    const duration = Date.now() - startTime;
    console.log({
      ...requestInfo,
      status: res.statusCode,
      duration: `${duration}ms`
    });
  });

  next();
};

/**
 * Error handling middleware
 * Demonstrates standardized error response Type
 */
const errorHandler = (err, req, res, next) => {
  const errorResponse = {
    success: false,
    error: {
      message: err.message || 'Internal server error',
      code: err.code || 'INTERNAL_ERROR',
      timestamp: new Date().toISOString()
    }
  };

  const statusCode = err.statusCode || 500;
  res.status(statusCode).json(errorResponse);
};

/**
 * Not found handler
 */
const notFoundHandler = (req, res) => {
  res.status(404).json({
    success: false,
    error: {
      message: `Route ${req.path} not found`,
      code: 'NOT_FOUND'
    }
  });
};

/**
 * Response formatter
 * Standardizes all API responses using Type pattern
 */
const responseFormatter = (req, res, next) => {
  const originalJson = res.json;

  res.json = function(data) {
    if (!data.success !== undefined) {
      data = {
        success: res.statusCode >= 400 ? false : true,
        data,
        timestamp: Date.now()
      };
    }
    return originalJson.call(this, data);
  };

  next();
};

module.exports = {
  validateUserCreation,
  validateUserId,
  validateRole,
  requestLogger,
  errorHandler,
  notFoundHandler,
  responseFormatter
};

