const Joi = require("joi");
const basicQuery = Joi.object({query: Joi.string().optional()});
module.exports = { basicQuery };