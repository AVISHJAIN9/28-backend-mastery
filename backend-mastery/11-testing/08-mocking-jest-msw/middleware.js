const errorHandler = (err, req, res, next) => {
  console.error(err.message);
  res.status(500).json({ error: 'Internal server error' });
};

const requestLogger = (req, res, next) => {
  console.log(`${req.method} ${req.path}`);
  next();
};

module.exports = { errorHandler, requestLogger };

