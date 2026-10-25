const sellers = {};
const charges = {};
const transfers = {};
const disputes = {};

exports.createSellerAccount = (req, res) => {
  const { email, firstName, lastName, businessName } = req.body;
  const sellerId = `acct_${Date.now()}`;

  try {
    const seller = {
      sellerId,
      email,
      firstName,
      lastName,
      businessName,
      status: 'onboarding',
      verificationComplete: false,
      createdAt: new Date()
    };

    sellers[sellerId] = seller;
    res.status(201).json(seller);
  } catch (error) {
    res.status(400).json({ error: error.message });
  }
};

exports.getSellerAccount = (req, res) => {
  const seller = sellers[req.params.sellerId];
  if (!seller) return res.status(404).json({ error: 'Seller not found' });
  res.json(seller);
};

exports.createOnboardingLink = (req, res) => {
  const seller = sellers[req.params.sellerId];
  if (!seller) return res.status(404).json({ error: 'Seller not found' });

  try {
    const link = {
      url: `https://connect.stripe.com/onboarding/acct_${Date.now()}`,
      expiresAt: new Date(Date.now() + 24 * 60 * 60 * 1000)
    };

    res.json(link);
  } catch (error) {
    res.status(400).json({ error: error.message });
  }
};

exports.processCharge = (req, res) => {
  const { amount, sellerId, customerId, description } = req.body;
  const chargeId = `ch_${Date.now()}`;

  try {
    const seller = sellers[sellerId];
    if (!seller) return res.status(400).json({ error: 'Seller not found' });

    const platformFee = Math.floor(amount * 0.1);  // 10% fee
    const sellerAmount = amount - platformFee;

    const charge = {
      chargeId,
      amount,
      sellerId,
      customerId,
      description,
      platformFee,
      sellerAmount,
      status: 'succeeded',
      createdAt: new Date()
    };

    charges[chargeId] = charge;
    res.status(201).json(charge);
  } catch (error) {
    res.status(400).json({ error: error.message });
  }
};

exports.createTransfer = (req, res) => {
  const { sellerId, amount, description } = req.body;
  const transferId = `tr_${Date.now()}`;

  try {
    const seller = sellers[sellerId];
    if (!seller) return res.status(400).json({ error: 'Seller not found' });

    const transfer = {
      transferId,
      sellerId,
      amount,
      description,
      status: 'processing',
      createdAt: new Date(),
      estimatedArrival: new Date(Date.now() + 24 * 60 * 60 * 1000)
    };

    transfers[transferId] = transfer;
    res.status(201).json(transfer);
  } catch (error) {
    res.status(400).json({ error: error.message });
  }
};

exports.getSellerDashboard = (req, res) => {
  const seller = sellers[req.params.sellerId];
  if (!seller) return res.status(404).json({ error: 'Seller not found' });

  const sellerCharges = Object.values(charges).filter(c => c.sellerId === req.params.sellerId);
  const totalRevenue = sellerCharges.reduce((sum, c) => sum + c.sellerAmount, 0);

  res.json({
    seller,
    totalRevenue: totalRevenue / 100,
    totalCharges: sellerCharges.length,
    balance: totalRevenue / 100
  });
};

exports.getSellerBalance = (req, res) => {
  const seller = sellers[req.params.sellerId];
  if (!seller) return res.status(404).json({ error: 'Seller not found' });

  const sellerCharges = Object.values(charges).filter(c => c.sellerId === req.params.sellerId);
  const available = sellerCharges.reduce((sum, c) => sum + c.sellerAmount, 0) / 100;
  const pending = 0;

  res.json({
    available: available,
    pending: pending,
    totalBalance: available + pending
  });
};

exports.recordDispute = (req, res) => {
  const { chargeId, reason, amount } = req.body;
  const disputeId = `dp_${Date.now()}`;

  try {
    const charge = charges[chargeId];
    if (!charge) return res.status(400).json({ error: 'Charge not found' });

    const dispute = {
      disputeId,
      chargeId,
      sellerId: charge.sellerId,
      reason,
      amount,
      status: 'warning_needs_response',
      createdAt: new Date(),
      deadline: new Date(Date.now() + 7 * 24 * 60 * 60 * 1000)
    };

    disputes[disputeId] = dispute;
    res.status(201).json(dispute);
  } catch (error) {
    res.status(400).json({ error: error.message });
  }
};

exports.listDisputes = (req, res) => {
  res.json(Object.values(disputes));
};

module.exports = exports;
