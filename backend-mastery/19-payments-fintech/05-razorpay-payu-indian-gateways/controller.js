const crypto = require('crypto');

const razorpayOrders = {};
const payuPayments = {};
const settlements = {};

exports.createRazorpayOrder = (req, res) => {
  const { amount, currency, description } = req.body;

  try {
    const orderId = `razorpay_order_${Date.now()}`;
    const order = {
      id: orderId,
      amount: amount * 100,  // Convert to paise
      currency: currency || 'INR',
      description,
      status: 'created',
      createdAt: new Date()
    };

    razorpayOrders[orderId] = order;

    res.status(201).json({
      id: orderId,
      entity: 'order',
      amount: order.amount,
      currency: order.currency,
      receipt: `receipt_${Date.now()}`,
      status: 'created'
    });
  } catch (error) {
    res.status(400).json({ error: error.message });
  }
};

exports.verifyRazorpayPayment = (req, res) => {
  const { razorpay_order_id, razorpay_payment_id, razorpay_signature } = req.body;

  try {
    const order = razorpayOrders[razorpay_order_id];
    if (!order) {
      return res.status(400).json({ error: 'Order not found' });
    }

    // Verify signature
    const body = razorpay_order_id + '|' + razorpay_payment_id;
    const expectedSignature = crypto
      .createHmac('sha256', process.env.RAZORPAY_KEY_SECRET || 'test_secret')
      .update(body)
      .digest('hex');

    if (expectedSignature === razorpay_signature) {
      order.status = 'paid';
      order.paymentId = razorpay_payment_id;
      res.json({ verified: true, message: 'Payment verified' });
    } else {
      res.status(400).json({ error: 'Signature verification failed' });
    }
  } catch (error) {
    res.status(400).json({ error: error.message });
  }
};

exports.listRazorpayOrders = (req, res) => {
  res.json(Object.values(razorpayOrders));
};

exports.createPayUPaymentLink = (req, res) => {
  const { amount, email, phone, name } = req.body;

  try {
    const txnId = `txn_${Date.now()}`;
    const payment = {
      txnId,
      amount,
      email,
      phone,
      name,
      status: 'initiated',
      createdAt: new Date()
    };

    payuPayments[txnId] = payment;

    res.status(201).json({
      txnId,
      paymentUrl: `https://payu.in/checkout?txnId=${txnId}`,
      status: 'initiated'
    });
  } catch (error) {
    res.status(400).json({ error: error.message });
  }
};

exports.handlePayUCallback = (req, res) => {
  const { txnid, status } = req.body;

  try {
    const payment = payuPayments[txnid];
    if (!payment) {
      return res.status(400).json({ error: 'Payment not found' });
    }

    payment.status = status === 'success' ? 'completed' : 'failed';
    payment.updatedAt = new Date();

    res.json({ received: true, status: payment.status });
  } catch (error) {
    res.status(400).json({ error: error.message });
  }
};

exports.getPaymentMethods = (req, res) => {
  res.json({
    methods: [
      { id: 'upi', name: 'UPI', available: true },
      { id: 'netbanking', name: 'Net Banking', available: true },
      { id: 'card', name: 'Credit/Debit Card', available: true },
      { id: 'wallet', name: 'Digital Wallets', available: true },
      { id: 'emi', name: 'EMI Options', available: true }
    ]
  });
};

exports.getSettlementStatus = (req, res) => {
  res.json({
    settlements: [
      {
        date: new Date(Date.now() - 86400000).toISOString().split('T')[0],
        amount: 50000,
        status: 'settled',
        method: 'bank_transfer'
      },
      {
        date: new Date().toISOString().split('T')[0],
        amount: 25000,
        status: 'processing',
        expectedDate: new Date(Date.now() + 86400000).toISOString().split('T')[0]
      }
    ]
  });
};

module.exports = exports;
