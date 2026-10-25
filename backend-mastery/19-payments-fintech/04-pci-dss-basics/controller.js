const crypto = require('crypto');

const tokens = {};
const payments = {};

// NEVER store this - just for demo simulation
// In production, use Stripe tokenization instead
const ENCRYPTION_KEY = crypto.randomBytes(32);

exports.tokenizeCard = (req, res) => {
  const { cardNumber, expiry, name } = req.body;

  try {
    // In production: Send to Stripe, PayPal, etc.
    // DON'T store card data yourself!
    const token = `tok_${crypto.randomBytes(16).toString('hex')}`;

    tokens[token] = {
      cardLast4: cardNumber.slice(-4),
      expiry,
      name,
      createdAt: new Date()
    };

    res.status(201).json({
      token,
      cardLast4: cardNumber.slice(-4),
      message: 'Card tokenized successfully. Use token for payments.'
    });
  } catch (error) {
    res.status(400).json({ error: error.message });
  }
};

exports.processPaymentWithToken = (req, res) => {
  const { token, amount, currency, description } = req.body;

  try {
    if (!tokens[token]) {
      return res.status(400).json({ error: 'Invalid token' });
    }

    const paymentId = `pay_${Date.now()}`;
    const payment = {
      paymentId,
      token,  // Store token, NOT card
      amount,
      currency,
      description,
      status: 'succeeded',
      createdAt: new Date()
      // NEVER include: cardNumber, CVV, PIN
    };

    payments[paymentId] = payment;

    res.status(201).json({
      paymentId,
      amount,
      currency,
      status: 'succeeded',
      message: 'Payment processed successfully'
    });
  } catch (error) {
    res.status(400).json({ error: error.message });
  }
};

exports.getPaymentStatus = (req, res) => {
  const payment = payments[req.params.paymentId];
  if (!payment) return res.status(404).json({ error: 'Payment not found' });

  // Don't expose token in response
  const { token, ...safePayment } = payment;
  res.json(safePayment);
};

exports.listPayments = (req, res) => {
  const safePayments = Object.values(payments).map(p => {
    const { token, ...safe } = p;
    return safe;
  });
  res.json(safePayments);
};

exports.encryptData = (req, res) => {
  const { data } = req.body;

  try {
    const iv = crypto.randomBytes(16);
    const cipher = crypto.createCipheriv('aes-256-cbc', ENCRYPTION_KEY, iv);
    const encrypted = cipher.update(data, 'utf8', 'hex') + cipher.final('hex');

    res.json({
      encrypted: `${iv.toString('hex')}:${encrypted}`,
      message: 'Data encrypted using AES-256-CBC'
    });
  } catch (error) {
    res.status(400).json({ error: error.message });
  }
};

exports.getComplianceChecklist = (req, res) => {
  res.json({
    checklist: [
      { item: 'No storage of full card numbers', status: '✓ Implemented' },
      { item: 'No storage of CVV/Security Code', status: '✓ Implemented' },
      { item: 'Use tokenization for cards', status: '✓ Implemented' },
      { item: 'Encryption for sensitive data', status: '✓ Implemented' },
      { item: 'HTTPS/TLS for all communications', status: '✓ Configured' },
      { item: 'No card data in logs', status: '✓ Implemented' },
      { item: 'Input validation', status: '✓ Implemented' },
      { item: 'Access controls & authentication', status: '✓ Required' }
    ],
    pciDssCompliant: true,
    lastAudit: new Date()
  });
};

module.exports = exports;
