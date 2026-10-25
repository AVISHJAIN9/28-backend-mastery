# Subscription Proration - Theory & Concepts

## What is Subscription Billing?

Subscription billing is a recurring payment model where customers are charged at regular intervals (daily, weekly, monthly, yearly).

### Common Subscription Models

1. **Monthly** - $9.99/month
2. **Annual** - $99/year (often discounted)
3. **Variable usage** - Pay-as-you-go + base fee
4. **Tiered** - Different features at different prices

## The Proration Problem

### Scenario

Customer subscribes to **$10/month** service:
- Subscription starts: January 1
- Customer upgrades to **$20/month** on January 15
- Next billing: February 1

**Question**: What should be charged on January 15?

### Without Proration
```
Option 1: No charge
  Customer gets unlimited time on $20 plan = Unfair to company

Option 2: Charge full $20
  Customer used $10 plan most of month = Unfair to customer
```

### With Proration
```
January 1-14: $10 plan (14 days used)
January 15-31: $20 plan (17 days remaining)

Cost for remaining period: $20 × (17/31) = $10.97

Amount to charge: $10.97 - $0 (already paid) = $10.97

Fair to both!
```

## Proration Formula

### Basic Calculation

```javascript
function calculateProration(
  dailyRate,
  daysRemaining,
  amountAlreadyPaid
) {
  const costForRemaining = dailyRate * daysRemaining;
  const creditFromOldPlan = amountAlreadyPaid;
  const amountDue = costForRemaining - creditFromOldPlan;
  
  return Math.max(0, amountDue);  // Never negative
}

// Example
const oldRate = 10 / 31;  // $10/month = $0.323/day
const daysRemaining = 17;
const amountPaid = 10;  // Already paid $10 for month

const amountDue = calculateProration(oldRate, daysRemaining, amountPaid);
// = (0.323 * 17) - 10 = 5.49 - 10 = 0 (customer gets credit)
```

## Types of Proration

### 1. Upgrade - Customer Moves to Higher Price

```
Old plan: $10/month
New plan: $20/month
Days used of old: 14
Days remaining: 17
Daily rate of old: $10/31 = $0.323
Daily rate of new: $20/31 = $0.645

Cost for remaining new plan: $0.645 × 17 = $10.97
Credit from old plan: $10.00 (already paid)
Amount due: $10.97 - $10.00 = $0.97

Action: Charge $0.97 immediately
        Next full billing cycle: $20 (no proration)
```

### 2. Downgrade - Customer Moves to Lower Price

```
Old plan: $20/month
New plan: $10/month
Days used of old: 14
Days remaining: 17

Cost for remaining new plan: ($10/31) × 17 = $5.48
Amount already paid: $20.00 (full month prepaid)
Amount due: $5.48 - $20.00 = -$14.52

Action: Store -$14.52 as account credit
        Apply credit to next billing cycles
        Or refund if customer cancels
```

### 3. Mid-Cycle Cancellation

```
Subscription started: Jan 1
Cancelled: Jan 15
Amount paid: $10 (full month)
Refund eligible: $10 × (17/31) = $5.48

Action: Refund $5.48
```

## Proration Rules

### Rule 1: Credit Old Plan
When upgrading, credit the customer for unused portion of old plan:
```
creditAmount = oldPlanCost × (daysRemaining / daysInBillingPeriod)
```

### Rule 2: Charge New Plan
Charge for the new plan starting immediately:
```
chargeAmount = newPlanCost × (daysRemaining / daysInBillingPeriod)
```

### Rule 3: Net Amount
```
amountDue = chargeAmount - creditAmount
  If > 0: Invoice customer
  If < 0: Store as credit in customer account
  If = 0: No action needed
```

### Rule 4: Next Billing Cycle
After proration change, next billing is the full amount:
```
Jan 15: Upgrade ($0.97 due)
Feb 1: Full new price ($20.00 due)
Mar 1: Full new price ($20.00 due)
```

