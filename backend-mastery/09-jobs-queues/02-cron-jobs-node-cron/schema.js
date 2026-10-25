/**
 * Cron Jobs Validation Schema
 */

const Joi = require('joi');

/**
 * Create task validation schema
 */
const createTaskSchema = Joi.object({
  taskName: Joi.string()
    .required()
    .min(3)
    .max(50)
    .messages({
      'string.empty': 'Task name is required',
      'string.min': 'Task name must be at least 3 characters',
      'string.max': 'Task name must be at most 50 characters'
    }),
  cronExpression: Joi.string()
    .required()
    .pattern(/^(\*|([0-9]|1[0-9]|2[0-9]|3[0-9]|4[0-9]|5[0-9])|\*\/([0-9]|1[0-9]|2[0-9]|3[0-9]|4[0-9]|5[0-9])) (\*|([0-9]|1[0-9]|2[0-3])|\*\/([0-9]|1[0-9]|2[0-3])) (\*|([1-9]|1[0-9]|2[0-9]|3[0-1])|\*\/([1-9]|1[0-9]|2[0-9]|3[0-1])) (\*|([1-9]|1[0-2])|\*\/([1-9]|1[0-2])) (\*|([0-6])|\*\/([0-6]))$/)
    .messages({
      'string.pattern.base': 'Invalid cron expression format'
    }),
  description: Joi.string()
    .optional()
    .max(200)
    .messages({
      'string.max': 'Description must be at most 200 characters'
    })
});

/**
 * Validate request body
 */
const validateCreateTask = (req, res, next) => {
  const { error, value } = createTaskSchema.validate(req.body);
  
  if (error) {
    return res.status(400).json({
      error: error.details[0].message
    });
  }
  
  req.validatedBody = value;
  next();
};

module.exports = {
  createTaskSchema,
  validateCreateTask
};

