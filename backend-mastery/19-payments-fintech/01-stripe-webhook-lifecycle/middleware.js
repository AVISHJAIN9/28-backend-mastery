const stripe = require('stripe')(process.env.STRIPE_SECRET_KEY);

// ==================== Webhook Signature Verification ====================

exports.verifyStripeSignature = (req, res, next) => {
  const sig = req.headers['stripe-signature'];
  const secret = process.env.STRIPE_WEBHOOK_SECRET;

  if (!sig || !secret) {
    return res.status(400).json({ error: 'Missing signature or webhook secret' });
  }

  try {
    // Construct the event using Stripe's verification
    const event = stripe.webhooks.constructEvent(
      req.body,
      sig,
      secret
    );

    // Attach verified event to request
    req.event = event;
    next();
  } catch (err) {
    console.error('Webhook signature verification failed:', err.message);
    return res.status(400).json({ error: `Webhook Error: ${err.message}` });
  }
};

// ==================== Input Validation ====================

exports.validateOrderInput = (req, res, next) => {
  const { amount, description, customerId } = req.body;

  // Validate amount
  if (!amount || amount <= 0) {
    return res.status(400).json({ error: 'Amount must be a positive number' });
  }

  // Validate description
  if (!description || description.length === 0) {
    return res.status(400).json({ error: 'Description is required' });
  }

  if (description.length > 500) {
    return res.status(400).json({ error: 'Description must be less than 500 characters' });
  }

  // Validate customerId
  if (!customerId || customerId.length === 0) {
    return res.status(400).json({ error: 'CustomerId is required' });
  }

  next();
};

exports.validatePaymentInput = (req, res, next) => {
  const { amount, currency, description, customerId } = req.body;

  // Validate amount
  if (!amount || amount <= 0 || amount > 999999) {
    return res.status(400).json({ error: 'Amount must be between 1 and 999999' });
  }

  // Validate currency
  const validCurrencies = ['usd', 'eur', 'gbp', 'inr'];
  if (!currency || !validCurrencies.includes(currency.toLowerCase())) {
    return res.status(400).json({ error: `Currency must be one of: ${validCurrencies.join(', ')}` });
  }

  // Validate description
  if (description && description.length > 500) {
    return res.status(400).json({ error: 'Description must be less than 500 characters' });
  }

  // Validate customerId
  if (!customerId || customerId.length === 0) {
    return res.status(400).json({ error: 'CustomerId is required' });
  }

  next();
};

// ==================== Error Handler ====================

exports.errorHandler = (err, req, res, next) => {
  console.error('Error:', err.message);
  res.status(err.status || 500).json({
    error: err.message || 'Internal server error',
    status: err.status || 500
  });
};

// ==================== Request Logging ====================

exports.requestLogger = (req, res, next) => {
  const start = Date.now();
  
  res.on('finish', () => {
    const duration = Date.now() - start;
    console.log(`${req.method} ${req.path} - ${res.statusCode} (${duration}ms)`);
  });

  next();
};

module.exports = exports;
