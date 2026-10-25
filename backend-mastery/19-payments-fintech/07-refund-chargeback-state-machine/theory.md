# Refunds & Chargebacks State Machine - Theory & Concepts

## The Refund Process

A refund is when a merchant returns money to a customer.

### Types of Refunds

#### 1. Full Refund
Return 100% of charge amount:
```
Charge: $100
Refund: $100
Customer receives: Original payment back
```

#### 2. Partial Refund
Return portion of charge amount:
```
Charge: $100
Refund: $50
Customer receives: $50 back
```

#### 3. Layaway Refund
Multiple partial refunds:
```
Charge: $100
Refund 1: $25
Refund 2: $25
Refund 3: $50
Total refunded: $100 (in three transactions)
```

## Refund State Machine

```
CAPTURED
   ↓
REFUND_INITIATED
   ↓
REFUND_PROCESSING
   ↓
REFUND_COMPLETED (Success) or REFUND_FAILED (Failure)
   ↓
SETTLEMENT (Money returned to customer)
```

### States Explained

#### 1. CAPTURED
- Payment successfully charged
- Money held in merchant account
- Ready to be refunded

#### 2. REFUND_INITIATED
- Merchant requests refund
- Validation starting
- Check balance, customer, etc.

#### 3. REFUND_PROCESSING
- Refund in progress
- Money being transferred
- Typically 1-2 business days

#### 4. REFUND_COMPLETED
- Refund successful
- Money approved for return

#### 5. REFUND_FAILED
- Refund rejected
- Possible reasons:
  - Original card expired
  - Bank declined
  - Account closed
  - Fraud suspected

#### 6. SETTLEMENT
- Money reaches customer
- Final state
- Typically 3-5 business days

## Implementing Refund State Machine

```javascript
class RefundStateMachine {
  constructor(chargeId) {
    this.chargeId = chargeId;
    this.state = 'CAPTURED';
    this.refunds = [];
  }

  async initiateRefund(amount, reason) {
    // Validate
    if (this.state !== 'CAPTURED') {
      throw new Error(`Cannot refund in ${this.state} state`);
    }

    const refund = {
      id: `refund_${Date.now()}`,
      chargeId: this.chargeId,
      amount: amount,
      reason: reason,
      state: 'REFUND_INITIATED',
      createdAt: new Date(),
      updatedAt: new Date()
    };

    this.state = 'REFUND_INITIATED';
    this.refunds.push(refund);

    // Store in database
    await db.refunds.insert(refund);
    return refund;
  }

  async processRefund(refundId) {
    const refund = this.refunds.find(r => r.id === refundId);
    if (!refund || refund.state !== 'REFUND_INITIATED') {
      throw new Error('Invalid refund state');
    }

    refund.state = 'REFUND_PROCESSING';
    refund.updatedAt = new Date();

    // Call payment processor
    try {
      const result = await this.callPaymentProcessor(refund);
      
      if (result.success) {
        refund.state = 'REFUND_COMPLETED';
        refund.transactionId = result.transactionId;
      } else {
        refund.state = 'REFUND_FAILED';
        refund.failureReason = result.reason;
      }
    } catch (error) {
      refund.state = 'REFUND_FAILED';
      refund.failureReason = error.message;
    }

    refund.updatedAt = new Date();
    await db.refunds.updateOne({ id: refundId }, refund);
    return refund;
  }

  async settleRefund(refundId) {
    const refund = this.refunds.find(r => r.id === refundId);
    if (!refund || refund.state !== 'REFUND_COMPLETED') {
      throw new Error('Refund not ready for settlement');
    }

    refund.state = 'SETTLEMENT';
    refund.settledAt = new Date();
    
    await db.refunds.updateOne({ id: refundId }, refund);
    return refund;
  }

  async callPaymentProcessor(refund) {
    // Call Stripe, PayPal, etc.
    const stripe = require('stripe')(process.env.STRIPE_SECRET_KEY);
    
    try {
      const result = await stripe.refunds.create({
        charge: refund.chargeId,
        amount: refund.amount,
        reason: refund.reason,
        metadata: {
          refundId: refund.id
        }
      });

      return {
        success: true,
        transactionId: result.id
      };
    } catch (error) {
      return {
        success: false,
        reason: error.message
      };
    }
  }
}
```

