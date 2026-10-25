exports.validateRefund = (req, res, next) => {
  const { chargeId, amount, reason } = req.body;

  if (!chargeId) return res.status(400).json({ error: 'ChargeId is required' });
  if (!amount || amount <= 0) return res.status(400).json({ error: 'Amount must be positive' });
  if (!reason) return res.status(400).json({ error: 'Reason is required' });

  next();
};

exports.validateChargeback = (req, res, next) => {
  const { chargeId, reason, amount } = req.body;

  if (!chargeId) return res.status(400).json({ error: 'ChargeId is required' });
  if (!reason) return res.status(400).json({ error: 'Reason is required' });
  if (!amount || amount <= 0) return res.status(400).json({ error: 'Amount must be positive' });

  const validReasons = ['fraud', 'service_not_received', 'quality_issue', 'billing_error'];
  if (!validReasons.includes(reason)) {
    return res.status(400).json({ error: `Reason must be one of: ${validReasons.join(', ')}` });
  }

  next();
};

module.exports = exports;
