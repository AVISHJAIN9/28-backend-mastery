const validateRequest = (schema) => {
  return (req, res, next) => {
    const { error, value } = schema.validate(req.body, {
      abortEarly: false,
      stripUnknown: true,
    });

    if (error) {
      return res.status(400).json({
        error: 'Validation failed',
        details: error.details,
      });
    }

    req.validatedBody = value;
    next();
  };
};

const errorHandler = (err, req, res, next) => {
  console.error('[PostHog Error]', err.message);
  res.status(500).json({ error: 'Analytics error' });
};

module.exports = {
  validateRequest,
  errorHandler,
};
