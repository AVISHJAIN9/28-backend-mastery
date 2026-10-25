const stripe = require('stripe')(process.env.STRIPE_SECRET_KEY);

// ==================== State (In-memory) ====================
const webhookEvents = new Map();
const payments = new Map();
const subscriptions = new Map();

// ==================== Payment Intents ====================

/**
 * Create a payment intent
 */
exports.createPaymentIntent = async (req, res) => {
  const { amount, currency = 'usd', paymentMethod, description, metadata, receipt_email } = req.validatedBody;

  try {
    const paymentIntent = await stripe.paymentIntents.create({
      amount: Math.round(amount * 100), // Convert to cents
      currency,
      payment_method: paymentMethod,
      confirm: true,
      return_url: process.env.RETURN_URL || 'http://localhost:3000',
      automatic_payment_methods: {
        enabled: true,
      },
      description,
      metadata,
      receipt_email,
    });

    // Store locally
    payments.set(paymentIntent.id, paymentIntent);

    res.json({
      success: true,
      paymentIntentId: paymentIntent.id,
      amount: paymentIntent.amount / 100,
      currency: paymentIntent.currency,
      status: paymentIntent.status,
      clientSecret: paymentIntent.client_secret,
    });
  } catch (error) {
    res.status(error.statusCode || 500).json({
      error: error.message,
      code: error.code
    });
  }
};

/**
 * Get payment intent details
 */
exports.getPaymentIntent = async (req, res) => {
  const { paymentIntentId } = req.params;

  try {
    const paymentIntent = await stripe.paymentIntents.retrieve(paymentIntentId);
    res.json({
      success: true,
      paymentIntentId: paymentIntent.id,
      amount: paymentIntent.amount / 100,
      currency: paymentIntent.currency,
      status: paymentIntent.status,
      charges: paymentIntent.charges.data,
    });
  } catch (error) {
    res.status(error.statusCode || 500).json({ error: error.message });
  }
};

// ==================== Customers ====================

/**
 * Create a customer
 */
exports.createCustomer = async (req, res) => {
  const { email, name, description, paymentMethod, metadata } = req.validatedBody;

  try {
    const customer = await stripe.customers.create({
      email,
      name,
      description,
      payment_method: paymentMethod,
      invoice_settings: {
        default_payment_method: paymentMethod,
      },
      metadata,
    });

    res.json({
      success: true,
      customerId: customer.id,
      email: customer.email,
      name: customer.name,
    });
  } catch (error) {
    res.status(error.statusCode || 500).json({ error: error.message });
  }
};

// ==================== Subscriptions ====================

/**
 * Create a subscription
 */
exports.createSubscription = async (req, res) => {
  const { customer, items, trialPeriodDays, billingCycleAnchor, metadata } = req.validatedBody;

  try {
    const subscription = await stripe.subscriptions.create({
      customer,
      items: items.map(item => ({
        price: item.price,
        quantity: item.quantity || 1,
      })),
      trial_period_days: trialPeriodDays,
      billing_cycle_anchor: billingCycleAnchor ? Math.floor(billingCycleAnchor.getTime() / 1000) : undefined,
      metadata,
    });

    subscriptions.set(subscription.id, subscription);

    res.json({
      success: true,
      subscriptionId: subscription.id,
      customerId: subscription.customer,
      status: subscription.status,
      currentPeriodStart: new Date(subscription.current_period_start * 1000),
      currentPeriodEnd: new Date(subscription.current_period_end * 1000),
    });
  } catch (error) {
    res.status(error.statusCode || 500).json({ error: error.message });
  }
};

/**
 * Cancel subscription
 */
exports.cancelSubscription = async (req, res) => {
  const { subscriptionId } = req.params;

  try {
    const subscription = await stripe.subscriptions.del(subscriptionId);
    subscriptions.delete(subscriptionId);

    res.json({
      success: true,
      message: 'Subscription cancelled',
      subscriptionId: subscription.id,
      canceledAt: new Date(subscription.canceled_at * 1000),
    });
  } catch (error) {
    res.status(error.statusCode || 500).json({ error: error.message });
  }
};

// ==================== Webhooks ====================

/**
 * Handle Stripe webhook events
 */
exports.handleWebhook = async (req, res) => {
  const event = req.event;
  const eventId = event.id;

  // Store event
  webhookEvents.set(eventId, {
    type: event.type,
    data: event.data,
    timestamp: new Date(),
  });

  // Handle different event types
  switch (event.type) {
    case 'charge.succeeded':
      console.log('✅ Charge succeeded:', event.data.object.id);
      break;

    case 'charge.failed':
      console.log('❌ Charge failed:', event.data.object.id);
      break;

    case 'payment_intent.succeeded':
      console.log('✅ Payment intent succeeded:', event.data.object.id);
      break;

    case 'payment_intent.payment_failed':
      console.log('❌ Payment intent failed:', event.data.object.id);
      break;

    case 'customer.subscription.created':
      console.log('✅ Subscription created:', event.data.object.id);
      break;

    case 'customer.subscription.deleted':
      console.log('✅ Subscription cancelled:', event.data.object.id);
      break;

    case 'invoice.paid':
      console.log('✅ Invoice paid:', event.data.object.id);
      break;

    case 'invoice.payment_failed':
      console.log('❌ Invoice payment failed:', event.data.object.id);
      break;

    default:
      console.log('➡️ Unhandled event type:', event.type);
  }

  // Return successful response to Stripe
  res.json({ received: true });
};

/**
 * Get webhook events
 */
exports.getWebhookEvents = (req, res) => {
  const events = Array.from(webhookEvents.values()).reverse();
  res.json({
    success: true,
    totalEvents: events.length,
    events: events.slice(0, 50), // Last 50 events
  });
};

// ==================== Refunds ====================

/**
 * Create a refund
 */
exports.createRefund = async (req, res) => {
  const { chargeId, amount, reason, metadata } = req.validatedBody;

  try {
    const refund = await stripe.refunds.create({
      charge: chargeId,
      amount: amount ? Math.round(amount * 100) : undefined,
      reason,
      metadata,
    });

    res.json({
      success: true,
      refundId: refund.id,
      amount: refund.amount / 100,
      currency: refund.currency,
      status: refund.status,
      reason: refund.reason,
    });
  } catch (error) {
    res.status(error.statusCode || 500).json({ error: error.message });
  }
};

module.exports = {
  createPaymentIntent,
  getPaymentIntent,
  createCustomer,
  createSubscription,
  cancelSubscription,
  handleWebhook,
  getWebhookEvents,
  createRefund,
};
