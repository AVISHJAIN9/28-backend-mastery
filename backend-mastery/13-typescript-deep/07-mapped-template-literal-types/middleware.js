/**
 * Module 13.7: Mapped & Template Literal Types Middleware
 */

// Middleware for response format transformation (mapped types)
export const formatResponseData = (format) => {
  return (req, res, next) => {
    const originalJson = res.json;

    res.json = function(data) {
      if (data.data && format) {
        // Apply format transformation
        if (format === 'compact' && Array.isArray(data.data)) {
          data.data = data.data.map(item => ({ id: item.id, name: item.name }));
        } else if (format === 'public') {
          // Hide sensitive fields
          if (Array.isArray(data.data)) {
            data.data = data.data.map(item => {
              const { password, ...safe } = item;
              return safe;
            });
          }
        }
      }
      return originalJson.call(this, data);
    };

    next();
  };
};

// Validate mapped type transformation
export const validateMappedTypeTransform = (req, res, next) => {
  const { object, operation, fields } = req.body;

  if (!object || typeof object !== 'object') {
    return res.status(400).json({
      ok: false,
      error: 'Invalid object for transformation'
    });
  }

  if (!operation || !['pick', 'omit', 'readonly', 'partial'].includes(operation)) {
    return res.status(400).json({
      ok: false,
      error: 'Invalid operation'
    });
  }

  if ((operation === 'pick' || operation === 'omit') && (!fields || !Array.isArray(fields))) {
    return res.status(400).json({
      ok: false,
      error: 'Fields are required for this operation'
    });
  }

  next();
};

// Event emission middleware
export const validateEventEmission = (req, res, next) => {
  const { event, data } = req.body;

  // Template literal event pattern validation
  const eventPattern = /^(user|post|order):(created|updated|deleted|activated|deactivated)$/;

  if (!event || !eventPattern.test(event)) {
    return res.status(400).json({
      ok: false,
      error: 'Invalid event format',
      expectedFormat: 'resource:(action)',
      validActions: ['created', 'updated', 'deleted', 'activated', 'deactivated']
    });
  }

  next();
};

// State management middleware (mapped loading states)
export const trackOperationState = (operation) => {
  return (req, res, next) => {
    const startTime = Date.now();
    const originalJson = res.json;

    res.json = function(data) {
      const duration = Date.now() - startTime;

      // Add state information
      if (data) {
        data.state = {
          operation,
          loading: false,
          duration,
          timestamp: Date.now()
        };
      }

      return originalJson.call(this, data);
    };

    next();
  };
};

// Request query validation for format string literal
export const validateFormatQuery = (req, res, next) => {
  const format = req.query.format;

  const validFormats = ['compact', 'detailed', 'public'];

  if (format && !validFormats.includes(format)) {
    return res.status(400).json({
      ok: false,
      error: 'Invalid format',
      valid: validFormats,
      received: format
    });
  }

  next();
};

// Column mapping validation
export const validateColumnMapping = (req, res, next) => {
  const { dbRecord, apiRecord } = req.body;

  if (!dbRecord || typeof dbRecord !== 'object') {
    return res.status(400).json({
      ok: false,
      error: 'dbRecord must be an object'
    });
  }

  next();
};

// Error handler for mapped type operations
export const handleMappedTypeErrors = (err, req, res, next) => {
  if (err.message && err.message.includes('mapping')) {
    return res.status(400).json({
      ok: false,
      error: err.message,
      pattern: 'Mapped type error'
    });
  }

  res.status(500).json({
    ok: false,
    error: err.message || 'Internal server error'
  });
};

// Logging middleware for mapped operations
export const logMappedOperation = (req, res, next) => {
  const originalJson = res.json;

  res.json = function(data) {
    if (data.pattern) {
      console.log(`[Mapped Type] ${data.pattern} - ${req.method} ${req.path}`);
    }
    return originalJson.call(this, data);
  };

  next();
};
