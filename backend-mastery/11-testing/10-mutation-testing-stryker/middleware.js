const errorHandler = (err, req, res, next) => {
  res.status(500).json({ error: 'Internal server error' });
};

const requestLogger = (req, res, next) => {
  console.log(`[${new Date().toISOString()}] ${req.method} ${req.path}`);
  next();
};

module.exports = { errorHandler, requestLogger };

