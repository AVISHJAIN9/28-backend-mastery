# Module 01: Stripe Webhook Lifecycle - Setup

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
STRIPE_SECRET_KEY=sk_test_...
STRIPE_PUBLISHABLE_KEY=pk_test_...
WEBHOOK_SECRET=whsec_test_...
HTTP_PORT=6101
NODE_ENV=development
```

Get keys from https://dashboard.stripe.com/test/apikeys

## How to run
```bash
npm start
```
Server: http://localhost:6101

## How to test

**Using Stripe CLI:**
```bash
stripe listen --forward-to localhost:6101/api/webhooks/stripe
# In another terminal:
stripe trigger charge.succeeded
```

**Using React UI:**
1. `npm start`
2. Open `preview.html` in browser
3. Create orders → See webhook events
