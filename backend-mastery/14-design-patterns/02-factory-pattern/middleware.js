const { validateInputData } = require('./schema');

// ==================== Validation Middleware ====================

const validateVehicleCreation = (req, res, next) => {
  const { error, value } = validateInputData(req.body, 'vehicle');
  
  if (error) {
    return res.status(400).json({
      success: false,
      error: 'Validation failed',
      details: error.details.map(detail => detail.message)
    });
  }
  
  req.validated = value;
  next();
};

const validateNotificationSend = (req, res, next) => {
  const { error, value } = validateInputData(req.body, 'notification');
  
  if (error) {
    return res.status(400).json({
      success: false,
      error: 'Validation failed',
      details: error.details.map(detail => detail.message)
    });
  }
  
  req.validated = value;
  next();
};

const validateLoggerCreation = (req, res, next) => {
  const { error, value } = validateInputData(req.body, 'logger');
  
  if (error) {
    return res.status(400).json({
      success: false,
      error: 'Validation failed',
      details: error.details.map(detail => detail.message)
    });
  }
  
  req.validated = value;
  next();
};

// ==================== Error Handling Middleware ====================

const errorHandler = (error, req, res, next) => {
  console.error('Error:', error.message);
  
  // Handle factory errors
  if (error.message.includes('Unknown') || error.message.includes('Failed')) {
    return res.status(400).json({
      success: false,
      error: error.message
    });
  }

  // Generic error
  return res.status(500).json({
    success: false,
    error: 'Internal server error',
    message: process.env.NODE_ENV === 'development' ? error.message : undefined
  });
};

// ==================== Request Logger ====================

const requestLogger = (req, res, next) => {
  const start = Date.now();
  
  res.on('finish', () => {
    const duration = Date.now() - start;
    console.log(`[${new Date().toISOString()}] ${req.method} ${req.path} - ${res.statusCode} (${duration}ms)`);
  });
  
  next();
};

module.exports = {
  validateVehicleCreation,
  validateNotificationSend,
  validateLoggerCreation,
  errorHandler,
  requestLogger
};
