# Razorpay & PayU - Indian Payment Gateways - Theory & Concepts

## Indian Payment Landscape

India has unique payment requirements due to:
- **Large cash-based economy** - Many prefer prepaid/COD
- **UPI dominance** - 1.5+ billion UPI transactions/month
- **Multiple payment methods** - Credit/debit cards, netbanking, wallets
- **Regulatory environment** - RBI oversight, compliance requirements
- **Tax considerations** - GST, TDS, compliance

## Razorpay Overview

### What is Razorpay?

Razorpay is India's leading payment aggregator providing:
- **Payment processing** - Credit/debit cards, UPI, netbanking
- **Payout system** - Distribute funds to vendors/customers
- **Subscriptions** - Recurring billing
- **Invoicing** - Payment links
- **Compliance** - PCI DSS, fraud detection

### Why Razorpay?

1. **UPI Integration** - Direct support for 1.2B+ UPI users
2. **Netbanking** - Connect to all Indian banks
3. **Lower fees** - Competitive rates for Indian market
4. **Settlement** - Fast 24-hour settlements
5. **Compliance** - Built-in GST handling
6. **Recurring** - Native support for subscriptions

## PayU Overview

### What is PayU?

PayU is a global payment platform with strong India presence:
- **Payment modes** - Cards, UPI, wallets, EMI
- **Global reach** - 20+ countries, multi-currency
- **Financing** - EMI options for customers
- **Risk management** - Fraud detection, chargeback handling
- **Plugins** - WooCommerce, Magento, custom

### Why PayU?

1. **Multiple payment methods** - More options for customers
2. **EMI support** - Enable installment payments
3. **Wallet integration** - Airtel, Paytm, etc.
4. **Global expansion** - Single integration for multiple countries
5. **Fraud detection** - Advanced risk management

## Razorpay Integration

### Setup

```javascript
const Razorpay = require('razorpay');

const razorpay = new Razorpay({
  key_id: process.env.RAZORPAY_KEY_ID,
  key_secret: process.env.RAZORPAY_KEY_SECRET
});
```

### Creating Payment Order

```javascript
const createOrder = async (amount, currency = 'INR') => {
  const order = await razorpay.orders.create({
    amount: amount * 100,  // Amount in paise (smallest unit)
    currency: currency,
    receipt: `receipt_${Date.now()}`,
    payment_capture: 1  // Auto capture after auth
  });

  return order;
};

// Usage
const order = await createOrder(500); // ₹500
// Returns: { id: 'order_123...', amount: 50000, ... }
```

### Client-Side Checkout

```javascript
// Frontend
const options = {
  key: process.env.REACT_APP_RAZORPAY_KEY_ID,
  amount: order.amount,
  currency: order.currency,
  name: 'Your Company',
  description: 'Product purchase',
  image: '/logo.png',
  order_id: order.id,
  handler: async function(response) {
    // Verify payment on backend
    const verified = await verifyRazorpayPayment(response);
    if (verified) {
      showSuccess('Payment successful!');
    }
  },
  prefill: {
    name: 'Customer Name',
    email: 'customer@example.com',
    contact: '9876543210'
  },
  notes: {
    orderId: order.id,
    customerId: customer.id
  }
};

const rzp = new window.Razorpay(options);
rzp.open();
```

### Verify Payment Signature

```javascript
const crypto = require('crypto');

const verifyRazorpayPayment = (paymentData) => {
  const body = paymentData.orderId + '|' + paymentData.paymentId;
  const expectedSignature = crypto
    .createHmac('sha256', process.env.RAZORPAY_KEY_SECRET)
    .update(body)
    .digest('hex');

  return expectedSignature === paymentData.signature;
};
```

## PayU Integration

### Setup

```javascript
const PayU = require('payu-nodejs');

const payu = new PayU({
  merchantKey: process.env.PAYU_MERCHANT_KEY,
  merchantSalt: process.env.PAYU_MERCHANT_SALT,
  environment: 'production'
});
```

### Creating Payment Link

