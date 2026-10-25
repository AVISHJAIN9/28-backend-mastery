const { seedRequestSchema } = require('./schema');

const validateSeedRequest = (req, res, next) => {
  const { error, value } = seedRequestSchema.validate(req.body);
  if (error) {
    return res.status(400).json({
      error: 'Validation failed',
      details: error.details[0].message
    });
  }
  req.validatedBody = value;
  req.body = value;
  next();
};

module.exports = {
  validateSeedRequest
};
