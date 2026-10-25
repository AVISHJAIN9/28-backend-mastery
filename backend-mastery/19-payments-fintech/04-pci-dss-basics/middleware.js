const cardRegex = /^\d{13,19}$/;
const expiryRegex = /^(0[1-9]|1[0-2])\/\d{2}$/;

exports.validateCardInput = (req, res, next) => {
  const { cardNumber, expiry, name } = req.body;

  if (!cardNumber || !cardRegex.test(cardNumber.replace(/\s/g, ''))) {
    return res.status(400).json({ error: 'Invalid card number' });
  }

  if (!expiry || !expiryRegex.test(expiry)) {
    return res.status(400).json({ error: 'Invalid expiry format (MM/YY)' });
  }

  if (!name || name.length < 2) {
    return res.status(400).json({ error: 'Invalid cardholder name' });
  }

  // Log only for audit (not card data!)
  console.log(`Card tokenization request from ${req.ip}`);

  next();
};

exports.validateTokenInput = (req, res, next) => {
  const { token, amount, currency } = req.body;

  if (!token || !token.startsWith('tok_')) {
    return res.status(400).json({ error: 'Invalid token' });
  }

  if (!amount || amount <= 0) {
    return res.status(400).json({ error: 'Invalid amount' });
  }

  if (!currency || currency.length !== 3) {
    return res.status(400).json({ error: 'Invalid currency' });
  }

  next();
};

exports.validateDataInput = (req, res, next) => {
  const { data } = req.body;

  if (!data || typeof data !== 'string') {
    return res.status(400).json({ error: 'Data must be a string' });
  }

  // Never encrypt card numbers
  if (/\d{13,19}/.test(data)) {
    return res.status(400).json({ error: 'Cannot encrypt card data directly. Use tokenization.' });
  }

  next();
};

module.exports = exports;
