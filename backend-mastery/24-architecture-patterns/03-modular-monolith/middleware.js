const { validateUserSchema, validateOrderSchema, validateProductSchema } = require('./schema');

const validateUserInput = (req, res, next) => {
  const { error } = validateUserSchema(req.body);
  if (error) return res.status(400).json({ success: false, error: error.details[0].message });
  next();
};

const validateOrderInput = (req, res, next) => {
  const { error } = validateOrderSchema(req.body);
  if (error) return res.status(400).json({ success: false, error: error.details[0].message });
  next();
};

const validateProductInput = (req, res, next) => {
  const { error } = validateProductSchema(req.body);
  if (error) return res.status(400).json({ success: false, error: error.details[0].message });
  next();
};

const validateUserId = (req, res, next) => {
  if (!req.params.id || isNaN(req.params.id)) {
    return res.status(400).json({ success: false, error: 'Invalid ID' });
  }
  next();
};

module.exports = { validateUserInput, validateOrderInput, validateProductInput, validateUserId };
