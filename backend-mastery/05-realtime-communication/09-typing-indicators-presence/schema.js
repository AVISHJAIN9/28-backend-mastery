const Joi = require('joi');
const presenceSchema = Joi.object({
  userId: Joi.string().required(),
  status: Joi.string().valid('online', 'away', 'offline'),
  lastSeen: Joi.date().optional()
});
module.exports = { presenceSchema };