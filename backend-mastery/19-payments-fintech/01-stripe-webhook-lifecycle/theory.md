# Stripe Webhook Lifecycle - Theory & Concepts

## What is a Webhook?

A webhook is an HTTP callback that allows you to receive real-time updates from Stripe. Instead of polling Stripe's API to check for payment status changes, Stripe sends event notifications directly to your application via HTTP POST requests.

### Key Characteristics of Webhooks

1. **Real-time Updates** - Instant notification when events occur
2. **Asynchronous** - Non-blocking, happens in background
3. **Reliable Delivery** - Stripe retries failed deliveries
4. **Cryptographically Signed** - Ensure authenticity
5. **Ordered** - Events arrive in sequence

## Webhook Security

Stripe webhooks require verification to ensure they come from Stripe, not an attacker.

### Verification Steps

1. **Capture the signature** from `Stripe-Signature` header
2. **Get the webhook secret** from Stripe Dashboard
3. **Reconstruct the signed content** - `timestamp.payload`
4. **Compute expected signature** using HMAC-SHA256
5. **Compare signatures** - must match exactly
6. **Check timestamp** - prevent replay attacks (within 5 minutes)

### Why Signature Verification?

- Prevents spoofed webhook events
- Ensures original payload wasn't modified
- Protects against replay attacks
- Required for compliance/security best practices

## Common Stripe Events

### Payment Events
- `charge.created` - Charge created
- `charge.succeeded` - Charge completed successfully
- `charge.failed` - Charge failed
- `charge.refunded` - Charge refunded
- `charge.updated` - Charge metadata updated

### Payment Intent Events
- `payment_intent.created` - Payment intent created
- `payment_intent.succeeded` - Payment succeeded
- `payment_intent.payment_failed` - Payment failed
- `payment_intent.canceled` - Payment canceled

### Dispute Events
- `charge.dispute.created` - Dispute created
- `charge.dispute.updated` - Dispute updated
- `charge.dispute.closed` - Dispute closed

### Customer Events
- `customer.created` - Customer created
- `customer.deleted` - Customer deleted
- `customer.updated` - Customer updated

## Webhook Payload Structure

```json
{
  "id": "evt_1234...",
  "object": "event",
  "api_version": "2024-01-01",
  "created": 1614556800,
  "data": {
    "object": {
      "id": "ch_1234...",
      "object": "charge",
      "amount": 5000,
      "currency": "usd",
      "status": "succeeded"
    },
    "previous_attributes": {}
  },
  "livemode": false,
  "pending_webhooks": 1,
  "request": {
    "id": null,
    "idempotency_key": null
  },
  "type": "charge.succeeded"
}
```

## Handling Webhook Events

### Idempotency
Events may be delivered multiple times. Implementation must be idempotent:
- Store event IDs to prevent duplicate processing
- Use unique constraints in database
- Update existing records instead of creating new ones

### Processing Strategy
1. **Receive** the webhook POST request
2. **Verify** the Stripe-Signature header
3. **Parse** the JSON payload
4. **Store** the event for audit trail
5. **Process** the business logic
6. **Respond** with 200 OK immediately
7. **Retry** failed webhook processing asynchronously

### State Machine Example

```
Payment Created → Pending → Processing → Succeeded/Failed
     ↓
  charge.created
     ↓
  charge.succeeded/charge.failed
     ↓
Updates Database and Triggers Business Logic
```

## Webhook Delivery Reliability

### Stripe's Retry Logic
- Initial attempt
- 1st retry after ~5 minutes
- 2nd retry after ~30 minutes
- 3rd retry after ~2 hours
- 4th retry after ~5 hours
- 5th retry after ~10 hours

### Your Responsibility
- Return HTTP 2xx status ASAP
- Process long operations asynchronously
- Log all webhook events
- Monitor webhook failures
- Implement dead letter queues

## Best Practices

### 1. Verify Signatures Always
```javascript
const event = stripe.webhooks.constructEvent(body, sig, endpointSecret);
```

### 2. Use Event IDs for Idempotency
```javascript
const eventId = event.id;
// Check if already processed
const exists = await db.webhooks.findOne({ eventId });
if (exists) return res.status(200).json({ received: true });
```

### 3. Return Immediately
```javascript
// Store webhook for processing
await queue.enqueue(event);
// Respond immediately without waiting for processing
res.status(200).json({ received: true });
```

### 4. Log Everything
```javascript
logger.info('Webhook received', { 
  eventId: event.id, 
  type: event.type,
  timestamp: event.created 
});
```

