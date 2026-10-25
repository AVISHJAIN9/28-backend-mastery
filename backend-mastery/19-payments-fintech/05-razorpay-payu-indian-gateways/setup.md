# Module 05: Razorpay & PayU - Setup

## Dependencies
```bash
npm install
```

## Environment Variables
```bash
cp .env.example .env
```
Edit `.env`:
```
HTTP_PORT=6105
NODE_ENV=development
USE_MOCK_GATEWAYS=true

# Optional: Real credentials
# RAZORPAY_KEY_ID=rzp_test_...
# RAZORPAY_KEY_SECRET=...
```

Get credentials: https://razorpay.com/dashboard

## How to run
```bash
npm start
```
Server: http://localhost:6105

## How to test

**CRITICAL:** Razorpay uses **PAISE** not rupees!
- ₹500 = 50000 paise

**Razorpay Order:**
```bash
curl -X POST http://localhost:6105/api/razorpay/orders \
  -H "Content-Type: application/json" \
  -d '{"amount": 50000, "currency": "INR"}'
```

**PayU Link:**
```bash
curl -X POST http://localhost:6105/api/payu/payment-links \
  -H "Content-Type: application/json" \
  -d '{"amount": 500, "email": "user@test.com"}'
```

**Using React UI:**
1. `npm start`
2. Open `preview.html`
3. Select payment methods (UPI, NetBanking, Cards)
4. Create orders/links
