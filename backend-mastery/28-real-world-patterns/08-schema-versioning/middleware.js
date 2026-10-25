const logger = require('winston');
const { 
  createSchemaVersionSchema,
  alignDataSchema,
  rollbackSchemaSchema,
  getSchemaVersionSchema,
  checkCompatibilitySchema,
  migrationHistorySchema
} = require('./schema');

// Initialize Winston logger
const winstonLogger = logger.createLogger({
  level: process.env.LOG_LEVEL || 'info',
  format: logger.format.json(),
  transports: [
    new logger.transports.File({ filename: 'error.log', level: 'error' }),
    new logger.transports.File({ filename: 'combined.log' })
  ]
});

// Validate schema version creation
const validateCreateSchemaVersion = (req, res, next) => {
  const { error, value } = createSchemaVersionSchema.validate(req.body, { abortEarly: false });
  
  if (error) {
    winstonLogger.warn('Schema version validation failed', { errors: error.details });
    return res.status(400).json({
      error: 'Validation failed',
      details: error.details.map(d => d.message)
    });
  }
  
  req.validated = value;
  next();
};

// Validate data alignment request
const validateAlignData = (req, res, next) => {
  const { error, value } = alignDataSchema.validate(req.body, { abortEarly: false });
  
  if (error) {
    winstonLogger.warn('Data alignment validation failed', { errors: error.details });
    return res.status(400).json({
      error: 'Validation failed',
      details: error.details.map(d => d.message)
    });
  }
  
  req.validated = value;
  next();
};

// Validate schema rollback
const validateRollbackSchema = (req, res, next) => {
  const { error, value } = rollbackSchemaSchema.validate(req.body, { abortEarly: false });
  
  if (error) {
    winstonLogger.warn('Schema rollback validation failed', { errors: error.details });
    return res.status(400).json({
      error: 'Validation failed',
      details: error.details.map(d => d.message)
    });
  }
  
  req.validated = value;
  next();
};

// Validate schema retrieval
const validateGetSchema = (req, res, next) => {
  const { error, value } = getSchemaVersionSchema.validate(req.query, { abortEarly: false });
  
  if (error) {
    winstonLogger.warn('Schema retrieval validation failed', { errors: error.details });
    return res.status(400).json({
      error: 'Validation failed',
      details: error.details.map(d => d.message)
    });
  }
  
  req.validated = value;
  next();
};

// Validate compatibility check
const validateCheckCompatibility = (req, res, next) => {
  const { error, value } = checkCompatibilitySchema.validate(req.query, { abortEarly: false });
  
  if (error) {
    winstonLogger.warn('Compatibility check validation failed', { errors: error.details });
    return res.status(400).json({
      error: 'Validation failed',
      details: error.details.map(d => d.message)
    });
  }
  
  req.validated = value;
  next();
};

// Validate migration history query
const validateMigrationHistory = (req, res, next) => {
  const { error, value } = migrationHistorySchema.validate(req.query, { abortEarly: false });
  
  if (error) {
    winstonLogger.warn('Migration history validation failed', { errors: error.details });
    return res.status(400).json({
      error: 'Validation failed',
      details: error.details.map(d => d.message)
    });
  }
  
  req.validated = value;
  next();
};

// Error handler
const errorHandler = (err, req, res, next) => {
  winstonLogger.error('Request error', { error: err.message, path: req.path });
  res.status(500).json({ error: 'Internal server error' });
};

module.exports = {
  validateCreateSchemaVersion,
  validateAlignData,
  validateRollbackSchema,
  validateGetSchema,
  validateCheckCompatibility,
  validateMigrationHistory,
  errorHandler,
  logger: winstonLogger
};