## Implementation

### Data Model

```javascript
const subscription = {
  customerId: 'cus_123',
  planId: 'plan_monthly_10',
  planPrice: 1000,  // $10 in cents
  billingCycleDays: 31,
  startDate: '2024-01-01',
  currentPeriodStart: '2024-01-01',
  currentPeriodEnd: '2024-02-01',
  status: 'active'
};

const proratedTransaction = {
  subscriptionId: 'sub_123',
  type: 'upgrade',
  fromPlan: 'plan_monthly_10',
  toPlan: 'plan_monthly_20',
  changeDate: '2024-01-15',
  creditAmount: 1000,  // Credit from old plan
  chargeAmount: 1097,  // Charge for new plan
  netAmount: 97,       // Amount due: 1097 - 1000
  invoiced: true,
  chargeId: 'ch_123'
};
```

### Proration Engine

```javascript
class ProratingSubscriptionEngine {
  
  async upgradeSubscription(subscriptionId, newPlanId, effectiveDate) {
    const subscription = await db.subscriptions.findById(subscriptionId);
    const oldPlan = await db.plans.findById(subscription.planId);
    const newPlan = await db.plans.findById(newPlanId);
    
    // Calculate days in billing cycle
    const billingStart = new Date(subscription.currentPeriodStart);
    const billingEnd = new Date(subscription.currentPeriodEnd);
    const totalDays = Math.floor((billingEnd - billingStart) / (1000 * 60 * 60 * 24));
    
    // Calculate days used and remaining
    const daysUsed = Math.floor((new Date(effectiveDate) - billingStart) / (1000 * 60 * 60 * 24));
    const daysRemaining = totalDays - daysUsed;
    
    // Calculate daily rates
    const oldDailyRate = oldPlan.price / totalDays;
    const newDailyRate = newPlan.price / totalDays;
    
    // Calculate amounts
    const creditAmount = Math.floor(oldDailyRate * daysRemaining);  // Credit unused portion
    const chargeAmount = Math.floor(newDailyRate * daysRemaining); // Charge new plan for remaining
    const netAmount = chargeAmount - creditAmount;
    
    // Create transaction record
    const transaction = {
      subscriptionId,
      type: 'upgrade',
      fromPlan: subscription.planId,
      toPlan: newPlanId,
      changeDate: effectiveDate,
      creditAmount,
      chargeAmount,
      netAmount,
      invoiced: false
    };
    
    await db.proratedTransactions.insert(transaction);
    
    // If amount due, create invoice
    if (netAmount > 0) {
      const invoice = await this.createInvoice(subscription, netAmount);
      await this.chargePayment(subscription, invoice);
    } else if (netAmount < 0) {
      // Store as account credit
      await db.customerCredits.increment(
        subscription.customerId,
        Math.abs(netAmount)
      );
    }
    
    // Update subscription
    await db.subscriptions.updateOne(
      { _id: subscriptionId },
      {
        planId: newPlanId,
        currentPeriodStart: effectiveDate
        // Keep currentPeriodEnd same
      }
    );
    
    return transaction;
  }
  
  async downgradeSubscription(subscriptionId, newPlanId, effectiveDate) {
    // Similar logic, but creates credit instead of invoice
    const response = await this.upgradeSubscription(subscriptionId, newPlanId, effectiveDate);
    return response;
  }
}
```

## Stripe Integration

Stripe handles proration automatically:

```javascript
const stripe = require('stripe')(process.env.STRIPE_SECRET_KEY);

// Upgrade with automatic proration
const subscription = await stripe.subscriptions.update(
  'sub_123', 
  {
    items: [
      {
        id: 'si_123', // Subscription item
        price: 'price_20_monthly'  // New price
      }
    ],
    proration_behavior: 'create_prorations'  // Automatic proration
  }
);

// Proration options:
// 'create_prorations' - Create invoice for proration immediately
// 'none' - No proration, just change price next cycle
// 'always_invoice' - Always in voice even if credit
```

