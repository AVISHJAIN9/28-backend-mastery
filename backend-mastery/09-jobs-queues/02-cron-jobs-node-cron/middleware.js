/**
 * Cron Jobs Middleware
 * Request logging and error handling
 */

const logger = require('./schema');

/**
 * Log all incoming requests
 */
const logRequest = (req, res, next) => {
  console.log(`[${new Date().toISOString()}] ${req.method} ${req.path}`);
  next();
};

/**
 * Global error handler
 */
const errorHandler = (err, req, res, next) => {
  console.error('Error:', err);
  res.status(err.status || 500).json({
    error: err.message || 'Internal server error'
  });
};

module.exports = {
  logRequest,
  errorHandler
};

