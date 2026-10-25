const stripe = require('stripe')(process.env.STRIPE_SECRET_KEY);

// ==================== Webhook Signature Verification ====================

/**
 * Verify Stripe webhook signature
 * Required for security - ensures webhook is from Stripe
 */
const verifyStripeSignature = (req, res, next) => {
  const sig = req.headers['stripe-signature'];
  const webhookSecret = process.env.STRIPE_WEBHOOK_SECRET;

  if (!webhookSecret) {
    return res.status(500).json({
      error: 'Stripe webhook secret not configured',
      details: 'Set STRIPE_WEBHOOK_SECRET in .env'
    });
  }

  try {
    req.event = stripe.webhooks.constructEvent(
      req.rawBody || req.body,
      sig,
      webhookSecret
    );
    next();
  } catch (error) {
    console.error('Webhook signature verification failed:', error.message);
    return res.status(400).json({
      error: 'Webhook signature verification failed',
      details: error.message
    });
  }
};

// ==================== Validate Request ====================

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

// ==================== Stripe API Key Validation ====================

const validateStripeApiKey = (req, res, next) => {
  if (!process.env.STRIPE_SECRET_KEY) {
    return res.status(500).json({
      error: 'Stripe API key not configured',
      details: 'Set STRIPE_SECRET_KEY in .env'
    });
  }
  next();
};

// ==================== Error Handler ====================

const stripeErrorHandler = (err, req, res, next) => {
  console.error('[Stripe Error]', err.message);

  // Stripe-specific errors
  if (err.type === 'StripeCardError') {
    return res.status(400).json({
      error: 'Card declined',
      details: err.message,
      code: err.code
    });
  }

  if (err.type === 'StripeRateLimitError') {
    return res.status(429).json({
      error: 'Too many requests',
      details: 'Stripe rate limit exceeded'
    });
  }

  if (err.type === 'StripeInvalidRequestError') {
    return res.status(400).json({
      error: 'Invalid request',
      details: err.message,
      param: err.param
    });
  }

  if (err.type === 'StripeAuthenticationError') {
    return res.status(401).json({
      error: 'Authentication failed',
      details: 'Invalid Stripe API key'
    });
  }

  // Generic error
  res.status(500).json({
    error: 'Internal server error',
    details: process.env.NODE_ENV === 'development' ? err.message : 'An error occurred'
  });
};

module.exports = {
  verifyStripeSignature,
  validateRequest,
  validateStripeApiKey,
  stripeErrorHandler,
};
