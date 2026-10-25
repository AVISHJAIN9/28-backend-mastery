
const { validateInputData } = require('./schema');

const validateInput = (req, res, next) => {
  const { error, value } = validateInputData(req.body);
  if (error) {
    return res.status(400).json({
      success: false,
      error: 'Validation failed',
      details: error.details.map(d => d.message)
    });
  }
  req.validated = value;
  next();
};

const requestLogger = (req, res, next) => {
  const start = Date.now();
  res.on('finish', () => {
    const duration = Date.now() - start;
    console.log('[' + new Date().toISOString() + '] ' + req.method + ' ' + req.path + ' - ' + res.statusCode + ' (' + duration + 'ms)');
  });
  next();
};

const errorHandler = (error, req, res, next) => {
  console.error('Error:', error.message);
  res.status(error.status || 500).json({
    success: false,
    error: error.message || 'Internal server error'
  });
};

module.exports = {
  validateInput,
  requestLogger,
  errorHandler
};
