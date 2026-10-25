const validateRequest = (schema) => {
  return (req, res, next) => {
    const { error, value } = schema.validate(req.body, {
      abortEarly: false,
      stripUnknown: true,
    });

    if (error) {
      const details = error.details.map(d => ({
        field: d.path.join('.'),
        message: d.message,
      }));
      return res.status(400).json({ error: 'Validation failed', details });
    }

    req.validatedBody = value;
    next();
  };
};

const authMiddleware = (req, res, next) => {
  const token = req.headers.authorization?.split(' ')[1];
  if (!token) {
    return res.status(401).json({ error: 'No token' });
  }
  req.uid = 'user-' + token.substring(0, 10);
  next();
};

const errorHandler = (err, req, res, next) => {
  console.error('[Supabase Error]', err.message);
  res.status(500).json({ error: 'Internal error' });
};

module.exports = {
  validateRequest,
  authMiddleware,
  errorHandler,
};
