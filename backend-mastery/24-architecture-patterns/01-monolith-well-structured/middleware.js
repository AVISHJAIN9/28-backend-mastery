const { validateUserSchema } = require('./schema');

// ==================== Custom Middleware ====================

/**
 * Validation middleware for user input
 */
const validateUserInput = (req, res, next) => {
  const { error, value } = validateUserSchema(req.body);
  
  if (error) {
    return res.status(400).json({
      success: false,
      error: 'Validation failed',
      details: error.details.map(d => ({
        field: d.path.join('.'),
        message: d.message
      }))
    });
  }

  // Replace req.body with validated value
  req.body = value;
  next();
};

/**
 * Validate user ID parameter
 */
const validateUserId = (req, res, next) => {
  const id = req.params.id;
  
  if (!id || isNaN(id)) {
    return res.status(400).json({
      success: false,
      error: 'Invalid user ID',
      details: 'User ID must be a valid number'
    });
  }
  
  next();
};

/**
 * Request logging middleware
 */
const requestLogger = (req, res, next) => {
  const start = Date.now();
  
  res.on('finish', () => {
    const duration = Date.now() - start;
    console.log(`${req.method} ${req.path} - ${res.statusCode} - ${duration}ms`);
  });
  
  next();
};

/**
 * Error handling middleware
 */
const errorHandler = (err, req, res, next) => {
  console.error('Error:', err);
  
  res.status(err.status || 500).json({
    success: false,
    error: err.message || 'Internal server error',
    ...(process.env.NODE_ENV === 'development' && { stack: err.stack })
  });
};

// ==================== Exports ====================

module.exports = {
  validateUserInput,
  validateUserId,
  requestLogger,
  errorHandler
};
