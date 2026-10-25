const VALID_PLANS = ['starter', 'professional', 'enterprise'];

exports.validateSubscription = (req, res, next) => {
  const { planId, customerId } = req.body;

  if (!VALID_PLANS.includes(planId)) {
    return res.status(400).json({ error: `Plan must be one of: ${VALID_PLANS.join(', ')}` });
  }

  if (!customerId) {
    return res.status(400).json({ error: 'CustomerId is required' });
  }

  next();
};

exports.validatePlanChange = (req, res, next) => {
  const { newPlanId } = req.body;

  if (!VALID_PLANS.includes(newPlanId)) {
    return res.status(400).json({ error: `Plan must be one of: ${VALID_PLANS.join(', ')}` });
  }

  next();
};

module.exports = exports;
