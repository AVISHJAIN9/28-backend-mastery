/**
 * Module 04: Middleware
 */

const errorHandler = (err, req, res, next) => {
  console.error(err);
  res.status(err.status || 500).json({ error: err.message });
};

const dbErrorHandler = (err, req, res, next) => {
  if (err.code === '23505') return res.status(400).json({ error: 'Unique constraint violation' });
  if (err.code === '23503') return res.status(400).json({ error: 'Foreign key violation' });
  errorHandler(err, req, res, next);
};

module.exports = { errorHandler, dbErrorHandler };

