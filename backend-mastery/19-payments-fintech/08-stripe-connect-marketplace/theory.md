# Stripe Connect Marketplace - Theory & Concepts

## What is Stripe Connect?

Stripe Connect is a platform-as-a-service that allows you to process payments for multiple sellers/vendors on your marketplace.

### Key Use Cases

1. **Marketplace** - Buy/sell between buyers and sellers
2. **Crowdfunding** - Raise money from backers
3. **Saas Platform** - Charge customers for vendors
4. **On-Demand Services** - Uber-like model
5. **Revenue Sharing** - Distribute earnings among creators

### Example Marketplace Flow

```
Customer buys $100 item from Seller
         ↓
Payment → Stripe → Your Marketplace Platform
         ↓
Marketplace keeps 10% ($10)
Seller receives 90% ($90)
```

## Connect Account Types

### 1. Standard Account
- Seller signs up on Stripe website
- Stripe hosts some onboarding
- Less control, more Stripe overhead
- No API access for seller

### 2. Express Account
- Seller onboards via your platform
- You control UX
- Stripe handles compliance
- Limited API access
- Best for most marketplaces

### 3. Custom Account
- Full custom implementation
- You handle all compliance (PCI DSS, KYC, etc.)
- Maximum control, maximum responsibility
- Most complex

## Stripe Connect Architecture

```
┌─────────────┐
│   Customer  │
├─────────────┤
│  $100 card  │
└──────┬──────┘
       │
       ↓
┌──────────────────┐
│  Your Platform   │
│  (Connected Apps)│
└──────┬───────────┘
       │
       ↓
┌──────────────────┐
│ Stripe Account   │
│ (Your Account)   │
└──────┬───────────┘
       │
       ├─→ 10% ($10) stays with you
       ├─→ 90% ($90) transferred to seller
       │
       ↓
┌──────────────────┐
│ Stripe Account   │
│ (Seller Account) │
└──────────────────┘
```

## Setting Up Express Account

### Step 1: Create Connect Account

```javascript
const stripe = require('stripe')(process.env.STRIPE_SECRET_KEY);

const createConnectAccount = async (sellerInfo) => {
  const account = await stripe.accounts.create({
    type: 'express',
    email: sellerInfo.email,
    country: 'US',
    capabilities: {
      card_payments: {
        requested: true
      },
      transfers: {
        requested: true
      }
    },
    business_type: 'individual',
    individual: {
      first_name: sellerInfo.firstName,
      last_name: sellerInfo.lastName,
      dob: {
        day: sellerInfo.dob.day,
        month: sellerInfo.dob.month,
        year: sellerInfo.dob.year
      },
      email: sellerInfo.email,
      ssn_last_4: sellerInfo.ssnLast4,
      phone: sellerInfo.phone,
      address: {
        line1: sellerInfo.addressLine1,
        city: sellerInfo.city,
        state: sellerInfo.state,
        postal_code: sellerInfo.postalCode,
        country: 'US'
      }
    }
  });

  return account;
};

// Usage
const seller = await createConnectAccount({
  email: 'seller@example.com',
  firstName: 'John',
  lastName: 'Doe',
  dob: { day: 1, month: 1, year: 1990 },
  ssnLast4: '1234',
  phone: '555-1234',
  addressLine1: '123 Main St',
  city: 'New York',
  state: 'NY',
  postalCode: '10001'
});
```

### Step 2: Create Account Link for Onboarding

```javascript
const createAccountLink = async (accountId) => {
  const link = await stripe.accountLinks.create({
    account: accountId,
    type: 'account_onboarding',
    refresh_url: 'https://yoursite.com/reauth',
    return_url: 'https://yoursite.com/success'
  });

  return link;
};

// Usage in API
app.post('/api/sellers/onboard', async (req, res) => {
  const { email, firstName, lastName } = req.body;

  // Create account
  const account = await createConnectAccount({
    email, firstName, lastName
  });

  // Save to database
  await db.sellers.insert({
    email,
    stripeAccountId: account.id
  });

  // Generate onboarding link
  const link = await createAccountLink(account.id);

  // Send redirect
  res.json({ onboardingUrl: link.url });
});
```

## Payment Flow in Connect

### Using Application Fee