### 5. Handle Network Errors Gracefully
```javascript
app.post('/webhooks', (req, res) => {
  try {
    const event = stripe.webhooks.constructEvent(...);
    processEvent(event);
    res.status(200).json({ received: true });
  } catch (err) {
    res.status(400).json({ error: err.message });
  }
});
```

## Common Problems & Solutions

| Problem | Cause | Solution |
|---------|-------|----------|
| Webhook not received | Wrong endpoint URL | Check Stripe dashboard config |
| Signature verification fails | Wrong secret | Verify secret from dashboard |
| Duplicate processing | No idempotency check | Store & check event IDs |
| Missing updates | Webhook not processed | Implement polling fallback |
| Timeout errors | Processing too slow | Move to async queue |

## Webhook Endpoints Configuration

In Stripe Dashboard:
1. Go to Developers → Webhooks
2. Click "Add endpoint"
3. Enter your HTTPS URL (e.g., `https://yourdomain.com/webhooks/stripe`)
4. Select events to listen for
5. Copy the signing secret
6. Add to `.env` as `STRIPE_WEBHOOK_SECRET`

## Testing Webhooks Locally

### Using Stripe CLI
```bash
# Install: https://stripe.com/docs/stripe-cli
stripe login
stripe listen --forward-to localhost:3000/webhooks/stripe
# Copy webhook signing secret
```

### Using ngrok
```bash
ngrok http 3000
# Configure webhook to: https://randomid.ngrok.io/webhooks/stripe
```

### Manual Testing
Use Stripe's test mode and trigger events via Dashboard or API

## Real-World Scenario

### Customer Purchases Item

1. **Customer clicks "Pay"** on website
2. **Frontend creates Payment Intent** via Stripe
3. **Customer enters card details**
4. **Stripe processes payment**
5. **Webhook: charge.succeeded** → Webhook server
6. **Webhook handler**:
   - Verifies signature
   - Updates database: mark order as paid
   - Triggers email confirmation
   - Updates inventory
   - Logs event
7. **Responds 200 OK** to Stripe
8. **Frontend polls** Payment Intent status
9. **Shows confirmation** to customer
10. **Email sent** with receipt

## Anti-Patterns to Avoid

### ❌ Don't Skip Signature Verification
```javascript
// BAD: No verification
app.post('/webhooks', (req, res) => {
  const event = req.body;
  processPayment(event);
});
```

### ❌ Don't Process Long Operations Synchronously
```javascript
// BAD: Blocking request
app.post('/webhooks', async (req, res) => {
  const event = stripe.webhooks.constructEvent(...);
  await sendEmail();  // Too slow!
  await updateDatabase();
  res.json({ ok: true });
});
```

### ❌ Don't Ignore Duplicate Events
```javascript
// BAD: No idempotency
app.post('/webhooks', (req, res) => {
  const event = stripe.webhooks.constructEvent(...);
  createOrder(event);  // Could create duplicate!
});
```

## Webhook Logging & Monitoring

```javascript
const logger = winston.createLogger({
  transports: [
    new transports.File({ filename: 'webhooks.log' })
  ]
});

app.post('/webhooks', (req, res) => {
  const event = stripe.webhooks.constructEvent(...);
  
  logger.info('Webhook received', {
    eventId: event.id,
    type: event.type,
    timestamp: event.created,
    customerId: event.data.object.customer
  });
  
  res.json({ received: true });
});
```

## Advanced Concepts

### Event Filtering
Only listen to relevant events:
```javascript
const handleableEvents = [
  'charge.succeeded',
  'charge.failed',
  'charge.refunded'
];

if (handleableEvents.includes(event.type)) {
  // Process
}
```

### Webhook Dead Letter Queue
```javascript
if (failedWebhookProcess) {
  await deadLetterQueue.push({
    eventId: event.id,
    type: event.type,
    error: err.message,
    retryCount: 0
  });
  logger.warn('Webhook sent to DLQ', { eventId: event.id });
}
```

## Summary

✅ Webhooks enable real-time payment updates  
✅ Signature verification is mandatory  
✅ Idempotency prevents duplicate processing  
✅ Async processing prevents timeouts  
✅ Monitoring/logging critical for troubleshooting  

## Key Takeaways

1. Always verify webhook signatures
2. Check for duplicate events using IDs
3. Return 200 OK immediately
4. Process business logic asynchronously
5. Log all webhook events
6. Implement retry logic
7. Test with Stripe CLI for local development
8. Monitor webhook delivery in Stripe Dashboard
