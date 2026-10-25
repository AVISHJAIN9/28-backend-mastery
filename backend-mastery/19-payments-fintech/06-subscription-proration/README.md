# Subscription Proration

## Overview
Calculate fair pro-rata charges when customers upgrade/downgrade plans mid-cycle. Essential for recurring revenue models.

## Setup

### 1. Install Dependencies
```bash
cd 06-subscription-proration
npm install
```

### 2. Run the Server
```bash
npm start
# Server runs on http://localhost:6106
```

## Pricing Plans

| Plan | Price | Daily |
|------|-------|-------|
| **Starter** | $99/month | $3.30/day |
| **Professional** | $199/month | $6.63/day |
| **Enterprise** | $499/month | $16.63/day |

## The Proration Formula

```
1. daysRemaining = endDate - today
2. creditAmount = oldDailyRate × daysRemaining
3. chargeAmount = newDailyRate × daysRemaining
4. netAmount = chargeAmount - creditAmount
```

## Real-World Example

**Timeline:**
- Jan 1: Subscribe to Starter ($3.30/day)
- Jan 20: Upgrade to Professional ($6.63/day)
- Jan 31: Next billing

**Calculation:**
```
Days remaining = 31 - 20 = 11 days
Credit (Starter) = $3.30 × 11 = $36.30
Charge (Professional) = $6.63 × 11 = $72.93
Net amount due = $72.93 - $36.30 = $36.63
```

Customer only pays **$36.63**, not full $199!

## API Endpoints

| Method | Endpoint | Description |
|--------|----------|-------------|
| POST | `/api/subscriptions` | Create subscription |
| GET | `/api/subscriptions/:id` | Get subscription |
| POST | `/api/subscriptions/:id/change-plan` | Upgrade/downgrade |
| POST | `/api/subscriptions/:id/calculate-proration` | Calculate charges |

## Testing

```bash
curl -X POST http://localhost:6106/api/subscriptions \
  -H "Content-Type: application/json" \
  -d '{"customerId": "cust_123", "planId": "starter"}'
```

## Next Steps

1. Read theory.md for billing concepts
2. Study proration in controller.js
3. Test with different plan combinations
4. Move to Module 07: Refunds & Chargebacks
