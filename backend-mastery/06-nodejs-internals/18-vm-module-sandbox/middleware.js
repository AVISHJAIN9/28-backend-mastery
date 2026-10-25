const Joi = require('joi');

const validateCode = (req, res, next) => {
  const schema = Joi.object({
    code: Joi.string()
      .min(1)
      .max(10000)
      .required()
      .messages({
        'string.empty': 'Code cannot be empty',
        'string.max': 'Code too long (max 10000 chars)',
      }),
    vars: Joi.object()
      .optional()
      .unknown(true),
  });

  const { error, value } = schema.validate(req.body);
  if (error) {
    return res.status(400).json({ error: error.details[0].message });
  }

  req.body = value;
  next();
};

module.exports = {
  validateCode,
};