```javascript
const createCharge = async (amount, sellerAccountId, customerId) => {
  const charge = await stripe.charges.create(
    {
      amount: Math.floor(amount * 100),  // Amount in cents
      currency: 'usd',
      customer: customerId,
      description: 'Marketplace purchase'
    },
    {
      stripeAccount: sellerAccountId  // Charge under seller account
    }
  );

  return charge;
};

// The platform automatically takes a fee
// You configure the fee in Stripe Dashboard
// Or use application_fee parameter:

const createChargeWithFee = async (amount, sellerAccountId, customerId) => {
  const platformFee = Math.floor(amount * 0.1);  // 10% fee
  
  const charge = await stripe.charges.create(
    {
      amount: Math.floor(amount * 100),
      currency: 'usd',
      customer: customerId,
      description: 'Marketplace purchase',
      application_fee: platformFee  // Platform keeps this
    },
    {
      stripeAccount: sellerAccountId
    }
  );

  return charge;
};
```

## Transferring Funds to Sellers

### Automatic Transfers

Stripe Connect handles transfers automatically:
```
Day 1: Customer charged $100
Day 1-2: Funds settle in your Stripe account
Day 2: Automatic transfer of $90 to seller account
       Your platform keeps $10 fee
```

### Manual Transfers

```javascript
const transferToSeller = async (sellerAccountId, amount) => {
  const transfer = await stripe.transfers.create({
    amount: Math.floor(amount * 100),
    currency: 'usd',
    destination: sellerAccountId,
    description: 'Monthly payout'
  });

  return transfer;
};

// Usage
await transferToSeller('acct_1234...', 500);  // Transfer $500 to seller
```

## Handling Payouts

### View Seller Balance

```javascript
const getSellerBalance = async (sellerAccountId) => {
  const balance = await stripe.balance.retrieve(
    {},
    { stripeAccount: sellerAccountId }
  );

  return balance;
  
  /* Returns:
  {
    object: 'balance',
    available: [
      { amount: 50000, currency: 'usd' }
    ],
    pending: [
      { amount: 0, currency: 'usd' }
    ]
  }
  */
};
```

### Configure Seller Payouts

```javascript
const configurePayouts = async (sellerAccountId) => {
  const account = await stripe.accounts.update(
    sellerAccountId,
    {
      settings: {
        payouts: {
          statement_descriptor: 'MARKETPLACE PAYOUT',
          schedule: {
            interval: 'daily',  // daily, weekly, monthly
            weighted_average_delay: 2  // Days delay
          }
        }
      }
    }
  );

  return account;
};
```

## Handling Disputes in Connect

### Dispute Lifecycle

```
Customer disputes charge with their bank
         ↓
Stripe → Your webhook: charge.dispute.created
         ↓
You notify seller → Seller has 7 days to respond
         ↓
Seller submits evidence via Stripe
         ↓
Your webhook: charge.dispute.closed
         ↓
Funds either stay or are refunded
```

### Webhook Handler

```javascript
app.post('/webhooks/stripe', express.raw({ type: 'application/json' }), async (req, res) => {
  const sig = req.headers['stripe-signature'];
  let event;

  try {
    event = stripe.webhooks.constructEvent(
      req.body,
      sig,
      process.env.STRIPE_WEBHOOK_SECRET
    );
  } catch (err) {
    return res.status(400).send(`Webhook Error: ${err.message}`);
  }

  // Handle Connect account disputes
  if (event.type === 'charge.dispute.created') {
    const { object: charge } = event.data;
    
    // Find seller
    const seller = await db.sellers.findOne({
      stripeAccountId: charge.connected_account_id
    });

    // Notify seller
    await sendEmail(seller.email, {
      subject: 'Payment Dispute on Your Order',
      body: `Customer disputed charge: ${charge.id}`
    });

    // Store dispute
    await db.disputes.insert({
      chargeId: charge.id,
      sellerId: seller.id,
      amount: charge.amount,
      status: 'pending'
    });
  }

  res.json({ received: true });
});
```

## Multi-Tenant Payments

### Scenario: Multiple Sellers, One Marketplace

```
Platform: www.marketplace.com

Seller 1: John Sells Electronics
Seller 2: Jane Sells Clothes
Seller 3: Bob Sells Books

Customer buys:
- $50 electronics from John
- $30 clothes from Jane
- $20 books from Bob

Stripe Connect handles:
1. Single $100 charge to customer card
2. Platform keeps $10 (10% fee)
3. John gets $45
4. Jane gets $27
5. Bob gets $18
```

## Implementation