## Edge Cases

### Case 1: Free Trial Period

```javascript
// Customer on free trial
if (subscription.trialEndsAt > now) {
  // No proration during free trial
  // Start paid plan from trial end date
  effectiveDate = subscription.trialEndsAt;
}
```

### Case 2: Annual to Monthly (Different Cycles)

```javascript
// Annual: $100/year charged Jan 1
// Downgrade to Monthly: $10/month on Feb 15

// Days used: 45
// Days remaining in year: 320
// Refund: $100 × (320/365) = $87.67
// Store as credit to apply to monthly plan
```

### Case 3: Same Price Different Plan

```javascript
// Customer moves: Plan A ($10) → Plan B ($10)
// No proration needed
// Just update plan reference
neatAmount = 0;  // Skip invoicing
```

### Case 4: Billing Date Mismatch

```javascript
// Some systems align billing dates after change:
// Change: Jan 15
// Next billing: Feb 1 (consistent date)
// OR
// Next billing: Feb 15 (anniversary date)

// Choose based on business policy
```

## Customer Communication

```javascript
const generateProratedInvoice = (transaction) => {
  return `
    You've upgraded your subscription!
    
    Old plan credit: -$${transaction.creditAmount / 100}
    New plan charge: +$${transaction.chargeAmount / 100}
    Amount due: $${transaction.netAmount / 100}
    
    New billing date: ${transaction.nextBillingDate}
    Your new monthly cost: $${newPlan.price / 100}
  `;
};
```

## Best Practices

✅ Always prorate upgrades/downgrades  
✅ Be transparent with customers  
✅ Use automated billing system (Stripe, Zuora)  
✅ Handle edge cases (trials, annual plans)  
✅ Communicate changes clearly  
✅ Audit proration amounts  
✅ Test calculations thoroughly  
✅ Handle refunds promptly  

## Anti-Patterns

❌ Don't charge for partial usage without crediting old plan  
❌ Don't apply proration to next billing cycle only  
❌ Don't ignore proration when customer requests change  
❌ Don't calculate days incorrectly (account for leap years, etc.)  

## Real-World Example: SaaS Pricing Change

```
Customer on Professional plan: $99/month
March 1: Starts subscription
April 1: Full month charged

April 15: Wants to move to Enterprise: $199/month

Proration:
- Days in April: 30
- Days used: 15
- Days remaining: 15

Old plan credit: $99 × (15/30) = $49.50
New plan charge: $199 × (15/30) = $99.50
Amount due: $99.50 - $49.50 = $50.00

Action: Charge $50 immediately
Next billing (May 1): Charge full $199
```

## Testing Proration

```javascript
test('Proration calculation: Upgrade', () => {
  const oldRate = 1000 / 31;  // $10/month
  const daysRemaining = 17;
  const amountPaid = 1000;
  const newRate = 2000 / 31;  // $20/month
  
  const chargeAmount = Math.floor(newRate * daysRemaining);
  const creditAmount = Math.floor(oldRate * daysRemaining);
  const netAmount = chargeAmount - amountPaid;
  
  expect(chargeAmount).toBe(1097);
  expect(creditAmount).toBe(548);
  expect(netAmount).toBe(97);
});
```

## Summary

Proration is essential for fair subscription billing:

1. **Credit unused portion** of old plan
2. **Charge prorated amount** of new plan
3. **Calculate net amount** due from customer
4. **Handle edge cases** (trials, annual plans)
5. **Use automated system** (Stripe, Zuora)
6. **Communicate clearly** with customers

## Key Takeaways

1. Proration = fairness in subscription changes
2. Always credit unused time from old plan
3. Charge new plan for remaining period
4. Net amount can be positive (charge) or negative (credit)
5. Annual and multi-year plans need special handling
6. Automate with payment processor
7. Test edge cases thoroughly
8. Communicate changes to customers
