const Joi = require('joi');

const schemas = {
  registerWebhook: Joi.object({
    url: Joi.string().uri().required(),
    events: Joi.array().items(Joi.string()).optional(),
    secret: Joi.string().optional(),
    active: Joi.boolean().optional()
  }),

  updateWebhook: Joi.object({
    url: Joi.string().uri().optional(),
    events: Joi.array().items(Joi.string()).optional(),
    active: Joi.boolean().optional()
  }).min(1),

  triggerEvent: Joi.object({
    eventType: Joi.string().required(),
    data: Joi.object().optional()
  })
};

module.exports = schemas;
