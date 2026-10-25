/**
 * Validation Schemas for Unit Testing Module
 * Demonstrates how to create schemas that are tested
 */

const Joi = require('joi');

// ==================== User Validation ====================

const userCreationSchema = Joi.object({
  name: Joi.string()
    .alphanum()
    .min(2)
    .max(100)
    .required()
    .messages({
      'string.empty': 'Name cannot be empty',
      'string.min': 'Name must be at least 2 characters',
      'string.max': 'Name cannot exceed 100 characters'
    }),
  email: Joi.string()
    .email()
    .required()
    .messages({
      'string.email': 'Must be a valid email',
      'any.required': 'Email is required'
    }),
  password: Joi.string()
    .min(8)
    .max(100)
    .required()
    .messages({
      'string.min': 'Password must be at least 8 characters',
      'any.required': 'Password is required'
    }),
  age: Joi.number()
    .integer()
    .min(0)
    .max(150)
    .optional()
});

const userUpdateSchema = Joi.object({
  name: Joi.string()
    .alphanum()
    .min(2)
    .max(100)
    .optional(),
  email: Joi.string()
    .email()
    .optional(),
  age: Joi.number()
    .integer()
    .min(0)
    .max(150)
    .optional()
}).min(1);

// ==================== Test Case Validation ====================

const testCaseSchema = Joi.object({
  input: Joi.any().required(),
  expectedOutput: Joi.any().optional(),
  shouldThrow: Joi.boolean().default(false),
  description: Joi.string().optional()
});

const calculateSchema = Joi.object({
  operation: Joi.string()
    .valid('add', 'subtract', 'multiply', 'divide')
    .required(),
  a: Joi.number().required(),
  b: Joi.number().required()
});

// ==================== Validation Functions ====================

const validateUserCreation = (data) => {
  return userCreationSchema.validate(data, { abortEarly: false });
};

const validateUserUpdate = (data) => {
  return userUpdateSchema.validate(data, { abortEarly: false });
};

const validateTestCase = (data) => {
  return testCaseSchema.validate(data);
};

const validateCalculate = (data) => {
  return calculateSchema.validate(data);
};

module.exports = {
  userCreationSchema,
  userUpdateSchema,
  testCaseSchema,
  calculateSchema,
  validateUserCreation,
  validateUserUpdate,
  validateTestCase,
  validateCalculate
};

