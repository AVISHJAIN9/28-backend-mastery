const jwt = require('jsonwebtoken');

/**
 * JWT authentication middleware
 * Verifies token and handles key rotation gracefully
 */
exports.authenticate = (verifyTokenFn) => {
  return (req, res, next) => {
    const authHeader = req.headers.authorization;

    if (!authHeader || !authHeader.startsWith('Bearer ')) {
      return res.status(401).json({
        error: 'Authorization header required'
      });
    }

    const token = authHeader.substring(7);

    try {
      const decoded = verifyTokenFn(token);
      req.user = decoded;
      req.token = token;
      next();
    } catch (error) {
      return res.status(401).json({
        error: 'Token verification failed',
        details: error.message
      });
    }
  };
};

/**
 * Validate request body
 */
exports.validateRequest = (schema) => {
  return (req, res, next) => {
    const { error, value } = schema.validate(req.body);

    if (error) {
      return res.status(400).json({
        error: 'Validation failed',
        details: error.details.map(d => d.message)
      });
    }

    req.validatedData = value;
    next();
  };
};

/**
 * Error handler
 */
exports.errorHandler = (err, req, res, next) => {
  console.error('Error:', err);
  return res.status(err.status || 500).json({
    error: err.message || 'Internal server error'
  });
};

/**
 * Log JWT operations
 */
exports.logJwtOperation = (operation) => {
  return (req, res, next) => {
    console.log(`[JWT] ${operation}`);
    next();
  };
};
