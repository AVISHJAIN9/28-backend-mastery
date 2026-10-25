const Joi = require('joi');

exports.createUserSchema = Joi.object({
  email: Joi.string().email().required(),
  name: Joi.string().required(),
  role: Joi.string().valid('admin', 'moderator', 'user').optional(),
  status: Joi.string().valid('active', 'inactive', 'suspended').optional()
});

exports.updateUserSchema = Joi.object({
  role: Joi.string().valid('admin', 'moderator', 'user').optional(),
  status: Joi.string().valid('active', 'inactive', 'suspended').optional(),
  blocked: Joi.boolean().optional()
});

exports.updateConfigSchema = Joi.object({
  maxUsers: Joi.number().positive().optional(),
  maintenanceMode: Joi.boolean().optional(),
  features: Joi.object({
    twoFactorAuth: Joi.boolean().optional(),
    apiKeys: Joi.boolean().optional(),
    webhooks: Joi.boolean().optional(),
    rateLimit: Joi.boolean().optional()
  }).optional()
});

exports.bulkUserActionSchema = Joi.object({
  userIds: Joi.array().items(Joi.string().uuid()).required(),
  action: Joi.string().valid('suspend', 'activate', 'block', 'unblock').required()
});

exports.querySchema = Joi.object({
  page: Joi.number().min(1).default(1),
  limit: Joi.number().min(1).max(100).default(20),
  sortBy: Joi.string().optional(),
  order: Joi.string().valid('asc', 'desc').default('desc')
});
