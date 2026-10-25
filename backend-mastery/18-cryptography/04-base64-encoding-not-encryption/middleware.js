// Request logging middleware
const logger = (req, res, next) => {
  const timestamp = new Date().toISOString();
  console.log(`[${timestamp}] ${req.method} ${req.path}`);
  next();
};

// Error handling middleware
const errorHandler = (err, req, res, next) => {
  console.error(`[ERROR] ${err.message}`);
  res.status(err.status || 500).json({
    error: err.message,
    path: req.path,
    timestamp: new Date().toISOString()
  });
};

module.exports = {
  logger,
  errorHandler
};