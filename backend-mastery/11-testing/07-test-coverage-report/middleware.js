/**
 * Module 07: Middleware
 */

const errorHandler = (err, req, res, next) => {
  res.status(err.status || 500).json({ error: err.message });
};

const logRequest = (req, res, next) => {
  console.log(`${req.method} ${req.path}`);
  next();
};

module.exports = { errorHandler, logRequest };

