# Stripe Webhook Lifecycle

## Overview
Learn how to handle Stripe webhooks securely, verify signatures, and process payment events in real-time.

## Setup

### 1. Install Dependencies
```bash
cd 01-stripe-webhook-lifecycle
npm install
```

### 2. Configure Environment
```bash
cp .env.example .env
# Edit .env and add your Stripe credentials
```

### 3. Run the Server
```bash
npm start
# Server runs on http://localhost:6101
```

### 4. Test Frontend
While server runs, open preview.html in browser to test webhook creation and event simulation.

## API Endpoints

| Method | Endpoint | Description |
|--------|----------|-------------|
| POST | `/api/orders` | Create order |
| GET | `/api/orders/:id` | Get order |
| POST | `/api/payments` | Create payment |
| GET | `/api/payments/:id` | Get payment |
| POST | `/api/webhooks/stripe` | Stripe webhook receiver |
| GET | `/api/events` | List all webhook events received |

## Key Concepts

### Webhook Signature Verification
Stripe signs all webhooks with your secret key using HMAC-SHA256. Never trust webhooks without verifying the signature.

### Idempotency
Always process webhooks idempotently. Stripe may retry failed events multiple times.

### Event Types Handled
- `charge.succeeded` - Payment successful
- `charge.failed` - Payment failed
- `charge.refunded` - Payment refunded

## Testing with cURL

**Create Order:**
```bash
curl -X POST http://localhost:6101/api/orders \
  -H "Content-Type: application/json" \
  -d '{"customerId":"cust_123","amount":5000,"description":"Test Order"}'
```

## Next Steps

1. Read theory.md for webhook security details
2. Review controller.js for signature verification code
3. Test endpoints with the React UI
4. Move to Module 02: Idempotency Keys
