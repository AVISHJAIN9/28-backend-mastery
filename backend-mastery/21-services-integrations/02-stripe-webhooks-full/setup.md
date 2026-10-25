# Setup Guide - Stripe Webhooks

## Step 1: Create Stripe Account

1. Go to https://stripe.com
2. Sign up for a Stripe account
3. Verify your email
4. Complete onboarding

## Step 2: Get API Keys

1. Log in to Stripe Dashboard
2. Go to Developers → API keys
3. Copy your Secret Key (starts with `sk_`)
4. Copy your Publishable Key (starts with `pk_`)
5. Never share the secret key

## Step 3: Create Webhook Endpoint

1. Go to Developers → Webhooks
2. Click "Add endpoint"
3. Enter URL: `http://yourdomain.com/api/webhook`
4. Select events to listen (charge.succeeded, etc.)
5. Copy the Signing Secret (starts with `whsec_`)

## Step 4: Install Dependencies

```bash
npm install
```

## Step 5: Configure Environment

```bash
cp .env.example .env
```

Edit `.env`:

```env
STRIPE_SECRET_KEY=sk_test_xxxxx
STRIPE_WEBHOOK_SECRET=whsec_xxxxx
HTTP_PORT=6302
FRONTEND_URL=http://localhost:3000
NODE_ENV=development
```

## Step 6: Start Server

```bash
npm run dev
```

Expected output:
```
Server running on port 6302
✅ Module: 02 Stripe Webhooks
```

## Step 7: Test Payment Creation

```bash
curl http://localhost:6302/health
```

## Step 8: Test Stripe Webhook Locally

Use Stripe CLI for local testing:

```bash
# Install Stripe CLI
brew install stripe/stripe-cli/stripe

# Login to your account
stripe login

# Forward webhooks to local endpoint
stripe listen --forward-to localhost:6302/api/webhook

# See the signing secret and use in .env
```

## Step 9: Trigger Test Events

```bash
stripe trigger payment_intent.succeeded
stripe trigger customer.subscription.created
```

## Step 10: Verify Webhook Reception

```bash
curl http://localhost:6302/api/webhook/events
```

You should see the triggered events.

## Troubleshooting

### "Unauthorized" on stripe API calls
- Verify STRIPE_SECRET_KEY is correct
- Ensure it's the SECRET key, not publishable
- Restart the server

### Webhook signature verification fails
- Check STRIPE_WEBHOOK_SECRET is correct
- Verify raw body is being passed (not JSON parsed)
- Check timestamp hasn't expired

### Events not being received
- Verify webhook URL is accessible
- Check firewall/NAT settings
- Use Stripe CLI to test locally
- Check application logs

## Production Setup

1. Use Stripe production keys
2. Deploy to HTTPS endpoint
3. Register webhook in Stripe dashboard
4. Monitor webhook deliveries
5. Implement retry logic
6. Set up alerts for failures
7. Log all events to database
8. Monitor financial transactions

## Testing Checklist

- [ ] API keys configured
- [ ] Server starts without errors
- [ ] Health endpoint works
- [ ] Customer creation works
- [ ] Payment intent creation works
- [ ] Webhooks are received
- [ ] Events are logged
- [ ] Error handling works

## Resources

- [Stripe Dashboard](https://dashboard.stripe.com)
- [API Documentation](https://stripe.com/docs/api)
- [Webhooks Guide](https://stripe.com/docs/webhooks)
- [Stripe CLI](https://stripe.com/docs/stripe-cli)
