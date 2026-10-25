# Webhook Verification Middleware

## Overview
Webhooks allow external services to notify your application of events. Webhook verification middleware ensures requests come from trusted sources through cryptographic signature validation (HMAC), preventing unauthorized event injection.

## Key Concepts

### 1. Webhook Security Threat
```
Attacker impersonates payment provider:
POST /webhooks/payment
{
  orderId: 123,
  status: 'paid',
  amount: 50
}

App processes payment without verification → Money lost!
```

### 2. HMAC Signature Verification
- **Secret Key**: Shared between provider and app
- **Signature**: HMAC(algorithm, secret, body)
- **Header**: Provider sends signature in header
- **Verification**: App recalculates signature and compares

### 3. Providers Using HMAC
- **Stripe**: `Stripe-Signature` header with timestamp
- **GitHub**: `X-Hub-Signature-256` with SHA256
- **Twilio**: `X-Twilio-Signature` header
- **PayPal**: Custom signature generation

## HMAC Implementation

### Basic Webhook Verification
```javascript
const crypto = require('crypto');

const verifyWebhook = (secret, payload, signature) => {
  const hash = crypto
    .createHmac('sha256', secret)
    .update(JSON.stringify(payload))
    .digest('hex');
  
  return hash === signature;
};
```

### Express Middleware
```javascript
const webhookMiddleware = (req, res, next) => {
  const signature = req.headers['x-webhook-signature'];
  const body = req.rawBody; // Need raw body, not parsed
  
  const hash = crypto
    .createHmac('sha256', process.env.WEBHOOK_SECRET)
    .update(body)
    .digest('hex');
  
  if (hash !== signature) {
    return res.status(401).json({ error: 'Invalid signature' });
  }
  
  next();
};
```

## Advanced Security Measures

### 1. Timestamp Validation
```javascript
const verifyWithTimestamp = (req, res, next) => {
  const signature = req.headers['x-signature'];
  const timestamp = req.headers['x-timestamp'];
  
  // Reject if older than 5 minutes
  if (Date.now() - parseInt(timestamp) > 5 * 60 * 1000) {
    return res.status(401).json({ error: 'Request expired' });
  }
  
  const message = `${timestamp}.${req.rawBody}`;
  const hash = crypto
    .createHmac('sha256', process.env.WEBHOOK_SECRET)
    .update(message)
    .digest('hex');
  
  if (hash !== signature) {
    return res.status(401).json({ error: 'Invalid signature' });
  }
  
  next();
};
```

### 2. Replay Attack Prevention
```javascript
const replayCache = new Set();

const verifyNoReplay = (req, res, next) => {
  const eventId = req.headers['x-event-id'];
  
  if (replayCache.has(eventId)) {
    return res.status(409).json({ error: 'Duplicate event' });
  }
  
  replayCache.add(eventId);
  
  // Clean cache after 1 hour
  setTimeout(() => replayCache.delete(eventId), 60 * 60 * 1000);
  
  next();
};
```

### 3. Content-Type Validation
```javascript
const validateContentType = (req, res, next) => {
  const contentType = req.headers['content-type'];
  
  if (!contentType?.includes('application/json')) {
    return res.status(415).json({ error: 'Invalid Content-Type' });
  }
  
  next();
};
```

## Real-World Webhook Examples

### Stripe Payment Webhook
```javascript
const handleStripeWebhook = (req, res) => {
  const sig = req.headers['stripe-signature'];
  
  try {
    const event = stripe.webhooks.constructEvent(
      req.rawBody,
      sig,
      process.env.STRIPE_WEBHOOK_SECRET
    );
    
    switch (event.type) {
      case 'payment_intent.succeeded':
        // Update order status
        break;
    }
    
    res.json({ received: true });
  } catch (err) {
    res.status(400).send(`Webhook Error: ${err.message}`);
  }
};
```

### GitHub Push Event
```javascript
const verifyGitHub = (req, res, next) => {
  const signature = req.headers['x-hub-signature-256'];
  const payload = req.rawBody;
  
  const hash = 'sha256=' + crypto
    .createHmac('sha256', process.env.GITHUB_WEBHOOK_SECRET)
    .update(payload)
    .digest('hex');
  
  if (!crypto.timingSafeEqual(hash, signature)) {
    return res.status(401).json({ error: 'Unauthorized' });
  }
  
  next();
};
```

## Best Practices

1. **crypto.timingSafeEqual()**: Prevent timing attacks
2. **Raw Body**: Use unparsed body for signature verification
3. **Timestamp Validation**: Reject old requests
4. **Event ID Tracking**: Prevent replay attacks
5. **Rate Limiting**: Prevent webhook flooding
6. **Async Processing**: Queue events for processing
7. **Logging**: Log all webhook attempts (success/failure)
8. **Error Handling**: Return 200 OK quickly, process async

## Debugging Webhooks

- **Webhook Relay Services**: ngrok, webhook.site for testing
- **Signature Mismatch**: Check secret key encoding
- **Timestamp Issues**: Sync server time with NTP
- **Raw Body Problems**: Ensure middleware gets raw bytes
- **Testing Tools**: Postman, curl with manual HMAC

## Compliance Considerations

- **PCI-DSS**: For payment webhooks
- **GDPR**: When handling user data in webhooks
- **Webhook Audit Trail**: Log all events for compliance
- **Data Retention**: Maintain webhook logs
