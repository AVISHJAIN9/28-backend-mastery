const refunds = {};
const chargebacks = {};
const charges = {};

const REFUND_STATES = {
  INITIATED: 'refund_initiated',
  PROCESSING: 'refund_processing',
  COMPLETED: 'refund_completed',
  FAILED: 'refund_failed'
};

const CHARGEBACK_STATES = {
  INITIATED: 'chargeback_initiated',
  DEFENSE_OPEN: 'defense_period_open',
  DEFENSE_SUBMITTED: 'defense_submitted',
  WON: 'chargeback_won',
  LOST: 'chargeback_lost'
};

exports.initiateRefund = (req, res) => {
  const { chargeId, amount, reason } = req.body;
  const refundId = `refund_${Date.now()}`;

  try {
    const refund = {
      refundId,
      chargeId,
      amount,
      reason,
      state: REFUND_STATES.INITIATED,
      createdAt: new Date()
    };

    refunds[refundId] = refund;
    res.status(201).json(refund);
  } catch (error) {
    res.status(400).json({ error: error.message });
  }
};

exports.getRefundStatus = (req, res) => {
  const refund = refunds[req.params.refundId];
  if (!refund) return res.status(404).json({ error: 'Refund not found' });
  res.json(refund);
};

exports.listRefunds = (req, res) => {
  res.json(Object.values(refunds));
};

exports.processRefund = (req, res) => {
  const refund = refunds[req.params.refundId];
  if (!refund) return res.status(404).json({ error: 'Refund not found' });

  try {
    refund.state = REFUND_STATES.PROCESSING;
    setTimeout(() => {
      refund.state = REFUND_STATES.COMPLETED;
      refund.completedAt = new Date();
    }, 100);

    res.json(refund);
  } catch (error) {
    res.status(400).json({ error: error.message });
  }
};

exports.recordChargeback = (req, res) => {
  const { chargeId, reason, amount } = req.body;
  const chargebackId = `chback_${Date.now()}`;

  try {
    const chargeback = {
      chargebackId,
      chargeId,
      reason,
      amount,
      state: CHARGEBACK_STATES.DEFENSE_OPEN,
      createdAt: new Date(),
      defenseDeadline: new Date(Date.now() + 7 * 24 * 60 * 60 * 1000)
    };

    chargebacks[chargebackId] = chargeback;
    res.status(201).json(chargeback);
  } catch (error) {
    res.status(400).json({ error: error.message });
  }
};

exports.getChargeback = (req, res) => {
  const chargeback = chargebacks[req.params.chargebackId];
  if (!chargeback) return res.status(404).json({ error: 'Chargeback not found' });
  res.json(chargeback);
};

exports.submitChargebackDefense = (req, res) => {
  const chargeback = chargebacks[req.params.chargebackId];
  if (!chargeback) return res.status(404).json({ error: 'Chargeback not found' });

  try {
    const { evidence } = req.body;
    chargeback.state = CHARGEBACK_STATES.DEFENSE_SUBMITTED;
    chargeback.evidence = evidence;
    chargeback.submittedAt = new Date();

    res.json({
      chargeback,
      message: 'Defense submitted successfully'
    });
  } catch (error) {
    res.status(400).json({ error: error.message });
  }
};

exports.getChargebackRatio = (req, res) => {
  const totalChargebacks = Object.keys(chargebacks).length;
  const totalCharges = Object.keys(charges).length || 1000;  // Demo value
  const ratio = (totalChargebacks / totalCharges * 100).toFixed(2);

  res.json({
    totalCharges,
    totalChargebacks,
    chargebackRatio: `${ratio}%`,
    status: ratio < 1 ? 'good' : ratio < 2 ? 'warning' : 'critical'
  });
};

module.exports = exports;
