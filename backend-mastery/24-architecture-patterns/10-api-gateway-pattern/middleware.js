const { validateUserSchema } = require('./schema');
const { AuthService } = require('./controller');

// ==================== Gateway Authentication ====================

const authenticate = (req, res, next) => {
  const token = req.headers.authorization;
  const auth = AuthService.validateToken(token);
  
  if (!auth.valid) {
    return res.status(401).json({
      success: false,
      error: 'Unauthorized - Invalid or missing token'
    });
  }
  
  req.user = auth.user;
  console.log(`[Gateway] Authenticated user: ${auth.user}`);
  next();
};

// ==================== Request Validation ====================

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

// ==================== Request Logging ====================

const logRequest = (req, res, next) => {
  console.log(`[Gateway] ${req.method} ${req.path} - User: ${req.user || 'anonymous'}`);
  next();
};

// ==================== Error Handler ====================

const errorHandler = (err, req, res, next) => {
  console.error('[Gateway Error]:', err.message);
  res.status(err.status || 500).json({
    success: false,
    error: err.message || 'Gateway error'
  });
};

// ==================== Exports ====================

module.exports = {
  authenticate,
  validateUserInput,
  validateUserId,
  logRequest,
  errorHandler
};

