/**
 * Verify step-up token
 */
exports.verifyStepUpToken = (req, res, next) => {
  const token = req.headers['x-step-up-token'];

  if (!token) {
    return res.status(401).json({ error: 'Step-up token required' });
  }

  req.stepUpToken = token;
  next();
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
