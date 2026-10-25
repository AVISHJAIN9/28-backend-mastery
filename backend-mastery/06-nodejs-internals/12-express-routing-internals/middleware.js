/**
 * Express Routing Internals - Middleware
 */

const requestLogger = (req, res, next) => {
  const start = Date.now();
  console.log(`[${new Date().toISOString()}] ${req.method} ${req.path}`);
  res.on('finish', () => console.log(`${res.statusCode} (${Date.now() - start}ms)`));
  next();
};

const errorHandler = (err, req, res, next) => {
  console.error('❌ Error:', err.message);
  res.status(500).json({ error: err.message, timestamp: new Date().toISOString() });
};

const bodyParser = (req, res, next) => {
  if (req.method === 'POST' || req.method === 'PUT') {
    let body = '';
    req.on('data', (chunk) => {
      body += chunk.toString();
    });
    req.on('end', () => {
      try {
        req.body = JSON.parse(body);
      } catch (e) {
        req.body = {};
      }
      next();
    });
  } else {
    req.body = {};
    next();
  }
};

module.exports = {
  requestLogger,
  errorHandler,
  bodyParser,
};
