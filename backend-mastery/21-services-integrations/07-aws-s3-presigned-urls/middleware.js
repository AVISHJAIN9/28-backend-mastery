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
        details: error.details.map(d => d.message),
      });
    }

    req.validatedBody = value;
    next();
  };
};

const errorHandler = (err, req, res, next) => {
  console.error('[S3 Error]', err.message);
  if (err.code === 'NoSuchBucket') {
    return res.status(404).json({ error: 'Bucket not found' });
  }
  res.status(500).json({ error: 'S3 operation failed' });
};

module.exports = {
  validateRequest,
  errorHandler,
};
