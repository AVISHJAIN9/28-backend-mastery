// Schema definitions for Linux CLI tools

// grep endpoint validation
const grepValidation = {
  required: ['pattern', 'text'],
  example: {
    pattern: 'error',
    text: 'line1\nline2 with error\nline3'
  }
};

// awk endpoint validation
const awkValidation = {
  required: ['data'],
  format: 'field1:field2:field3;value1:value2:value3',
  example: {
    data: 'name:age:city;John:25:NYC;Jane:30:LA'
  }
};

// curl endpoint validation
const curlValidation = {
  required: ['url'],
  optional: ['method'],
  example: {
    url: 'https://api.example.com/data',
    method: 'GET'
  }
};

module.exports = {
  grepValidation,
  awkValidation,
  curlValidation
const curlSchema = Joi.object({
  url: Joi.string().uri().required(),
  method: Joi.string().valid('GET', 'POST', 'PUT', 'DELETE').optional()
});

// Basic query validation
const basicQuery = Joi.object({
  query: Joi.string().optional()
});

module.exports = { grepSchema, awkSchema, curlSchema, basicQuery };