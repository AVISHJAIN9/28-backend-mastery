const crypto = require('crypto');

const payments = {};
const idempotencyLog = {};

exports.processPayment = async (req, res) => {
  const { amount, currency, customerId } = req.body;
  const idempotencyKey = req.headers['idempotency-key'];

  try {
    // Check if payment already processed
    if (idempotencyLog[idempotencyKey]) {
      const cached = idempotencyLog[idempotencyKey];
      console.log(`Payment with idempotency key ${idempotencyKey} already processed`);
      return res.status(cached.statusCode).json(cached.response);
    }

    // Create new payment
    const paymentId = `pay_${Date.now()}`;
    const payment = {
      paymentId,
      amount,
      currency,
      customerId,
      status: 'succeeded',
      createdAt: new Date()
    };

    payments[paymentId] = payment;

    // Store in idempotency log
    idempotencyLog[idempotencyKey] = {
      statusCode: 201,
      response: payment,
      createdAt: new Date(),
      expiresAt: new Date(Date.now() + 24 * 60 * 60 * 1000)
    };

    res.status(201).json(payment);
  } catch (error) {
    res.status(400).json({ error: error.message });
  }
};

exports.getPayment = (req, res) => {
  const payment = payments[req.params.paymentId];
  if (!payment) {
    return res.status(404).json({ error: 'Payment not found' });
  }
  res.json(payment);
};

exports.listPayments = (req, res) => {
  res.json(Object.values(payments));
};

exports.getIdempotencyLog = (req, res) => {
  const key = req.params.key;
  const entry = idempotencyLog[key];
  if (!entry) {
    return res.status(404).json({ error: 'Idempotency key not found' });
  }
  res.json({ key, ...entry });
};

exports.retryPayment = async (req, res) => {
  const { paymentId } = req.params;
  const idempotencyKey = req.headers['idempotency-key'];

  try {
    const payment = payments[paymentId];
    if (!payment) {
      return res.status(404).json({ error: 'Payment not found' });
    }

    // Use same idempotency key for retry
    if (idempotencyLog[idempotencyKey]) {
      const cached = idempotencyLog[idempotencyKey];
      return res.status(cached.statusCode).json(cached.response);
    }

    // Process retry
    payment.status = 'retried';
    idempotencyLog[idempotencyKey] = {
      statusCode: 200,
      response: payment,
      createdAt: new Date()
    };

    res.json(payment);
  } catch (error) {
    res.status(400).json({ error: error.message });
  }
};

module.exports = exports;
