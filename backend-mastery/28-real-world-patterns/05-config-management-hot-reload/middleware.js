const {
  getConfigSchema,
  updateConfigSchema,
  validateConfigSchema,
  querySchema,
  idSchema
} = require('./schema');

const logger = require('winston').createLogger({
  level: 'info',
  format: require('winston').format.json(),
  transports: [new (require('winston').transports.Console)()]
});

/**
 * Validate get config request
 */
const validateGetConfig = (req, res, next) => {
  const { error, value } = getConfigSchema.validate(req.query);
  if (error) {
    return res.status(400).json({
      error: 'Invalid config query',
      details: error.details[0].message
    });
  }
  req.query = value;
  next();
};

/**
 * Validate update config request
 */
const validateUpdateConfig = (req, res, next) => {
  const { error, value } = updateConfigSchema.validate(req.body);
  if (error) {
    return res.status(400).json({
      error: 'Invalid config update',
      details: error.details[0].message
    });
  }
  req.body = value;
  next();
};

/**
 * Validate config validation request
 */
const validateConfigValidation = (req, res, next) => {
  const { error, value } = validateConfigSchema.validate(req.body);
  if (error) {
    return res.status(400).json({
      error: 'Invalid config validation request',
      details: error.details[0].message
    });
  }
  req.body = value;
  next();
};

/**
 * Validate query parameters
 */
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

/**
 * Validate ID parameter
 */
const validateId = (req, res, next) => {
  const { error, value } = idSchema.validate({ id: req.params.id });
  if (error) {
    return res.status(400).json({
      error: 'Invalid ID format',
      details: error.details[0].message
    });
  }
  req.params.id = value.id;
  next();
};

/**
 * Error handler middleware
 */
const errorHandler = (err, req, res, next) => {
  logger.error('Middleware error', { error: err.message });
  res.status(500).json({ error: 'Internal error' });
};

module.exports = {
  validateGetConfig,
  validateUpdateConfig,
  validateConfigValidation,
  validateQuery,
  validateId,
  errorHandler,
  logger
};
