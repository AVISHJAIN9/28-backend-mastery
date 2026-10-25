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

// Rate limiting simulation (for demonstration)
const rateLimit = (max = 100) => {
  const requests = {};
  return (req, res, next) => {
    const ip = req.ip;
    if (!requests[ip]) requests[ip] = 0;
    requests[ip]++;
    if (requests[ip] > max) {
      return res.status(429).json({ error: 'Too many requests' });
    }
    next();
  };
};

module.exports = {
  logger,
  errorHandler,
  rateLimit