## Chargeback Process

A chargeback is when customer disputes a charge with their bank/card issuer.

### Why Customers Dispute

1. **Fraud** - Card stolen, unauthorized purchase
2. **Service not received** - Paid but didn't get product
3. **Quality issue** - Product defective/wrong
4. **Billing error** - Charged wrong amount
5. **Unrecognized charge** - Forgot about purchase
6. **Merchant refused refund** - Tried to refund, merchant said no

### Chargeback Timeline

```
Day 0: Customer initiates dispute with bank
       ↓
Day 1-5: Bank notifies merchant (chargeback initiated)
       ↓
Day 5-10: Merchant has 5-10 days to respond with evidence
       ↓
Day 10-45: Bank investigates
       ↓
Day 45: Chargeback resolved
        - Merchant wins (keeps money)
        - Customer wins (gets refund)
```

## Chargeback State Machine

```
CHARGE_INITIATED
       ↓
CHARGEBACK_NOTICE_RECEIVED
       ↓
DEFENSE_PERIOD_OPEN
       ↓
DEFENSE_SUBMITTED
       ↓
CHARGEBACK_WON (Merchant wins) 
  or
CHARGEBACK_LOST (Customer wins)
```

### Chargeback Defense

To win a chargeback:

```javascript
const chargebackDefense = {
  chargeId: 'ch_123',
  chargebackId: 'cb_456',
  
  // Evidence to submit:
  evidence: {
    // 1. Proof of delivery
    shippingProof: 'tracking_123',
    signatureProof: 'signature.pdf',
    
    // 2. Customer communication
    emailConfirmation: 'email_123',
    customerAgreement: 'tos.pdf',
    
    // 3. Refund policy
    refundPolicy: 'policy.pdf',
    customerAccessedService: true,
    
    // 4. Billing information
    billingAddress: '123 Main St',
    postalCode: '12345',
    shippingAddress: '123 Main St',
    ipAddress: '192.168.1.1'
  },
  
  // Response statement
  statement: 'Customer received product and confirmed receipt with signature.'
};
```

## Refund vs Chargeback Comparison

| Aspect | Refund | Chargeback |
|--------|--------|-----------|
| **Initiator** | Merchant | Customer/Bank |
| **Control** | Merchant decides | Bank decides |
| **Timeline** | 1-2 days | 45+ days |
| **Cost** | Usually free | $100-300 fee |
| **Outcome** | Always refunded | Win or lose |
| **Effort** | Minimal | High (evidence needed) |
| **Prevention** | Process well | Keep evidence |

## Preventing Chargebacks

### 1. Excellent Customer Service
```javascript
const supportTicket = {
  ticketId: 'supp_123',
  customerId: 'cus_123',
  chargeId: 'ch_123',
  message: 'Product quality issue',
  resolution: 'Offered full refund or replacement',
  proactiveRefund: true  // Refunded before chargeback
};

// If customer gets refund proactively:
// → They won't file chargeback
// → Save the chargeback fee
```

### 2. Clear Communication
```javascript
// Send transactions confirmation
const transactionConfirmation = {
  orderId: 'ord_123',
  chargeId: 'ch_123',
  amount: 10000,
  description: 'Premium subscription',
  merchant: 'Your Company Name',
  supportEmail: 'support@company.com',
  refundPolicy: '/refund-policy'
};

// Email to customer, card statement shows clear merchant name
```

### 3. Shipping Proof
```javascript
// For physical goods: Get signature
const shippingInfo = {
  chargeId: 'ch_123',
  trackingNumber: 'track_123',
  carrierShipped: true,
  signatureProof: 'signature.pdf',
  deliveryDate: '2024-01-15',
  recipientName: 'John Doe'
};

// Keep shipping proof for minimum 3+ years
```

