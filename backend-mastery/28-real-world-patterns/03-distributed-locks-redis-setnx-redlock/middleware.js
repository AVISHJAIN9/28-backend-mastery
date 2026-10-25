const { 
  processTransactionSchema, 
  batchPaymentSchema, 
  allocateResourceSchema, 
  querySchema, 
  idSchema 
} = require('./schema');
const logger = require('winston').createLogger({
  level: 'info',
  format: require('winston').format.json(),
  transports: [
    new (require('winston').transports.Console)()
  ]
});

// Validate process transaction
const validateProcessTransaction = (req, res, next) => {
  const { error, value } = processTransactionSchema.validate(req.body);
  if (error) {
    return res.status(400).json({ 
      error: 'Invalid transaction data',
      details: error.details[0].message 
    });
  }
  req.body = value;
  next();
};

// Validate batch payment
const validateBatchPayment = (req, res, next) => {
  const { error, value } = batchPaymentSchema.validate(req.body);
  if (error) {
    return res.status(400).json({ 
      error: 'Invalid batch payment data',
      details: error.details[0].message 
    });
  }
  req.body = value;
  next();
};

// Validate resource allocation
const validateAllocateResource = (req, res, next) => {
  const { error, value } = allocateResourceSchema.validate(req.body);
  if (error) {
    return res.status(400).json({ 
      error: 'Invalid resource allocation data',
      details: error.details[0].message 
    });
  }
  req.body = value;
  next();
};

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
  const { error, value } = idSchema.validate({ id: req.params.id });
  if (error) {
    return res.status(400).json({ 
      error: 'Invalid ID parameter',
      details: error.details[0].message 
    });
  }
  req.params.id = value.id;
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
  validateProcessTransaction,
  validateBatchPayment,
  validateAllocateResource,
  validateQuery,
  validateId,
  errorHandler,
  logger
};

