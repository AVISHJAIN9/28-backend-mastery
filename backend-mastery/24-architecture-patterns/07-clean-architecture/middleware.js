const { validateUserSchema } = require('./schema');

// ==================== Validation Middleware ====================

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

  req.body = value;
  next();
};

const validateUserId = (req, res, next) => {
  const id = req.params.id;
  if (!id || isNaN(id)) {
    return res.status(400).json({
      success: false,
      error: 'Invalid user ID'
    });
  }
  next();
};

// ==================== Use Case Tracking ====================

const trackUseCase = (req, res, next) => {
  res.on('finish', () => {
    console.log(`[Clean Arch] ${req.method} ${req.path} - Status: ${res.statusCode}`);
  });
  next();
};

// ==================== Error Handler ====================

const errorHandler = (err, req, res, next) => {
  console.error('[Clean Architecture Error]:', err.message);
  res.status(500).json({
    success: false,
    error: err.message || 'Use case execution failed'
  });
};

// ==================== Exports ====================

module.exports = {
  validateUserInput,
  validateUserId,
  trackUseCase,
  errorHandler
};

