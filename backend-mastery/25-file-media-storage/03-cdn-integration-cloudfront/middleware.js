/**
 * Middleware - Module 03: CDN CloudFront
 */

const requestLogger = (req, res, next) => {
  const start = Date.now();
  const requestId = `${Date.now()}-${Math.random().toString(36).substr(2, 9)}`;
  req.id = requestId;
  
  res.on('finish', () => {
    const duration = Date.now() - start;
    console.log(`[${requestId}] ${req.method} ${req.path} - ${res.statusCode} - ${duration}ms`);
  });
  next();
};

const errorHandler = (err, req, res, next) => {
  console.error(`[${req.id}] Error:`, err.message);
  const status = err.status || 500;
  res.status(status).json({
    error: err.message || 'Internal server error',
    requestId: req.id
  });
};

const validateContentType = (req, res, next) => {
  if (['POST', 'PUT'].includes(req.method)) {
    const contentType = req.headers['content-type'];
    if (!contentType || !contentType.includes('application/json')) {
      return res.status(400).json({
        error: 'Content-Type must be application/json'
      });
    }
  }
  next();
};

module.exports = {
  requestLogger,
  errorHandler,
  validateContentType
};
