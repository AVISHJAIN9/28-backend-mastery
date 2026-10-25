const Joi = require('joi');

// Check admin authorization
exports.requireAdmin = (req, res, next) => {
  if (!req.user || req.user.role !== 'admin') {
    return res.status(403).json({ error: 'Admin access required' });
  }
  next();
};

// Audit logging middleware
exports.auditLog = (action) => {
  return (req, res, next) => {
    const originalSend = res.send;
    res.send = function(data) {
      console.log(`[AUDIT] ${action} by ${req.user?.id} at ${new Date().toISOString()}`);
      res.send = originalSend;
      return res.send(data);
    };
    next();
  };
};

/**
 * Validate request body
 */
exports.validateBody = (req, res, next) => {
  if (!req.body || Object.keys(req.body).length === 0) {
    return res.status(400).json({ error: 'Request body required' });
  }
  next();
};

/**
 * Validate query parameters
 */
exports.validateQuery = (req, res, next) => {
  const { page, limit } = req.query;
  
  if (page && isNaN(parseInt(page))) {
    return res.status(400).json({ error: 'page must be a number' });
  }
  if (limit && isNaN(parseInt(limit))) {
    return res.status(400).json({ error: 'limit must be a number' });
  }
  
  next();
};

/**
 * Error handling middleware
 */
exports.errorHandler = (err, req, res, next) => {
  console.error('Error:', err);
  res.status(err.status || 500).json({
    error: err.message || 'Internal server error'
  });
};
