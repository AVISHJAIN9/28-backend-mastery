# Razorpay & PayU - Indian Payment Gateways

## Overview
Integrate with India's leading payment processors. Support multiple payment methods: UPI, NetBanking, Cards, EMI, Wallets.

## Setup

### 1. Install Dependencies
```bash
cd 05-razorpay-payu-indian-gateways
npm install
```

### 2. Configure Environment
```bash
cp .env.example .env
# Add your Razorpay and PayU API credentials
```

### 3. Run the Server
```bash
npm start
# Server runs on http://localhost:6105
```

## API Endpoints

**Razorpay:**
| Method | Endpoint | Description |
|--------|----------|-------------|
| POST | `/api/razorpay/orders` | Create order |
| POST | `/api/razorpay/create-payment` | Create payment |
| POST | `/api/razorpay/verify` | Verify payment signature |

**PayU:**
| Method | Endpoint | Description |
|--------|----------|-------------|
| POST | `/api/payu/payment-links` | Create payment link |
| POST | `/api/payu/callback` | Payment callback handler |

## Payment Methods

- **UPI** - Fast mobile payments, instant settlement
- **NetBanking** - Bank account transfer, all Indian banks
- **Cards** - Visa, MasterCard, Amex
- **EMI** - Buy now, pay later with fixed payments
- **Wallets** - Paytm, Freecharge, Mobikwik

## Key Difference: Paise vs Rupees

**Razorpay uses paise (paisa), not rupees!**
```javascript
// Amount of ₹500 = 50000 paise
const amountInPaise = amountInRupees * 100;
```

## Testing

**Razorpay Order:**
```bash
curl -X POST http://localhost:6105/api/razorpay/orders \
  -H "Content-Type: application/json" \
  -d '{
    "amount": 50000,
    "currency": "INR",
    "description": "Product purchase"
  }'
```

## Real-World Flow

1. Create order → Returns order ID
2. Customer selects payment method
3. Payment processing
4. Webhook confirmation
5. Settlement (auto/manual)

## Next Steps

1. Read theory.md for regional concepts
2. Get Razorpay & PayU test credentials
3. Test payment flow with React UI
4. Move to Module 06: Subscription Proration
