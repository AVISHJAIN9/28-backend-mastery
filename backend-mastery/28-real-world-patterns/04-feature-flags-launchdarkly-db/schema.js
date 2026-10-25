const Joi = require('joi');

// Feature flag evaluation schema
const evaluateFlagSchema = Joi.object({
  flag_name: Joi.string().max(100).required(),
  user_id: Joi.string().optional(),
  context: Joi.object({
    country: Joi.string().optional(),
    tier: Joi.string().valid('free', 'pro', 'enterprise').optional(),
    beta_user: Joi.boolean().optional(),
    custom_attributes: Joi.object().optional()
  }).optional()
});

// Create feature flag schema
const createFlagSchema = Joi.object({
  name: Joi.string().max(100).required(),
  description: Joi.string().max(500).optional(),
  enabled: Joi.boolean().default(false),
  rollout_percentage: Joi.number().integer().min(0).max(100).default(0),
  targeting_rules: Joi.array().items(
    Joi.object({
      attribute: Joi.string().required(),
      operator: Joi.string().valid('equals', 'contains', 'greater_than', 'less_than').required(),
      value: Joi.alternatives().try(Joi.string(), Joi.number(), Joi.boolean()).required(),
      on_match: Joi.string().valid('enable', 'disable').required()
    })
  ).optional(),
  variants: Joi.array().items(
    Joi.object({
      name: Joi.string().required(),
      value: Joi.string().required(),
      weight: Joi.number().integer().min(0).max(100)
    })
  ).optional()
});

// Update feature flag schema
const updateFlagSchema = Joi.object({
  enabled: Joi.boolean().optional(),
  rollout_percentage: Joi.number().integer().min(0).max(100).optional(),
  targeting_rules: Joi.array().items(
    Joi.object({
      attribute: Joi.string().required(),
      operator: Joi.string().valid('equals', 'contains', 'greater_than', 'less_than').required(),
      value: Joi.alternatives().try(Joi.string(), Joi.number(), Joi.boolean()).required(),
      on_match: Joi.string().valid('enable', 'disable').required()
    })
  ).optional()
});

// Query schema
const querySchema = Joi.object({
  limit: Joi.number().integer().min(1).max(100).default(10),
  offset: Joi.number().integer().min(0).default(0)
});

// ID schema
const idSchema = Joi.object({
  id: Joi.string().required()
});

module.exports = {
  evaluateFlagSchema,
  createFlagSchema,
  updateFlagSchema,
  querySchema,
  idSchema
};
