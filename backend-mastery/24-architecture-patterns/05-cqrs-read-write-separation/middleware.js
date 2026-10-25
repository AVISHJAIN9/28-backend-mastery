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
      error: 'Invalid user ID',
      details: 'User ID must be a valid number'
    });
  }
  
  next();
};

// ==================== Request Tracking ====================

const trackRequest = (req, res, next) => {
  const isCommand = ['POST', 'PUT', 'PATCH', 'DELETE'].includes(req.method);
  const isQuery = req.method === 'GET';
  
  if (isCommand) console.log(`[COMMAND] ${req.method} ${req.path}`);
  if (isQuery) console.log(`[QUERY] ${req.method} ${req.path}`);
  
  next();
};

// ==================== Error Handler ====================

const errorHandler = (err, req, res, next) => {
  console.error('[CQRS Error]:', err);
  
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
  trackRequest,
  errorHandler
};

