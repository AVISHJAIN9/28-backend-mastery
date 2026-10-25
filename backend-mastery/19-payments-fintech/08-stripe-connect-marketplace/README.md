# Stripe Connect - Marketplace

## Overview
Build a multi-vendor marketplace with automated payment distribution. Connect sellers, process charges, handle disputes.

## Setup

### 1. Install Dependencies
```bash
cd 08-stripe-connect-marketplace
npm install
```

### 2. Configure Environment
```bash
cp .env.example .env
# Add Stripe credentials
STRIPE_SECRET_KEY=sk_test_...
```

### 3. Run the Server
```bash
npm start
# Server runs on http://localhost:6108
```

## Architecture

```
Customer (Buyer)
    ↓ Pays
Marketplace (Your App) ← Receives full amount
    ↓ Distributes
Seller (Vendor) ← Gets 90% (you keep 10%)
```

## Fee Structure

| Role | Revenue |
|------|----------|
| **Customer Pays** | $100 |
| **Platform (You)** | $10 (10%) |
| **Seller** | $90 (90%) |

## API Endpoints

**Sellers:**
| Method | Endpoint | Description |
|--------|----------|-------------|
| POST | `/api/sellers` | Register seller |
| GET | `/api/sellers/:id` | Get seller info |
| GET | `/api/sellers/:id/dashboard` | Seller dashboard |

**Charges:**
| Method | Endpoint | Description |
|--------|----------|-------------|
| POST | `/api/charges` | Create charge (seller payment) |
| GET | `/api/charges/:id` | Get charge details |

## Seller States

```
PREPARING → PENDING_VERIFICATION → VERIFIED
                                  ↓
                               REJECTED
```

## Real-World Flow

1. **Seller Registration**
   - Email, name, business info
   - Stripe account created

2. **Customer Purchases**
   - Charges marketplace
   - Platform deducts 10% fee
   - Transfers 90% to seller

3. **Seller Withdrawal**
   - Seller can withdraw balance
   - Automatic payouts scheduled

## Testing

**Register Seller:**
```bash
curl -X POST http://localhost:6108/api/sellers \
  -H "Content-Type: application/json" \
  -d '{
    "email": "seller@store.com",
    "businessName": "John Store"
  }'
```

**Process Charge:**
```bash
curl -X POST http://localhost:6108/api/charges \
  -H "Content-Type: application/json" \
  -d '{
    "amount": 10000,
    "sellerId": "seller_123",
    "customerId": "cust_456"
  }'
```

## Next Steps

1. Read theory.md for marketplace concepts
2. Understand fee calculation in controller.js
3. Review transfer logic
4. **Congratulations! You've completed all 8 modules!** 🎓
