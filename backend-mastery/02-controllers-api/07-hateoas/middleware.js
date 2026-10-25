// HATEOAS validation middleware
const validateCreateRequest = (req, res, next) => {
  const { name } = req.body;
  
  if (!name || typeof name !== 'string') {
    return res.status(400).json({ error: 'Valid name string is required' });
  }
  
  next();
};

const validateUpdateRequest = (req, res, next) => {
  if (Object.keys(req.body).length === 0) {
    return res.status(400).json({ error: 'At least one field must be provided' });
  }
  
  next();
};

const validateResourceId = (req, res, next) => {
  const { id } = req.params;
  
  if (!id) {
    return res.status(400).json({ error: 'Resource ID is required' });
  }
  
  next();
};

module.exports = { validateCreateRequest, validateUpdateRequest, validateResourceId };
