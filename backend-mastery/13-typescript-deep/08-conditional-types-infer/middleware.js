/**
 * Module 13.8: Conditional Types & Infer Middleware
 */

// Validate conditional type schema
export const validateConditionalSchema = (req, res, next) => {
  const { data, schema } = req.body;

  if (!schema || typeof schema !== 'object') {
    return res.status(400).json({
      ok: false,
      error: 'Schema is required and must be an object'
    });
  }

  if (!data || typeof data !== 'object') {
    return res.status(400).json({
      ok: false,
      error: 'Data is required for validation'
    });
  }

  next();
};

// Response format switching middleware (conditional)
export const switchResponseFormat = (req, res, next) => {
  const format = req.query.format || 'detailed';

  const originalJson = res.json;

  res.json = function(data) {
    if (data.data) {
      // Conditional: Array vs Single object
      if (Array.isArray(data.data)) {
        if (format === 'compact') {
          data.data = data.data.map(item => ({ id: item.id, name: item.name }));
        } else if (format === 'public') {
          data.data = data.data.map(item => {
            const { password, ...rest } = item;
            return rest;
          });
        }
      } else if (typeof data.data === 'object') {
        if (format === 'compact') {
          data.data = { id: data.data.id, name: data.data.name };
        } else if (format === 'public') {
          const { password, ...rest } = data.data;
          data.data = rest;
        }
      }
    }

    return originalJson.call(this, data);
  };

  next();
};

// Type guard middleware
export const validateTypeGuards = (req, res, next) => {
  const { value, expectedType } = req.body;

  if (!expectedType) {
    return res.status(400).json({
      ok: false,
      error: 'expectedType is required'
    });
  }

  if (!value && value !== 0) {
    return res.status(400).json({
      ok: false,
      error: 'value is required for type guard validation'
    });
  }

  next();
};

// Inferred type validation middleware
export const validateInferredType = (req, res, next) => {
  const { value } = req.body;

  // Store inferred information on request
  if (Array.isArray(value)) {
    req.inferredType = 'array';
    req.elementType = value.length > 0 ? typeof value[0] : 'unknown';
  } else if (value instanceof Promise) {
    req.inferredType = 'promise';
  } else if (typeof value === 'object' && value !== null) {
    req.inferredType = 'object';
    req.objectKeys = Object.keys(value);
  } else {
    req.inferredType = typeof value;
  }

  next();
};

// Conditional validation based on type
export const conditionalValidation = (req, res, next) => {
  const { type, data } = req.body;

  // Different validation rules based on discriminated type
  switch (type) {
    case 'user':
      if (!data.email || !data.name) {
        return res.status(400).json({
          ok: false,
          error: 'User must have email and name'
        });
      }
      break;

    case 'array':
      if (!Array.isArray(data)) {
        return res.status(400).json({
          ok: false,
          error: 'Data must be an array'
        });
      }
      break;

    case 'object':
      if (!data || typeof data !== 'object' || Array.isArray(data)) {
        return res.status(400).json({
          ok: false,
          error: 'Data must be an object'
        });
      }
      break;
  }

  next();
};

// Unwrap nested type middleware
export const unwrapNestedTypes = (req, res, next) => {
  const originalJson = res.json;

  res.json = function(data) {
    if (data.data) {
      // Unwrap Promise-like responses
      if (data.data.promise) {
        data.data.resolved = true;
      }

      // Unwrap Array - extract element
      if (Array.isArray(data.data) && data.data.length > 0) {
        data.elementType = typeof data.data[0];
      }

      // Unwrap nested objects
      if (data.data.value !== undefined) {
        data.unwrapped = data.data.value;
      }
    }

    return originalJson.call(this, data);
  };

  next();
};

// Pattern exhaustiveness checking
export const checkExhaustiveness = (validPatterns) => {
  return (req, res, next) => {
    const { type } = req.body;

    if (!validPatterns.includes(type)) {
      return res.status(400).json({
        ok: false,
        error: 'Invalid pattern type',
        valid: validPatterns,
        received: type,
        message: 'Non-exhaustive pattern match'
      });
    }

    next();
  };
};

// Error handler for conditional type errors
export const handleConditionalTypeErrors = (err, req, res, next) => {
  if (err.message && err.message.includes('exhaustive')) {
    return res.status(400).json({
      ok: false,
      error: err.message,
      type: 'ExhaustivenessError'
    });
  }

  if (err.message && err.message.includes('type')) {
    return res.status(400).json({
      ok: false,
      error: err.message,
      type: 'TypeError'
    });
  }

  res.status(500).json({
    ok: false,
    error: err.message || 'Internal server error'
  });
};

// Logging middleware for conditional operations
export const logConditionalOperation = (req, res, next) => {
  const originalJson = res.json;

  res.json = function(data) {
    if (req.inferredType) {
      console.log(`[Inferred] ${req.inferredType} at ${req.method} ${req.path}`);
    }
    if (data.pattern) {
      console.log(`[Conditional] ${data.pattern}`);
    }
    return originalJson.call(this, data);
  };

  next();
};
