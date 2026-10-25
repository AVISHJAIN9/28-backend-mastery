const Joi = require('joi');

/**
 * Validate request body
 */
exports.validateBody = (req, res, next) => {
  if (!req.body || Object.keys(req.body).length === 0) {
    return res.status(400).json({ error: 'Request body required' });
  }
  next();
};

/**
 * Validate query parameters
 */
exports.validateQuery = (req, res, next) => {
  const { page, limit } = req.query;
  
  if (page && isNaN(parseInt(page))) {
    return res.status(400).json({ error: 'page must be a number' });
  }
  if (limit && isNaN(parseInt(limit))) {
    return res.status(400).json({ error: 'limit must be a number' });
  }
  
  next();
};

/**
 * Error handling middleware
 */
exports.errorHandler = (err, req, res, next) => {
  console.error('Error:', err);
  res.status(err.status || 500).json({
    error: err.message || 'Internal server error'
  });
};
