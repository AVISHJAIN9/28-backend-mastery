/**
 * Check token is not revoked
 */
exports.checkTokenNotRevoked = (isTokenBlacklistedFn) => {
  return (req, res, next) => {
    const token = req.headers.authorization?.split(' ')[1];

    if (!token) {
      return res.status(401).json({ error: 'Token required' });
    }

    if (isTokenBlacklistedFn(token)) {
      return res.status(401).json({
        error: 'Token has been revoked'
      });
    }

    next();
  };
};

/**
 * Validate request
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