### 4. Fraud Prevention
```javascript
// Use AVS (Address Verification)
const avsCheck = {
  chargeId: 'ch_123',
  avsMatch: 'Y',  // Y=Match, N=No match, U=Unavailable
  cvvMatch: 'M'   // M=Match, N=No match, U=Unavailable
};

// High-risk: AVS no-match, CVV no-match
// Consider declining or requiring verification
```

## Metadata for Chargeback Defense

```javascript
const chargeWithMetadata = {
  chargeId: 'ch_123',
  chargeAmount: 10000,
  chargeCurrency: 'USD',
  
  metadata: {
    // Customer information
    customerId: 'cus_123',
    email: 'customer@example.com',
    phone: '555-1234',
    
    // Order information
    orderId: 'ord_123',
    orderDate: '2024-01-15',
    productDescription: 'Premium subscription 3 months',
    
    // Shipping information
    shippingAddress: '123 Main St, City, ST 12345',
    trackingNumber: 'track_123',
    signedFor: true,
    
    // Service information
    serviceProvided: true,
    accessDate: '2024-01-15',
    accessCount: 45,
    
    // Refund information
    refundOffered: false,
    refundReason: 'N/A'
  }
};
```

## API Implementation

```javascript
app.post('/api/refunds', async (req, res) => {
  const { chargeId, amount, reason } = req.body;
  
  try {
    const charge = await db.charges.findById(chargeId);
    if (!charge) return res.status(404).json({ error: 'Charge not found' });
    
    if (charge.status !== 'captured') {
      return res.status(400).json({ error: 'Can only refund captured charges' });
    }
    
    const refund = new RefundStateMachine(chargeId);
    await refund.initiateRefund(amount, reason);
    
    res.json(refund);
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
});

app.post('/api/chargebacks/:chargebackId/defend', async (req, res) => {
  const { chargebackId } = req.params;
  const { evidence } = req.body;
  
  try {
    const chargeback = await db.chargebacks.findById(chargebackId);
    if (!chargeback) return res.status(404).json({ error: 'Not found' });
    
    if (chargeback.state !== 'DEFENSE_PERIOD_OPEN') {
      return res.status(400).json({ error: 'Defense period closed' });
    }
    
    // Submit evidence to payment processor
    const result = await submitChargebackDefense(chargebackId, evidence);
    
    chargeback.state = 'DEFENSE_SUBMITTED';
    await db.chargebacks.updateOne({ id: chargebackId }, chargeback);
    
    res.json({ message: 'Defense submitted', result });
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
});
```

## Best Practices

✅ Process refunds quickly  
✅ Keep detailed records  
✅ Get shipping proof  
✅ Monitor chargeback ratios  
✅ Respond to disputes immediately  
✅ Train customer support team  
✅ Use fraud detection  
✅ Maintain refund policy  

## Chargeback Ratio Limits

Payment processors set limits:
- Chargeback ratio > 1.5% = Warning
- Chargeback ratio > 2% = Account review
- Chargeback ratio > 3% = Account termination

Track and minimize!

## Real-World Scenario

```
Day 0: Customer charges $50 subscription to company credit card
Day 7: Customer doesn't use service, forgets about charge
Day 30: Sees charge on statement, doesn't remember
Day 31: Customer calls bank, "I don't recognize this"
Day 35: Bank notifies merchant (chargeback initiated)
Day 40: Merchant has 5 days to respond

Merchant proves:
- Customer signed up (email confirmation)
- Service accessed 10 times (logs)
- Refund policy clearly stated
- Offered refund when contacted

Result: Merchant WINS chargeback, keeps $50

Alternative:
- Merchant had offered refund on day 1 when customer asked
- More customers = get better reputation
- May cost $50 but saves chargeback fee + time
```

## Summary

**Refunds**: Merchant initiates, quick
**Chargebacks**: Customer via bank, slow, costly
**Prevention**: Good service, clear communication, keep proof

## Key Takeaways

1. Implement refund state machine
2. Track all chargeback evidence
3. Respond to chargebacks immediately
4. Get shipping proof for physical goods
5. Keep customer communication records
6. Monitor chargeback ratio
7. Offer refunds proactively
8. Maintain detailed metadata
9. Have documented refund policy
10. Train support team on dispute handling