```javascript
const createPaymentLink = async (amount, orderId) => {
  const payload = {
    txnid: orderId,
    amount: amount,
    productinfo: 'Product purchase',
    firstname: 'Customer',
    email: 'customer@example.com',
    phone: '9876543210',
    udf1: 'custom_data_1',
    udf2: 'custom_data_2'
  };

  const hash = payu.createHash(payload);
  
  return {
    ...payload,
    hash: hash,
    action: payu.getPaymentGatewayUrl()
  };
};
```

### Handling PayU Response

```javascript
const handlePayuResponse = (req, res) => {
  const response = req.body;
  
  // Verify hash
  const generatedHash = payu.createHash({
    txnid: response.txnid,
    amount: response.amount,
    productinfo: response.productinfo,
    firstname: response.firstname,
    email: response.email,
    // ... other fields
    status: response.status
  });

  if (generatedHash === response.hash) {
    if (response.status === 'success') {
      // Mark order as paid
      updateOrderStatus(response.txnid, 'paid');
      res.redirect('/success');
    } else {
      // Payment failed
      updateOrderStatus(response.txnid, 'failed');
      res.redirect('/failure');
    }
  } else {
    // Hash mismatch - potential fraud
    res.status(400).json({ error: 'Invalid signature' });
  }
};
```

## Payment Methods in India

### 1. UPI (Unified Payments Interface)

```javascript
const createUPIPayment = async (amount) => {
  const order = await razorpay.orders.create({
    amount: amount * 100,
    currency: 'INR',
    method: 'upi'  // UPI only
  });
  return order;
};

// UPI supports:
// - BHIM app
// - All bank apps
// - Google Pay, WhatsApp Pay
// - Paytm, PhonePe
```

Advantages:
- ✅ Instant transfer
- ✅ Highest adoption
- ✅ No intermediate merchant
- ✅ Direct bank accounts

### 2. Netbanking (Online Banking)

```javascript
const createNetbankingPayment = async (amount) => {
  const order = await razorpay.orders.create({
    amount: amount * 100,
    currency: 'INR',
    method: 'netbanking'
  });
  return order;
};

// All major Indian banks supported:
// - ICICI, HDFC, AXIS, IDBI, SBI, etc.
```

### 3. Credit/Debit Cards

```javascript
const createCardPayment = async (amount) => {
  const order = await razorpay.orders.create({
    amount: amount * 100,
    currency: 'INR',
    method: 'card'
  });
  return order;
};

// Advantages:
// - International cards supported
// - EMI options available
// - Higher transaction limit
```

### 4. Wallets

```javascript
// Supported by PayU:
// - Paytm Wallet
// - Airtel Money
// - Mobikwik
// - Google Pay
// - Apple Pay

const createWalletPayment = async (amount, walletType) => {
  const payload = {
    amount: amount,
    udf5: walletType // 'paytm', 'airtel', etc.
  };
  return payload;
};
```

### 5. EMI (Easy Monthly Installments)

```javascript
const createEMIPayment = async (amount, cardToken) => {
  // PayU supports EMI through:
  const emiOptions = await payu.getEMIOptions({
    amount: amount,
    cardToken: cardToken
  });

  // Response: [
  //   { duration: 3, monthlyAmount: 3000, charges: 100 },
  //   { duration: 6, monthlyAmount: 1500, charges: 200 },
  //   { duration: 12, monthlyAmount: 750, charges: 300 }
  // ]

  return emiOptions;
};
```

## GST Handling

India requires GST (Goods and Services Tax) compliance:

```javascript
const calculateGST = (amount, gstRate = 18) => {
  const gstAmount = (amount * gstRate) / 100;
  const totalAmount = amount + gstAmount;
  
  return {
    baseAmount: amount,
    gstRate: gstRate,
    gstAmount: gstAmount,
    totalAmount: totalAmount
  };
};

// Usage in payment
const basePrice = 500;
const { gstAmount, totalAmount } = calculateGST(basePrice);

const order = await razorpay.orders.create({
  amount: totalAmount * 100,
  currency: 'INR',
  receipt: `order_${date}`,
  notes: {
    baseAmount: basePrice,
    gstAmount: gstAmount,
    gstRate: 18
  }
});
```

## Settlement and Payouts

### Razorpay Payouts

