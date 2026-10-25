const validateRequest = (schema) => {
  return (req, res, next) => {
    const { error, value } = schema.validate(req.body, {
      abortEarly: false,
      stripUnknown: true,
    });

    if (error) {
      return res.status(400).json({ error: 'Validation failed', details: error.details });
    }

    req.validatedBody = value;
    next();
  };
};

const verifyDomain = (req, res, next) => {
  const { domain } = req.validatedBody || req.params;
  // Simple validation
  if (!domain || !domain.includes('.')) {
    return res.status(400).json({ error: 'Invalid domain' });
  }
  next();
};

const errorHandler = (err, req, res, next) => {
  console.error('[DNS Error]', err.message);
  res.status(500).json({ error: 'DNS verification failed' });
};

module.exports = {
  validateRequest,
  verifyDomain,
  errorHandler,
};
