const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;

exports.validateSeller = (req, res, next) => {
  const { email, firstName, lastName, businessName } = req.body;

  if (!emailRegex.test(email)) return res.status(400).json({ error: 'Invalid email' });
  if (!firstName || firstName.length < 2) return res.status(400).json({ error: 'Invalid first name' });
  if (!lastName || lastName.length < 2) return res.status(400).json({ error: 'Invalid last name' });
  if (!businessName || businessName.length < 3) return res.status(400).json({ error: 'Invalid business name' });

  next();
};

exports.validateCharge = (req, res, next) => {
  const { amount, sellerId, customerId, description } = req.body;

  if (!amount || amount <= 0) return res.status(400).json({ error: 'Invalid amount' });
  if (!sellerId) return res.status(400).json({ error: 'SellerId is required' });
  if (!customerId) return res.status(400).json({ error: 'CustomerId is required' });
  if (!description) return res.status(400).json({ error: 'Description is required' });

  next();
};

exports.validateTransfer = (req, res, next) => {
  const { sellerId, amount, description } = req.body;

  if (!sellerId) return res.status(400).json({ error: 'SellerId is required' });
  if (!amount || amount <= 0) return res.status(400).json({ error: 'Invalid amount' });
  if (!description) return res.status(400).json({ error: 'Description is required' });

  next();
};

exports.validateDispute = (req, res, next) => {
  const { chargeId, reason, amount } = req.body;

  if (!chargeId) return res.status(400).json({ error: 'ChargeId is required' });
  if (!reason) return res.status(400).json({ error: 'Reason is required' });
  if (!amount || amount <= 0) return res.status(400).json({ error: 'Invalid amount' });

  next();
};

module.exports = exports;
