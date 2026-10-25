const Joi = require('joi');

const codeSchema = Joi.object({
  code: Joi.string().min(1).max(10000).required(),
  vars: Joi.object().optional().unknown(true),
});

const sandboxSchema = Joi.object({
  id: Joi.string().required(),
  code: Joi.string().required(),
  vars: Joi.object().required(),
});

module.exports = {
  codeSchema,
  sandboxSchema,
};
