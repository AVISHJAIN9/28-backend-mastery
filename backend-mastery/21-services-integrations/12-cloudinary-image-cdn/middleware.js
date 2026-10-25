const validateRequest = (schema) => {
  return (req, res, next) => {
    const source = req.method === 'GET' ? req.query : req.body;
    const { error, value } = schema.validate(source, {
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
  console.error('[Cloudinary Error]', err.message);
  res.status(500).json({ error: 'Image processing error' });
};

module.exports = {
  validateRequest,
  errorHandler,
};
