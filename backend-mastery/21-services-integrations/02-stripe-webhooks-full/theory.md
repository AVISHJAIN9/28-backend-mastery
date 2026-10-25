# Stripe Webhooks - Theory

## Overview
Stripe webhooks provide real-time notifications of events in your account.

## Key Concepts

### 1. Payment Intent Flow
- Client creates payment intent
- Stripe returns client secret
- Client confirms payment
- Webhook notifies server of success/failure

### 2. Webhook Events
- `charge.succeeded` - Payment successful
- `charge.failed` - Payment declined
- `payment_intent.succeeded` - Intent confirmed
- `customer.subscription.created` - New subscription
- `invoice.paid` - Invoice payment received

### 3. Signature Verification
- Sign webhook with shared secret
- Validate signature on receipt
- Prevents spoofed webhooks

## Security Considerations

### API Key Protection
- Store in .env, never commit
- Rotate regularly
- Use restricted keys for frontend

### Webhook Verification
```javascript
const signature = req.headers['stripe-signature'];
const event = stripe.webhooks.constructEvent(
  rawBody,
  signature,
  webhookSecret
);
```

### Idempotency
- Process each event only once
- Store webhook IDs
- Handle retries safely

## Error Handling

### Card Errors
- Card declined
- Expired card
- Insufficient funds

### Rate Limiting
- Implement exponential backoff
- Cache responses
- Monitor usage

## Best Practices

1. Verify webhook signatures
2. Process asynchronously
3. Log all events
4. Implement idempotency
5. Monitor failure rates
6. Set up alerts

## Implementation Checklist

- [ ] Create Stripe account
- [ ] Get API keys
- [ ] Implement payment intents
- [ ] Set up webhook endpoint
- [ ] Verify signatures
- [ ] Handle all event types
- [ ] Monitor and log events
- [ ] Set up alerts
- [ ] Test with Stripe test keys
- [ ] Deploy to production
