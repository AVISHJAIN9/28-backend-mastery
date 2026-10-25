const {
  createRecordSchema,
  updateRecordSchema,
  migrateSchemaSchema,
  idSchema,
  querySchema
} = require('./schema');
const logger = require('winston').createLogger({
  level: 'info',
  format: require('winston').format.json(),
  transports: [
    new (require('winston').transports.Console)()
  ]
});

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

// Validate create record
const validateCreateRecord = (req, res, next) => {
  const { error, value } = createRecordSchema.validate(req.body);
  if (error) {
    return res.status(400).json({
      error: 'Invalid record data',
      details: error.details[0].message
    });
  }
  req.body = value;
  next();
};

// Validate update record
const validateUpdateRecord = (req, res, next) => {
  const { error, value } = updateRecordSchema.validate(req.body);
  if (error) {
    return res.status(400).json({
      error: 'Invalid record data',
      details: error.details[0].message
    });
  }
  req.body = value;
  next();
};

// Validate schema migration
const validateMigrateSchema = (req, res, next) => {
  const { error, value } = migrateSchemaSchema.validate(req.body);
  if (error) {
    return res.status(400).json({
      error: 'Invalid schema migration request',
      details: error.details[0].message
    });
  }
  req.body = value;
  next();
};

module.exports = {
  validateId,
  validateQuery,
  validateCreateRecord,
  validateUpdateRecord,
  validateMigrateSchema,
  logger
};
