/**
 * Module 03: Middleware
 */

const errorHandler = (err, req, res, next) => {
  console.error(err);
  res.status(err.status || 500).json({ error: err.message });
};

const requestLogger = (req, res, next) => {
  console.log(`${req.method} ${req.path}`);
  next();
};

module.exports = { errorHandler, requestLogger };

