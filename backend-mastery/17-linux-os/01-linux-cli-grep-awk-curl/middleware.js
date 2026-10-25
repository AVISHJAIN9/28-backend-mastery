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

// Request validation middleware
const validateQuery = (req, res, next) => {
  const { pattern, text, data, url } = req.query;
  if (!pattern && !text && !data && !url) {
    return res.status(400).json({ error: 'Missing required query parameters' });
  }
  next();
};

module.exports = {
  logger,
  errorHandler,
  validateQuery
  if (req.path.includes('/grep') && (!pattern || !text)) {
    return res.status(400).json({ error: 'grep requires pattern and text parameters' });
  }
  if (req.path.includes('/awk') && !data) {
    return res.status(400).json({ error: 'awk requires data parameter' });
  }
  if (req.path.includes('/curl') && !url) {
    return res.status(400).json({ error: 'curl requires url parameter' });
  }
  next();
};

module.exports = { logger, errorHandler, validateQuery };