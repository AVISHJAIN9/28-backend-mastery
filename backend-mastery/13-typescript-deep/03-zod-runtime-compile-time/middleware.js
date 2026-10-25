/**
 * Zod validation middleware
 * Express middleware for schema validation
 */

import { z } from 'zod';

/**
 * Generic schema validation middleware
 */
export const validateSchema = (schema, source = 'body') => {
  return (req, res, next) => {
    try {
      let data = req[source];

      // For query/params, also check req.query
      if (source === 'query') {
        data = req.query;
      } else if (source === 'params') {
        data = req.params;
      }

      const result = schema.safeParse(data);

      if (!result.success) {
        const errors = result.error.flatten();
        return res.status(400).json({
          ok: false,
          error: { message: 'Validation failed', code: 'VALIDATION_ERROR' },
          errors,
          timestamp: Date.now()
        });
      }

      // Store validated data
      req.validated = result.data;
      next();
    } catch (error) {
      next(error);
    }
  };
};

/**
 * Request logging middleware
 */
export const requestLogger = (req, res, next) => {
  const startTime = Date.now();

  console.log('[REQUEST]', {
    method: req.method,
    path: req.path,
    timestamp: new Date().toISOString()
  });

  const originalJson = res.json;
  res.json = function(data) {
    const duration = Date.now() - startTime;
    console.log('[RESPONSE]', {
      method: req.method,
      path: req.path,
      status: res.statusCode,
      duration: `${duration}ms`,
      timestamp: new Date().toISOString()
    });
    return originalJson.call(this, data);
  };

  next();
};

/**
 * Error handler
 */
export const errorHandler = (err, req, res, next) => {
  console.error('[ERROR]', {
    message: err.message,
    stack: process.env.NODE_ENV === 'development' ? err.stack : undefined
  });

  let statusCode = 500;
  let errorCode = 'INTERNAL_ERROR';
  let message = process.env.NODE_ENV === 'production' ? 'Internal error' : err.message;

  // Handle Zod validation errors
  if (err.name === 'ZodError') {
    statusCode = 400;
    errorCode = 'VALIDATION_ERROR';
    message = 'Validation failed';
  }

  res.status(statusCode).json({
    ok: false,
    error: { message, code: errorCode },
    timestamp: Date.now()
  });
};

/**
 * 404 handler
 */
export const notFoundHandler = (req, res) => {
  res.status(404).json({
    ok: false,
    error: {
      message: `Route ${req.method} ${req.path} not found`,
      code: 'NOT_FOUND'
    },
    timestamp: Date.now()
  });
};

/**
 * Conditional error middleware
 * Check condition and return error if true
 */
export const conditionalError = (condition, message, code = 'ERROR') => {
  return (req, res, next) => {
    if (condition(req)) {
      return res.status(400).json({
        ok: false,
        error: { message, code },
        timestamp: Date.now()
      });
    }
    next();
  };
};

/**
 * Response formatter
 * Ensure all responses follow consistent format
 */
export const responseFormatter = (req, res, next) => {
  const originalJson = res.json;

  res.json = function(data) {
    // Ensure ok property exists
    if (data && typeof data.ok !== 'boolean') {
      data.ok = res.statusCode >= 400 ? false : true;
    }

    // Ensure timestamp exists
    if (data && !data.timestamp) {
      data.timestamp = Date.now();
    }

    return originalJson.call(this, data);
  };

  next();
};

