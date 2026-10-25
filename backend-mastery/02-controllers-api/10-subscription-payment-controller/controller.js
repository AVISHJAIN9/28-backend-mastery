const { v4: uuidv4 } = require('uuid');

const subscriptions = new Map();
const invoices = new Map();

class SubscriptionPaymentController {
  static async createSubscription(req, res) {
    try {
      const { userId, plan, billingCycle } = req.body;
      const subId = uuidv4();
      
      const subscription = {
        id: subId,
        userId,
        plan,
        billingCycle,
        status: 'active',
        currentPeriodStart: new Date(),
        currentPeriodEnd: new Date(Date.now() + 30*24*60*60*1000),
        autoRenew: true,
        amount: plan === 'pro' ? 99.99 : 29.99,
        createdAt: new Date()
      };
      
      subscriptions.set(subId, subscription);
      res.status(201).json({ subscription });
    } catch (err) {
      res.status(500).json({ error: err.message });
    }
  }

  static async getSubscription(req, res) {
    try {
      const { id } = req.params;
      const sub = subscriptions.get(id);
      if (!sub) return res.status(404).json({ error: 'Not found' });
      res.json(sub);
    } catch (err) {
      res.status(500).json({ error: err.message });
    }
  }

  static async generateInvoice(req, res) {
    try {
      const { subscriptionId } = req.body;
      const sub = subscriptions.get(subscriptionId);
      if (!sub) return res.status(404).json({ error: 'Subscription not found' });

      const invoiceId = uuidv4();
      const invoice = {
        id: invoiceId,
        subscriptionId,
        amount: sub.amount,
        status: 'paid',
        createdAt: new Date(),
        dueDate: new Date(Date.now() + 30*24*60*60*1000)
      };
      
      invoices.set(invoiceId, invoice);
      res.status(201).json({ invoice });
    } catch (err) {
      res.status(500).json({ error: err.message });
    }
  }
}
module.exports = SubscriptionPaymentController;