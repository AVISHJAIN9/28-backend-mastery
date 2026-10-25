const { validateUserSchema } = require('./schema');

// ==================== Client Type Detection ====================

const detectClientType = (req, res, next) => {
  const userAgent = req.headers['user-agent'] || '';
  
  if (userAgent.includes('Mobile')) {
    req.clientType = 'MOBILE';
  } else if (userAgent.includes('iPad')) {
    req.clientType = 'TABLET';
  } else {
    req.clientType = 'WEB';
  }
  
  console.log(`[BFF] Client type: ${req.clientType}`);
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
  console.error('[BFF Error]:', err.message);
  res.status(500).json({
    success: false,
    error: err.message || 'Internal server error',
    clientType: req.clientType
  });
};

// ==================== Exports ====================

module.exports = {
  detectClientType,
  validateUserInput,
  validateUserId,
  errorHandler
};

