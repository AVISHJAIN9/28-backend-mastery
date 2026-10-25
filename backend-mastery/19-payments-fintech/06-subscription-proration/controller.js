const subscriptions = {};
const proratedTransactions = {};

const PLANS = {
  starter: { price: 99, name: 'Starter' },
  professional: { price: 199, name: 'Professional' },
  enterprise: { price: 499, name: 'Enterprise' }
};

exports.createSubscription = (req, res) => {
  const { planId, customerId } = req.body;

  try {
    const subscriptionId = `sub_${Date.now()}`;
    const plan = PLANS[planId];
    if (!plan) return res.status(400).json({ error: 'Plan not found' });

    const subscription = {
      subscriptionId,
      planId,
      customerId,
      status: 'active',
      currentPeriodStart: new Date(),
      currentPeriodEnd: new Date(Date.now() + 30 * 24 * 60 * 60 * 1000),
      createdAt: new Date()
    };

    subscriptions[subscriptionId] = subscription;
    res.status(201).json(subscription);
  } catch (error) {
    res.status(400).json({ error: error.message });
  }
};

exports.getSubscription = (req, res) => {
  const sub = subscriptions[req.params.subscriptionId];
  if (!sub) return res.status(404).json({ error: 'Subscription not found' });
  res.json(sub);
};

exports.upgradeSubscription = (req, res) => {
  const { subscriptionId } = req.params;
  const { newPlanId } = req.body;
  const effectiveDate = new Date();

  try {
    const sub = subscriptions[subscriptionId];
    if (!sub) return res.status(404).json({ error: 'Subscription not found' });

    const oldPlan = PLANS[sub.planId];
    const newPlan = PLANS[newPlanId];
    if (!newPlan) return res.status(400).json({ error: 'New plan not found' });

    // Calculate proration
    const billingStart = new Date(sub.currentPeriodStart);
    const billingEnd = new Date(sub.currentPeriodEnd);
    const totalDays = Math.floor((billingEnd - billingStart) / (1000 * 60 * 60 * 24));
    const daysUsed = Math.floor((effectiveDate - billingStart) / (1000 * 60 * 60 * 24));
    const daysRemaining = totalDays - daysUsed;

    const oldDailyRate = oldPlan.price / totalDays;
    const newDailyRate = newPlan.price / totalDays;
    const creditAmount = Math.floor(oldDailyRate * daysRemaining);
    const chargeAmount = Math.floor(newDailyRate * daysRemaining);
    const netAmount = chargeAmount - creditAmount;

    const transaction = {
      transactionId: `proration_${Date.now()}`,
      subscriptionId,
      type: 'upgrade',
      fromPlan: sub.planId,
      toPlan: newPlanId,
      creditAmount,
      chargeAmount,
      netAmount
    };

    proratedTransactions[transaction.transactionId] = transaction;
    sub.planId = newPlanId;
    sub.currentPeriodStart = effectiveDate;

    res.json({ subscription: sub, proration: transaction });
  } catch (error) {
    res.status(400).json({ error: error.message });
  }
};

exports.downgradeSubscription = (req, res) => {
  // Similar to upgrade but creates credit
  const { subscriptionId } = req.params;
  const { newPlanId } = req.body;

  try {
    const sub = subscriptions[subscriptionId];
    if (!sub) return res.status(404).json({ error: 'Subscription not found' });

    sub.planId = newPlanId;
    res.json({ subscription: sub, message: 'Downgrade processed' });
  } catch (error) {
    res.status(400).json({ error: error.message });
  }
};

exports.cancelSubscription = (req, res) => {
  const { subscriptionId } = req.params;

  try {
    const sub = subscriptions[subscriptionId];
    if (!sub) return res.status(404).json({ error: 'Subscription not found' });

    sub.status = 'canceled';
    sub.canceledAt = new Date();
    res.json({ subscription: sub, message: 'Subscription canceled' });
  } catch (error) {
    res.status(400).json({ error: error.message });
  }
};

exports.calculateProration = (req, res) => {
  const { subscriptionId } = req.params;
  const { newPlanId } = req.body;

  try {
    const sub = subscriptions[subscriptionId];
    if (!sub) return res.status(404).json({ error: 'Subscription not found' });

    const oldPlan = PLANS[sub.planId];
    const newPlan = PLANS[newPlanId];

    const billingStart = new Date(sub.currentPeriodStart);
    const billingEnd = new Date(sub.currentPeriodEnd);
    const totalDays = Math.floor((billingEnd - billingStart) / (1000 * 60 * 60 * 24));
    const daysUsed = Math.floor((new Date() - billingStart) / (1000 * 60 * 60 * 24));
    const daysRemaining = totalDays - daysUsed;

    const oldDailyRate = oldPlan.price / totalDays;
    const newDailyRate = newPlan.price / totalDays;
    const creditAmount = Math.floor(oldDailyRate * daysRemaining);
    const chargeAmount = Math.floor(newDailyRate * daysRemaining);
    const netAmount = chargeAmount - creditAmount;

    res.json({
      currentPlan: sub.planId,
      newPlan: newPlanId,
      daysRemaining,
      creditAmount: `$${creditAmount / 100}`,
      chargeAmount: `$${chargeAmount / 100}`,
      netAmount: `$${netAmount / 100}`,
      message: netAmount > 0 ? 'Customer will be charged' : 'Customer will receive credit'
    });
  } catch (error) {
    res.status(400).json({ error: error.message });
  }
};

exports.listSubscriptions = (req, res) => {
  res.json(Object.values(subscriptions));
};

module.exports = exports;
