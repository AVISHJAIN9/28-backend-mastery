# Module 08: Stripe Connect Marketplace - Setup

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
HTTP_PORT=6108
NODE_ENV=development
STRIPE_SECRET_KEY=sk_test_...
STRIPE_PUBLISHABLE_KEY=pk_test_...
```

Get keys: https://dashboard.stripe.com/test/apikeys

## How to run
```bash
npm start
```
Server: http://localhost:6108

## How to test

**Fee Distribution:** Customer pays $100 → Platform $10 (10%), Seller $90 (90%)

**Register Seller:**
```bash
curl -X POST http://localhost:6108/api/sellers \
  -H "Content-Type: application/json" \
  -d '{"email": "seller@shop.com", "businessName": "Shop"}'
```

**Process Charge (Auto-Transfer to Seller):**
```bash
curl -X POST http://localhost:6108/api/charges \
  -H "Content-Type: application/json" \
  -d '{"amount": 10000, "sellerId": "seller_123", "customerId": "cust_456"}'
```

**Using React UI:**
1. `npm start`
2. Open `preview.html`
3. Register sellers
4. Process charges → See automatic fee split
