const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
const phoneRegex = /^\d{10}$/;

exports.validateRazorpayOrder = (req, res, next) => {
  const { amount, currency, description } = req.body;

  if (!amount || amount <= 0 || amount > 10000000) {
    return res.status(400).json({ error: 'Amount must be between 1 and 10000000' });
  }

  if (currency && currency !== 'INR' && currency !== 'USD') {
    return res.status(400).json({ error: 'Currency must be INR or USD' });
  }

  if (!description || description.length < 3) {
    return res.status(400).json({ error: 'Description is required (min 3 chars)' });
  }

  next();
};

exports.validatePayUPayment = (req, res, next) => {
  const { amount, email, phone, name } = req.body;

  if (!amount || amount <= 0) {
    return res.status(400).json({ error: 'Invalid amount' });
  }

  if (!emailRegex.test(email)) {
    return res.status(400).json({ error: 'Invalid email' });
  }

  if (!phoneRegex.test(phone.replace(/\D/g, ''))) {
    return res.status(400).json({ error: 'Invalid phone number (10 digits required)' });
  }

  if (!name || name.length < 2) {
    return res.status(400).json({ error: 'Invalid name' });
  }

  next();
};

module.exports = exports;
