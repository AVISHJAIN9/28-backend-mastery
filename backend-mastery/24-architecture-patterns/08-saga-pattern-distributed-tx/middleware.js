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

// ==================== Saga Tracking ====================

const sagaTracker = (req, res, next) => {
  req.sagaId = Math.random().toString(36).substr(2, 9);
  console.log(`[Saga] ${req.sagaId} started for ${req.method} ${req.path}`);
  
  res.on('finish', () => {
    console.log(`[Saga] ${req.sagaId} completed with status ${res.statusCode}`);
  });
  
  next();
};

// ==================== Error Handler ====================

const errorHandler = (err, req, res, next) => {
  console.error(`[Saga Error] ${req.sagaId}:`, err.message);
  res.status(err.status || 500).json({
    success: false,
    error: err.message || 'Saga execution failed',
    sagaId: req.sagaId
  });
};

// ==================== Exports ====================

module.exports = {
  validateUserInput,
  validateUserId,
  sagaTracker,
  errorHandler
};

