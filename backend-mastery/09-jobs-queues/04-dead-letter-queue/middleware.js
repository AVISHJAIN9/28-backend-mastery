const logger = require('./logger');

// Request logging middleware
const logRequest = (req, res, next) => {
  const start = Date.now();
  res.on('finish', () => {
    const duration = Date.now() - start;
    logger.info(`${req.method} ${req.path}`, {
      status: res.statusCode,
      duration: `${duration}ms`,
      ip: req.ip
    });
  });
  next();
};

// Error handling middleware
const errorHandler = (err, req, res, next) => {
  logger.error('Request error', {
    error: err.message,
    stack: err.stack,
    path: req.path,
    method: req.method
  });
  res.status(err.status || 500).json({
    error: err.message || 'Internal server error',
    status: err.status || 500
  });
};

// Validation error handler
const validationError = (err, req, res, next) => {
  if (err.isJoi) {
    logger.warn('Validation error', {
      field: err.details?.[0]?.path?.join('.'),
      message: err.details?.[0]?.message
    });
    return res.status(400).json({
      error: err.details?.[0]?.message || 'Validation failed',
      field: err.details?.[0]?.path?.join('.')
    });
  }
  next(err);
};

module.exports = {
  logRequest,
  errorHandler,
  validationError
};