```javascript
const createPayout = async (recipientId, amount) => {
  const payout = await razorpay.payouts.create({
    account_number: process.env.RAZORPAY_ACCOUNT_NUMBER,
    fund_account_id: recipientId,
    amount: amount * 100,  // In paise
    currency: 'INR',
    mode: 'NEFT',  // NEFT, RTGS, IMPS
    purpose: 'Seller payout',
    queue_if_low_balance: true,
    reference_id: `payout_${Date.now()}`
  });

  return payout;
};

// Supported modes:
// NEFT: 8am-7pm, takes 1-30 min
// RTGS: 9am-5pm, instant
// IMPS: 24/7, instant
```

### Settlement Timeline

```javascript
Payment received → Settlement process (1-2 days) → Bank account

Razorpay: 24-hour settlement
PayU: 1-2 days settlement
Some gateways: Real-time settlement available
```

## Handling Local Payment Failures

### Common Failure Scenarios

```javascript
const errorCodes = {
  'TIMEOUT': 'Customer took too long to authorize',
  'CANCELLED': 'Customer cancelled payment',
  'INSUFFICIENT_BALANCE': 'Bank account/wallet has insufficient balance',
  'CARD_DECLINE': 'Card issuer declined transaction',
  'SECURITY_BLOCK': 'Bank blocked due to security rules',
  'NETWORK_ERROR': 'Network issue, transaction status unknown'
};

// Handle accordingly
app.post('/api/payment/callback', (req, res) => {
  const { status, error_code } = req.body;
  
  if (status === 'failed') {
    // Log failure reason
    logger.warn('Payment failed', {
      errorCode: error_code,
      reason: errorCodes[error_code]
    });
    
    // Retry or inform customer
    if (retryable(error_code)) {
      // Offer retry
      sendRetryEmail(customer);
    } else {
      // Try different payment method
      sendAlternativePaymentEmail(customer);
    }
  }
});
```

## Testing Credentials

### Razorpay Test Mode

```javascript
// Use test credentials
const razorpay = new Razorpay({
  key_id: 'rzp_test_1234...',
  key_secret: 'test_secret_1234...'
});

// Test card numbers
const testCards = {
  visa: '4111111111111111',
  mastercard: '5555555555554444',
  amex: '378282246310005'
};

// Test UPI: success@razorpay
// Test UPI: failure@razorpay
```

### PayU Test Mode

```javascript
// Use test environment
const payu = new PayU({
  environment: 'sandbox',
  merchantKey: 'test_key',
  merchantSalt: 'test_salt'
});

// Test card: 5123456789012346
// Test CVV: Any 3 digits
// Test OTP: 123456
```

## Compliance and RBI Regulations

1. **PCI DSS** - Standard card compliance
2. **RBI AML/KYC** - Know Your Customer verification
3. **GST** - Tax reporting requirements
4. **Data localization** - Sensitive data stays in India
5. **Chargebacks** - Handle within RBI timeline

## Best Practices for Indian Payments

✅ Implement multiple payment methods  
✅ Handle UPI as primary option  
✅ Support EMI for high-value transactions  
✅ Implement proper GST calculation  
✅ Handle local error codes  
✅ Provide language options (Hindi, etc.)  
✅ Test with real bank test credentials  
✅ Monitor settlement timelines  
✅ Have fallback gateway  
✅ Support local customer support  

## Comparison Table

| Feature | Razorpay | PayU |
|---------|----------|------|
| UPI | ✅ Native | ✅ Good |
| EMI | ✅ Good | ✅ Excellent |
| Settlement | 24 hours | 1-2 days |
| Fee | 2.0-2.5% | 1.95-2.5% |
| Global | Limited | Excellent |
| Recurring | Native | Add-on |

## Summary

Indian payment market is unique:
1. UPI dominance
2. Multiple payment methods
3. GST compliance required
4. Fast settlement expectations
5. Regional language needs

Choose based on:
- Primary payment methods needed
- Settlement speed requirements
- International expansion plans
- Specific compliance needs

## Key Takeaways

1. **UPI first** - Optimize for 1.2B UPI users
2. **Multiple methods** - Cards, netbanking, wallets, EMI
3. **GST handling** - Mandatory for Indian operations
4. **Settlement tracking** - Monitor fund transfers
5. **Error handling** - Plan for payment failures
6. **Testing** - Use sandbox before production
7. **Compliance** - Follow RBI guidelines
8. **Support** - Provide excellent customer service
