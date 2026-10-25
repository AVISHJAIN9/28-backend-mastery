/**
 * Module 05: Middleware
 */

const requestLogger = (req, res, next) => {
  const start = Date.now();
  res.on('finish', () => {
    console.log(`${req.path} took ${Date.now() - start}ms`);
  });
  next();
};

const errorHandler = (err, req, res, next) => {
  res.status(err.status || 500).json({ error: err.message });
};

module.exports = { requestLogger, errorHandler };

