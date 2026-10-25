/**
 * Module 13.5: Discriminated Unions Middleware
 */

// Validate discriminated union response
export const validateDiscriminatedUnion = (req, res, next) => {
  const originalJson = res.json;

  res.json = function(data) {
    // Ensure response follows discriminated union pattern
    if (data && typeof data === 'object') {
      if (!('ok' in data) || !('type' in data || 'error' in data || 'data' in data)) {
        console.warn('Response may not follow discriminated union pattern');
      }
    }
    return originalJson.call(this, data);
  };

  next();
};

// Validate user input
export const validateUserInput = (req, res, next) => {
  const { name, email } = req.body;

  if (!name || !email) {
    return res.status(400).json({
      type: 'error',
      ok: false,
      error: { code: 'VALIDATION_ERROR', message: 'Name and email required' }
    });
  }

  if (!email.includes('@')) {
    return res.status(400).json({
      type: 'error',
      ok: false,
      error: { code: 'VALIDATION_ERROR', message: 'Invalid email format' }
    });
  }

  next();
};

// Validate order state transitions
export const validateOrderStateTransition = (req, res, next) => {
  const { currentState, newState } = req.body;

  const validTransitions = {
    pending: ['processing', 'cancelled'],
    processing: ['shipped', 'cancelled'],
    shipped: ['delivered'],
    delivered: [],
    cancelled: []
  };

  if (validTransitions[currentState]?.includes(newState)) {
    return next();
  }

  res.status(400).json({
    type: 'error',
    ok: false,
    error: { code: 'INVALID_TRANSITION', message: 'Invalid state transition' }
  });
};

// Convert error responses to discriminated union
export const normalizeErrorResponse = (err, req, res, next) => {
  const errorResponse = {
    type: 'error',
    ok: false,
    error: {
      code: err.code || 'INTERNAL_ERROR',
      message: err.message || 'An error occurred'
    },
    timestamp: Date.now()
  };

  res.status(err.statusCode || 500).json(errorResponse);
};

// Pattern matching validator
export const validatePatternMatch = (req, res, next) => {
  const { type } = req.body;

  const validPatterns = ['pending', 'processing', 'error', 'success'];

  if (!type || !validPatterns.includes(type)) {
    return res.status(400).json({
      type: 'error',
      ok: false,
      error: {
        code: 'INVALID_PATTERN',
        message: 'Invalid discriminated union type'
      }
    });
  }

  next();
};

// Handle exhaustiveness checking simulation
export const assertExhaustiveness = (value) => {
  throw new Error('Non-exhaustive pattern match: ' + value);
};

// Logger for discriminated unions
export const logDiscriminatedUnion = (req, res, next) => {
  const originalJson = res.json;

  res.json = function(data) {
    if (data.ok) {
      console.log(`[Success] ${req.method} ${req.path}`);
    } else if (!data.ok) {
      console.log(`[Error] ${req.method} ${req.path} - ${data.error?.message}`);
    }
    return originalJson.call(this, data);
  };

  next();
};

