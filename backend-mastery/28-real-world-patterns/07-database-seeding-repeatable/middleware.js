const {
  seedDataSchema,
  upsertRecordsSchema,
  querySchema
} = require('./schema');
const logger = require('winston').createLogger({
  level: 'info',
  format: require('winston').format.json(),
  transports: [
    new (require('winston').transports.Console)()
  ]
});

// Validate seed data
const validateSeedData = (req, res, next) => {
  const { error, value } = seedDataSchema.validate(req.body);
  if (error) {
    return res.status(400).json({
      error: 'Invalid seed data',
      details: error.details[0].message
    });
  }
  req.body = value;
  next();
};

// Validate upsert records
const validateUpsertRecords = (req, res, next) => {
  const { error, value } = upsertRecordsSchema.validate(req.body);
  if (error) {
    return res.status(400).json({
      error: 'Invalid upsert data',
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

module.exports = {
  validateSeedData,
  validateUpsertRecords,
  validateQuery,
  logger
};
