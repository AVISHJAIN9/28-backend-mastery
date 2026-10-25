const { seedFileSchema, runSeedSchema, rollbackSchema, historySchema, migrationStatusSchema } = require('./schema');
const winston = require('winston');

const logger = winston.createLogger({
  level: 'info',
  format: winston.format.json(),
  transports: [
    new winston.transports.File({ filename: 'error.log', level: 'error' }),
    new winston.transports.File({ filename: 'combined.log' })
  ]
});

// Validate seed file
const validateSeedFile = (req, res, next) => {
  const { error, value } = seedFileSchema.validate(req.body);
  if (error) {
    logger.warn('Invalid seed file', { error: error.details[0].message });
    return res.status(400).json({
      error: 'Invalid seed file',
      details: error.details[0].message
    });
  }
  req.body = value;
  next();
};

// Validate run seed request
const validateRunSeed = (req, res, next) => {
  const { error, value } = runSeedSchema.validate(req.body);
  if (error) {
    logger.warn('Invalid seed request', { error: error.details[0].message });
    return res.status(400).json({
      error: 'Invalid seed request',
      details: error.details[0].message
    });
  }
  req.body = value;
  next();
};

// Validate rollback request
const validateRollback = (req, res, next) => {
  const { error, value } = rollbackSchema.validate(req.body);
  if (error) {
    logger.warn('Invalid rollback request', { error: error.details[0].message });
    return res.status(400).json({
      error: 'Invalid rollback request',
      details: error.details[0].message
    });
  }
  req.body = value;
  next();
};

// Validate history query
const validateHistory = (req, res, next) => {
  const { error, value } = historySchema.validate(req.query);
  if (error) {
    logger.warn('Invalid history query', { error: error.details[0].message });
    return res.status(400).json({
      error: 'Invalid history query',
      details: error.details[0].message
    });
  }
  req.query = value;
  next();
};

// Validate migration status query
const validateMigrationStatus = (req, res, next) => {
  const { error, value } = migrationStatusSchema.validate(req.query);
  if (error) {
    logger.warn('Invalid migration query', { error: error.details[0].message });
    return res.status(400).json({
      error: 'Invalid migration query',
      details: error.details[0].message
    });
  }
  req.query = value;
  next();
};

// Error handler
const errorHandler = (err, req, res, next) => {
  logger.error('Request error', { error: err.message, path: req.path, method: req.method });
  res.status(500).json({
    error: 'Internal server error',
    message: process.env.NODE_ENV === 'development' ? err.message : undefined
  });
};

module.exports = {
  validateSeedFile,
  validateRunSeed,
  validateRollback,
  validateHistory,
  validateMigrationStatus,
  errorHandler,
  logger
};
