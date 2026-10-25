const stripe = require('stripe')(process.env.STRIPE_SECRET_KEY);

// In-memory databases for demo
const orders = {};
const payments = {};
const webhookEvents = {};

// ==================== Webhook Handler ====================

exports.handleWebhook = async (req, res) => {
  const event = req.event;  // Set by middleware after verification

  try {
    // Check if event already processed (idempotency)
    if (webhookEvents[event.id]) {
      console.log(`Event ${event.id} already processed`);
      return res.json({ received: true });
    }

    // Store webhook event
    webhookEvents[event.id] = {
      type: event.type,
      data: event.data,
      createdAt: new Date(),
      processed: false
    };

    // Handle specific event types
    switch (event.type) {
      case 'charge.succeeded':
        await handleChargeSucceeded(event);
        break;
      case 'charge.failed':
        await handleChargeFailed(event);
        break;
      case 'charge.refunded':
        await handleChargeRefunded(event);
        break;
      case 'payment_intent.succeeded':
        await handlePaymentIntentSucceeded(event);
        break;
      case 'payment_intent.payment_failed':
        await handlePaymentIntentFailed(event);
        break;
      default:
        console.log(`Unhandled event type: ${event.type}`);
    }

    // Mark as processed
    webhookEvents[event.id].processed = true;
    return res.json({ received: true });
  } catch (error) {
    console.error('Webhook handler error:', error);
    return res.status(500).json({ error: error.message });
  }
};

// ==================== Webhook Event Handlers ====================

async function handleChargeSucceeded(event) {
  const charge = event.data.object;
  console.log(`✓ Charge succeeded: ${charge.id}, Amount: $${charge.amount / 100}`);

  if (orders[charge.metadata?.orderId]) {
    orders[charge.metadata.orderId].status = 'paid';
    orders[charge.metadata.orderId].chargeId = charge.id;
  }
}

async function handleChargeFailed(event) {
  const charge = event.data.object;
  console.log(`✗ Charge failed: ${charge.id}`);

  if (orders[charge.metadata?.orderId]) {
    orders[charge.metadata.orderId].status = 'failed';
  }
}

async function handleChargeRefunded(event) {
  const charge = event.data.object;
  console.log(`↩ Charge refunded: ${charge.id}, Refund amount: $${charge.refunded / 100}`);

  if (orders[charge.metadata?.orderId]) {
    orders[charge.metadata.orderId].status = 'refunded';
  }
}

async function handlePaymentIntentSucceeded(event) {
  const paymentIntent = event.data.object;
  console.log(`✓ Payment intent succeeded: ${paymentIntent.id}`);
}

async function handlePaymentIntentFailed(event) {
  const paymentIntent = event.data.object;
  console.log(`✗ Payment intent failed: ${paymentIntent.id}`);
}

// ==================== Order Routes ====================

exports.listOrders = (req, res) => {
  const orderList = Object.values(orders).map(order => ({
    ...order,
    amount: order.amount / 100  // Convert cents to dollars
  }));
  res.json(orderList);
};

exports.getOrder = (req, res) => {
  const order = orders[req.params.orderId];
  if (!order) {
    return res.status(404).json({ error: 'Order not found' });
  }
  res.json({
    ...order,
    amount: order.amount / 100
  });
};

exports.createOrder = (req, res) => {
  const { amount, description, customerId } = req.body;
  const orderId = `order_${Date.now()}`;

  orders[orderId] = {
    orderId,
    amount: Math.floor(amount * 100),  // Convert to cents
    description,
    customerId,
    status: 'pending',
    createdAt: new Date(),
    chargeId: null
  };

  res.status(201).json({
    ...orders[orderId],
    amount: orders[orderId].amount / 100
  });
};

// ==================== Payment Routes ====================

exports.listPayments = (req, res) => {
  const paymentList = Object.values(payments).map(payment => ({
    ...payment,
    amount: payment.amount / 100
  }));
  res.json(paymentList);
};

exports.processPayment = async (req, res) => {
  try {
    const { amount, currency, description, customerId } = req.body;

    // Create Stripe charge (simulated for demo)
    const payment = {
      id: `pay_${Date.now()}`,
      amount: Math.floor(amount * 100),
      currency,
      description,
      customerId,
      status: 'processing',
      createdAt: new Date()
    };

    payments[payment.id] = payment;

    // In production, this would call Stripe API
    // For demo, just simulate success
    setTimeout(() => {
      payment.status = 'succeeded';
    }, 1000);

    res.status(201).json({
      ...payment,
      amount: payment.amount / 100
    });
  } catch (error) {
    res.status(400).json({ error: error.message });
  }
};

// ==================== Webhook Events ====================

exports.listWebhookEvents = (req, res) => {
  const eventList = Object.entries(webhookEvents).map(([id, event]) => ({
    id,
    ...event
  }));
  res.json(eventList);
};

exports.getWebhookEvent = (req, res) => {
  const event = webhookEvents[req.params.eventId];
  if (!event) {
    return res.status(404).json({ error: 'Event not found' });
  }
  res.json({
    id: req.params.eventId,
    ...event
  });
};

// ==================== Test Webhook ====================

exports.testWebhook = async (req, res) => {
  try {
    // Create a test charge using Stripe test key
    const testEvent = {
      id: `evt_test_${Date.now()}`,
      type: 'charge.succeeded',
      data: {
        object: {
          id: `ch_test_${Date.now()}`,
          amount: 5000,
          currency: 'usd',
          status: 'succeeded',
          description: 'Test charge',
          metadata: { orderId: 'order_test_123' }
        }
      },
      created: Math.floor(Date.now() / 1000)
    };

    // Store and process test event
    webhookEvents[testEvent.id] = {
      type: testEvent.type,
      data: testEvent.data,
      createdAt: new Date(),
      processed: true
    };

    res.json({
      message: 'Test webhook created',
      event: testEvent
    });
  } catch (error) {
    res.status(400).json({ error: error.message });
  }
};

module.exports = exports;
