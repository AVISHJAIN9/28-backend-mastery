const logger = require('./logger');

// Request logging middleware
const logRequest = (req, res, next) => {
  const start = Date.now();
  res.on('finish', () => {
    const duration = Date.now() - start;
    logger.info(`${req.method} ${req.path}`, {
      status: res.statusCode,
      duration: `${duration}ms`
    });
  });
  next();
};

// Error handling middleware
const errorHandler = (err, req, res, next) => {
  logger.error('Request error', {
    error: err.message,
    path: req.path
  });
  res.status(err.status || 500).json({
    error: err.message || 'Internal server error'
  });
};

// Validation error handler
const validationError = (err, req, res, next) => {
  if (err.isJoi) {
    return res.status(400).json({
      error: err.details?.[0]?.message || 'Validation failed'
    });
  }
  next(err);
};

module.exports = {
  logRequest,
  errorHandler,
  validationError
};

