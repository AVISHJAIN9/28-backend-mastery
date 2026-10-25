/**
 * Module 06: Middleware
 */

const errorHandler = (err, req, res, next) => {
  console.error(err);
  res.status(err.status || 500).json({ error: err.message });
};

const bodyValidator = (req, res, next) => {
  if (!req.body) return res.status(400).json({ error: 'Body required' });
  next();
};

module.exports = { errorHandler, bodyValidator };

