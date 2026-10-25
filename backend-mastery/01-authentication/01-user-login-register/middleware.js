const Joi = require('joi');

/**
 * Validation middleware
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
 * Authentication middleware
 */
exports.authenticate = (req, res, next) => {
  const authHeader = req.headers.authorization;
  if (!authHeader || !authHeader.startsWith('Bearer ')) {
    return res.status(401).json({ error: 'Missing or invalid authorization header' });
  }
  next();
};

/**
 * Error handling middleware
 */
exports.errorHandler = (err, req, res, next) => {
  console.error('Error:', err);
  return res.status(err.status || 500).json({
    error: err.message || 'Internal server error'
  });
};