```javascript
class MarketplacePaymentSystem {
  
  async processMultiSellerOrder(order, chargeAmount) {
    // order structure:
    // {
    //   items: [
    //     { sellerId, amount: 50 },
    //     { sellerId, amount: 30 },
    //     { sellerId, amount: 20 }
    //   ]
    // }

    const platformFee = chargeAmount * 0.10;  // 10%
    const sellerPayouts = {};

    // Calculate each seller's payout
    for (const item of order.items) {
      const seller = await db.sellers.findById(item.sellerId);
      const sellerAmount = item.amount * 0.90;  // After 10% fee

      if (!sellerPayouts[seller.stripeAccountId]) {
        sellerPayouts[seller.stripeAccountId] = 0;
      }
      sellerPayouts[seller.stripeAccountId] += sellerAmount;
    }

    // Create charges for each seller account
    const charges = [];
    for (const [accountId, amount] of Object.entries(sellerPayouts)) {
      const charge = await stripe.charges.create(
        {
          amount: Math.floor(amount * 100),
          currency: 'usd',
          customer: order.customerId,
          application_fee: Math.floor(platformFee * 100 / Object.keys(sellerPayouts).length)
        },
        { stripeAccount: accountId }
      );

      charges.push(charge);
    }

    // Store transaction
    await db.transactions.insert({
      orderId: order.id,
      totalAmount: chargeAmount,
      platformFee: platformFee,
      charges: charges,
      payouts: sellerPayouts
    });

    return charges;
  }
}
```

## Dashboard for Sellers

```javascript
app.get('/api/sellers/:sellerId/dashboard', async (req, res) => {
  const seller = await db.sellers.findById(req.params.sellerId);
  const stripeAccount = seller.stripeAccountId;

  // Get balance
  const balance = await stripe.balance.retrieve(
    {},
    { stripeAccount }
  );

  // Get recent charges
  const charges = await stripe.charges.list(
    { limit: 10 },
    { stripeAccount }
  );

  // Get payouts
  const payouts = await stripe.payouts.list(
    { limit: 10 },
    { stripeAccount }
  );

  res.json({
    available: balance.available[0]?.amount / 100,
    pending: balance.pending[0]?.amount / 100,
    recentCharges: charges.data.map(c => ({
      id: c.id,
      amount: c.amount / 100,
      date: c.created,
      status: c.status
    })),
    recentPayouts: payouts.data.map(p => ({
      id: p.id,
      amount: p.amount / 100,
      date: p.created,
      status: p.status
    }))
  });
});
```

## Verification and Compliance

### Seller Verification

```javascript
const checkSellerVerificationStatus = async (sellerAccountId) => {
  const account = await stripe.accounts.retrieve(sellerAccountId);

  return {
    chargesEnabled: account.charges_enabled,
    payoutsEnabled: account.payouts_enabled,
    requirements: {
      currentDeadline: account.requirements?.current_deadline,
      currentlyDue: account.requirements?.currently_due,
      pastDue: account.requirements?.past_due,
      pendingVerification: account.requirements?.pending_verification
    }
  };
};

// If verification incomplete, notify seller:
app.get('/api/sellers/:id/verify-status', async (req, res) => {
  const seller = await db.sellers.findById(req.params.id);
  const status = await checkSellerVerificationStatus(seller.stripeAccountId);

  if (status.requirements.currentlyDue?.length > 0) {
    return res.json({
      onboardingIncomplete: true,
      missingDocuments: status.requirements.currentlyDue,
      deadline: status.requirements.currentDeadline
    });
  }

  res.json({ verified: true });
});
```

## Best Practices

✅ Test with Stripe test accounts first  
✅ Implement proper error handling  
✅ Monitor disputes closely  
✅ Keep seller info updated  
✅ Secure API keys with .env  
✅ Validate all seller data  
✅ Handle account limitations  
✅ Provide seller dashboard  
✅ Implement fraud detection  
✅ Regular settlement reconciliation  

## Real-World Example: Gig Economy Platform

```
Platform: Freelancer Marketplace
Customer: Hires freelancer for $100 project

Flow:
1. Customer pays $100
2. Platform takes 20% = $20
3. Freelancer gets 80% = $80

Connect Handles:
- Customer → Stripe → Customer account charged
- $20 stays with platform
- $80 transferred to freelancer's Stripe account
- Freelancer can withdraw to bank or PayPal

Disputes:
- Freelancer didn't complete work → Customer disputes
- Freelancer submits previous work → Stripe decides
- Platform mediates if needed
```

## Cost Considerations

Stripe Connect fees:
- **Transaction fee**: 2.2% + $0.30 per transaction
- **Payout fee**: Varies by bank transfer method
- **Dispute fee**: $15 per dispute (refund if won)
- **Verification**: Free

## Summary

Stripe Connect enables marketplace payments:

1. Create seller accounts
2. Process multi-seller transactions
3. Distribute payments automatically
4. Handle disputes and verification
5. Provide seller dashboard

## Key Takeaways

1. Express account best for most marketplaces
2. Create account link for easy onboarding
3. Apply fees automatically
4. Handle disputes via webhooks
5. Provide seller dashboard
6. Monitor verification status
7. Test extensively before launch
8. Secure all credentials properly
