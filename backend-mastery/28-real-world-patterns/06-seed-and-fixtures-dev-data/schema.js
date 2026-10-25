const Joi = require('joi');

const seedRequestSchema = Joi.object({
  collection: Joi.string()
    .valid('users', 'posts', 'comments', 'all')
    .optional()
    .default('all')
    .description('Collection to seed'),
  count: Joi.number()
    .integer()
    .min(1)
    .max(1000)
    .optional()
    .default(10)
    .description('Number of records to generate')
});

module.exports = {
  seedRequestSchema
};
