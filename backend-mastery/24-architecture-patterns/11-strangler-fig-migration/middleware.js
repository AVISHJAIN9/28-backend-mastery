const { validateUserSchema } = require('./schema');

// ==================== System Version Selector ====================

const selectSystem = (req, res, next) => {
  // Check query parameter or header for system preference
  req.useLegacy = req.query.system === 'legacy' || req.headers['x-use-legacy'] === 'true';
  console.log(`[Strangler] Using ${req.useLegacy ? 'LEGACY' : 'MODERN'} system`);
  next();
};

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

// ==================== Error Handler ====================

const errorHandler = (err, req, res, next) => {
  console.error('[Strangler Error]:', err.message);
  res.status(500).json({
    success: false,
    error: err.message || 'System error',
    system: req.useLegacy ? 'legacy' : 'modern'
  });
};

// ==================== Exports ====================

module.exports = {
  selectSystem,
  validateUserInput,
  validateUserId,
  errorHandler
};

