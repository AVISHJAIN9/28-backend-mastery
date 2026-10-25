const {
  seedConfigValidate,
  runSeederValidate,
  fixtureDataValidate,
  validateSeedValidate,
  seedStatusValidate,
  batchSeedValidate
} = require('./schema');
const winston = require('winston');

// Logger setup
const logger = winston.createLogger({
  level: 'info',
  format: winston.format.json(),
  transports: [
    new winston.transports.File({ filename: 'error.log', level: 'error' }),
    new winston.transports.File({ filename: 'combined.log' })
  ]
});

// Validate seed configuration
const validateSeedConfig = (req, res, next) => {
  const { error, value } = seedConfigValidate(req.body);
  if (error) {
    logger.warn('Invalid seed config', { error: error.details[0].message, ip: req.ip });
    return res.status(400).json({
      error: 'Invalid seed configuration',
      details: error.details[0].message
    });
  }
  req.body = value;
  next();
};

// Validate run seeder request
const validateRunSeeder = (req, res, next) => {
  const { error, value } = runSeederValidate(req.body);
  if (error) {
    logger.warn('Invalid seeder request', { error: error.details[0].message, ip: req.ip });
    return res.status(400).json({
      error: 'Invalid seeder request',
      details: error.details[0].message
    });
  }
  req.body = value;
  next();
};

// Validate fixture data
const validateFixtureData = (req, res, next) => {
  const { error, value } = fixtureDataValidate(req.body);
  if (error) {
    logger.warn('Invalid fixture data', { error: error.details[0].message, ip: req.ip });
    return res.status(400).json({
      error: 'Invalid fixture data',
      details: error.details[0].message
    });
  }
  req.body = value;
  next();
};

// Validate seed validation request
const validateValidateSeed = (req, res, next) => {
  const { error, value } = validateSeedValidate(req.body);
  if (error) {
    logger.warn('Invalid validation request', { error: error.details[0].message, ip: req.ip });
    return res.status(400).json({
      error: 'Invalid validation request',
      details: error.details[0].message
    });
  }
  req.body = value;
  next();
};

// Validate seed status query
const validateSeedStatusQuery = (req, res, next) => {
  const { error, value } = seedStatusValidate(req.query);
  if (error) {
    logger.warn('Invalid status query', { error: error.details[0].message, ip: req.ip });
    return res.status(400).json({
      error: 'Invalid status query',
      details: error.details[0].message
    });
  }
  req.query = value;
  next();
};

// Validate batch seed request
const validateBatchSeed = (req, res, next) => {
  const { error, value } = batchSeedValidate(req.body);
  if (error) {
    logger.warn('Invalid batch seed request', { error: error.details[0].message, ip: req.ip });
    return res.status(400).json({
      error: 'Invalid batch seed request',
      details: error.details[0].message
    });
  }
  req.body = value;
  next();
};

// Error handler middleware
const errorHandler = (err, req, res, next) => {
  logger.error('Request error', { 
    error: err.message,
    path: req.path,
    method: req.method,
    ip: req.ip
  });
  
  res.status(500).json({
    error: 'Internal server error',
    message: process.env.NODE_ENV === 'development' ? err.message : undefined
  });
};

module.exports = {
  validateSeedConfig,
  validateRunSeeder,
  validateFixtureData,
  validateValidateSeed,
  validateSeedStatusQuery,
  validateBatchSeed,
  errorHandler,
  logger
};
