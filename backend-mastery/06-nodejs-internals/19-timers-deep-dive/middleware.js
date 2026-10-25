const Joi = require('joi');

const validateDelay = (req, res, next) => {
  const schema = Joi.object({
    delay: Joi.number().min(0).max(60000).optional(),
    count: Joi.number().min(1).max(10000).optional(),
  });

  const { error, value } = schema.validate(req.body);
  if (error) {
    return res.status(400).json({ error: error.details[0].message });
  }

  req.body = value;
  next();
};

module.exports = {
  validateDelay,
};
