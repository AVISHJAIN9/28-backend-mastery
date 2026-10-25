# 02 - Stripe Webhooks Full Integration

Complete Stripe payment processing with webhooks for real-time event handling.

## Features

✅ **Payment Intents** - Create and track payment intents  
✅ **Customers** - Manage customer profiles and payment methods  
✅ **Subscriptions** - Create and manage recurring billing  
✅ **Webhooks** - Real-time event handling  
✅ **Refunds** - Process refunds and chargebacks  
✅ **Error Handling** - Stripe-specific error management  

## Quick Start

```bash
npm install
cp .env.example .env
# Add STRIPE_SECRET_KEY to .env
npm run dev
```

## API Endpoints

| Method | Endpoint | Description |
|--------|----------|-------------|
| POST | `/api/payments/intent` | Create payment intent |
| GET | `/api/payments/intent/:paymentIntentId` | Get payment details |
| POST | `/api/customers` | Create customer |
| POST | `/api/subscriptions` | Create subscription |
| DELETE | `/api/subscriptions/:subscriptionId` | Cancel subscription |
| POST | `/api/refunds` | Create refund |
| POST | `/api/webhook` | Stripe webhook endpoint |
| GET | `/api/webhook/events` | Get webhook events |

## Security

- ✅ Webhook signature verification
- ✅ API key in environment variables
- ✅ Input validation
- ✅ Error message sanitization

## Testing

```bash
# Start server
npm run dev

# Create payment (requires valid payment method ID)
curl -X POST http://localhost:6302/api/payments/intent \
  -H "Content-Type: application/json" \
  -d '{
    "amount": 50,
    "paymentMethod": "pm_xxx"
  }'

# View webhook events
curl http://localhost:6302/api/webhook/events
```

## Environment Variables

```env
STRIPE_SECRET_KEY      # Your Stripe secret key
STRIPE_WEBHOOK_SECRET  # Webhook signing secret
HTTP_PORT             # Server port (default: 6302)
FRONTEND_URL          # Frontend origin
NODE_ENV              # development/production
```

## References

- [Stripe API Docs](https://stripe.com/docs/api)
- [Webhooks Guide](https://stripe.com/docs/webhooks)
- [Payment Intents](https://stripe.com/docs/payments/payment-intents)
