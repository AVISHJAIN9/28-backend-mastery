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

// ==================== Adapter Injection Middleware ====================

const injectAdapter = (req, res, next) => {
  req.adapter = {
    type: 'REST',
    version: '1.0',
    timestamp: new Date()
  };
  next();
};

// ==================== Error Handler ====================

const errorHandler = (err, req, res, next) => {
  console.error('[Hexagonal Error]:', err);
  res.status(err.status || 500).json({
    success: false,
    error: err.message || 'Internal server error'
  });
};

// ==================== Exports ====================

module.exports = {
  validateUserInput,
  validateUserId,
  injectAdapter,
  errorHandler
};

