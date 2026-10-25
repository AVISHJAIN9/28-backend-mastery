/**
 * Express Routing Internals - Validation Schemas
 */

const Joi = require('joi');

exports.routeParams = Joi.object({
  id: Joi.string().alphanum().optional(),
  name: Joi.string().max(100).optional(),
});

exports.queryParams = Joi.object({
  page: Joi.number().integer().min(1).optional(),
  limit: Joi.number().integer().min(1).max(100).optional(),
});
