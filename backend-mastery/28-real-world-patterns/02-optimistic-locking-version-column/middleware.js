const { querySchema, idSchema, updateProductSchema, createProductSchema } = require('./schema');
const logger = require('winston').createLogger({
  level: 'info',
  format: require('winston').format.json(),
  transports: [
    new (require('winston').transports.Console)()
  ]
});

// Validate query parameters
const validateQuery = (req, res, next) => {
  const { error, value } = querySchema.validate(req.query);
  if (error) {
    return res.status(400).json({ 
      error: 'Invalid query parameters',
      details: error.details[0].message 
    });
  }
  req.query = value;
  next();
};

// Validate ID parameter
const validateId = (req, res, next) => {
  const { error, value } = idSchema.validate({ id: parseInt(req.params.id) });
  if (error) {
    return res.status(400).json({ 
      error: 'Invalid ID parameter',
      details: error.details[0].message 
    });
  }
  req.params.id = value.id;
  next();
};

// Validate create product
const validateCreateProduct = (req, res, next) => {
  const { error, value } = createProductSchema.validate(req.body);
  if (error) {
    return res.status(400).json({ 
      error: 'Invalid product data',
      details: error.details[0].message 
    });
  }
  req.body = value;
  next();
};

// Validate update product with version
const validateUpdateProduct = (req, res, next) => {
  const { error, value } = updateProductSchema.validate(req.body);
  if (error) {
    return res.status(400).json({ 
      error: 'Invalid update data',
      details: error.details[0].message 
    });
  }
  req.body = value;
  next();
};

// Error handling middleware
const errorHandler = (err, req, res, next) => {
  logger.error('Error occurred', { 
    error: err.message,
    path: req.path,
    method: req.method
  });
  res.status(500).json({ 
    error: 'Internal server error',
    message: process.env.NODE_ENV === 'development' ? err.message : undefined
  });
};

module.exports = {
  validateQuery,
  validateId,
  validateCreateProduct,
  validateUpdateProduct,
  errorHandler,
  logger
};

