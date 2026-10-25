// Schema definitions and validation

const validationRules = {
  basicRequest: {
    required: ['data'],
    optional: ['format']
  }
};

module.exports = {
  validationRules
};