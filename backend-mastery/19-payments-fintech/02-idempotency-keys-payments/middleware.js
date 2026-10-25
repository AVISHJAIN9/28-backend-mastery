const crypto = require('crypto');

exports.validateIdempotencyKey = (req, res, next) => {
  const idempotencyKey = req.headers['idempotency-key'];

  if (!idempotencyKey) {
    return res.status(400).json({ error: 'Idempotency-Key header is required' });
  }

  // Validate key format (UUID or similar)
  const uuidRegex = /^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/i;
  if (!uuidRegex.test(idempotencyKey)) {
    return res.status(400).json({ error: 'Invalid Idempotency-Key format. Use UUID v4.' });
  }

  next();
};

exports.validatePaymentInput = (req, res, next) => {
  const { amount, currency, customerId } = req.body;

  if (!amount || amount <= 0) {
    return res.status(400).json({ error: 'Amount must be positive' });
  }

  if (!currency || currency.length !== 3) {
    return res.status(400).json({ error: 'Currency must be 3-letter code' });
  }

  if (!customerId) {
    return res.status(400).json({ error: 'CustomerId is required' });
  }

  next();
};

module.exports = exports;
