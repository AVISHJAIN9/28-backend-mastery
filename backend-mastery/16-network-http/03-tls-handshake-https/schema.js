const Joi = require('joi');

const schemas = { basicQuery: Joi.object({ query: Joi.string().optional() }) };

module.exports = schemas;

