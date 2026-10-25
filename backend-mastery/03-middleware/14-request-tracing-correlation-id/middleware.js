const { v4: uuidv4 } = require('uuid');

const tracingMiddleware = (req, res, next) => {
  req.correlationId = req.headers['x-correlation-id'] || uuidv4();
  req.requestStart = Date.now();
  res.set('X-Correlation-ID', req.correlationId);
  next();
};

module.exports = { tracingMiddleware };
