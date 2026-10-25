// Custom Error Class
class AppError extends Error {
  constructor(message, statusCode, errorType = 'GeneralError') {
    super(message);
    this.statusCode = statusCode;
    this.errorType = errorType;
    this.timestamp = new Date().toISOString();
  }
}

// Validation Error Class
class ValidationError extends AppError {
  constructor(message, details = []) {
    super(message, 400, 'ValidationError');
    this.details = details;
  }
}

// Authentication Error Class
class AuthenticationError extends AppError {
  constructor(message = 'Authentication failed') {
    super(message, 401, 'AuthenticationError');
  }
}

// Authorization Error Class
class AuthorizationError extends AppError {
  constructor(message = 'Insufficient permissions') {
    super(message, 403, 'AuthorizationError');
  }
}

// Not Found Error Class
class NotFoundError extends AppError {
  constructor(resource = 'Resource') {
    super(`${resource} not found`, 404, 'NotFoundError');
  }
}

// Server Error Class
class ServerError extends AppError {
  constructor(message = 'Internal server error', originalError = null) {
    super(message, 500, 'ServerError');
    this.originalError = originalError;
  }
}

// Global Error Handler Middleware
const errorHandlerMiddleware = (err, req, res, next) => {
  let error = {
    success: false,
    message: err.message || 'An unexpected error occurred',
    statusCode: err.statusCode || 500,
    errorType: err.errorType || 'UnknownError',
    timestamp: err.timestamp || new Date().toISOString()
  };

  if (err.details) {
    error.details = err.details;
  }

  console.error(`[${error.errorType}] ${error.message}`, {
    statusCode: error.statusCode,
    originalError: err.originalError?.message,
    url: req.originalUrl,
    method: req.method,
    ip: req.ip
  });

  res.status(error.statusCode).json(error);
};

// Async Error Wrapper
const asyncHandler = (fn) => {
  return (req, res, next) => {
    Promise.resolve(fn(req, res, next)).catch(next);
  };
};

module.exports = {
  AppError,
  ValidationError,
  AuthenticationError,
  AuthorizationError,
  NotFoundError,
  ServerError,
  errorHandlerMiddleware,
  asyncHandler
};
