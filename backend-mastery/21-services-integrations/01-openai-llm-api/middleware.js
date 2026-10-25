// ==================== Custom Middleware ====================

/**
 * Validate OpenAI API key
 */
const validateOpenAIApiKey = (req, res, next) => {
  const apiKey = process.env.OPENAI_API_KEY;
  if (!apiKey) {
    return res.status(500).json({ 
      error: 'OpenAI API key not configured',
      details: 'Set OPENAI_API_KEY in .env'
    });
  }
  next();
};

/**
 * Rate limiting middleware for OpenAI requests
 * OpenAI has rate limits - log them
 */
const rateLimitLogger = (req, res, next) => {
  res.on('finish', () => {
    const remainingRequests = res.get('x-ratelimit-remaining-requests');
    const resetTime = res.get('x-ratelimit-reset-requests');
    if (remainingRequests) {
      console.log(`[OpenAI] Remaining requests: ${remainingRequests}`);
    }
    if (resetTime) {
      console.log(`[OpenAI] Rate limit reset: ${resetTime}`);
    }
  });
  next();
};

/**
 * Validate request payload against schema
 */
const validateRequest = (schema) => {
  return (req, res, next) => {
    const { error, value } = schema.validate(req.body, {
      abortEarly: false,
      stripUnknown: true,
    });

    if (error) {
      const details = error.details.map(d => ({
        field: d.path.join('.'),
        message: d.message,
      }));
      return res.status(400).json({ error: 'Validation failed', details });
    }

    req.validatedBody = value;
    next();
  };
};

/**
 * Error handler for OpenAI API errors
 */
const openaiErrorHandler = (err, req, res, next) => {
  console.error('[OpenAI Error]', err.message);

  if (err.response?.status === 401) {
    return res.status(401).json({ 
      error: 'OpenAI authentication failed',
      details: 'Invalid or expired API key'
    });
  }

  if (err.response?.status === 429) {
    return res.status(429).json({ 
      error: 'Rate limit exceeded',
      details: 'Too many requests to OpenAI API',
      retryAfter: err.response.headers['retry-after']
    });
  }

  if (err.response?.status === 500) {
    return res.status(502).json({ 
      error: 'OpenAI service unavailable',
      details: 'OpenAI API is temporarily down'
    });
  }

  res.status(500).json({ 
    error: 'Internal server error',
    details: err.message
  });
};

module.exports = {
  validateOpenAIApiKey,
  rateLimitLogger,
  validateRequest,
  openaiErrorHandler,
};
