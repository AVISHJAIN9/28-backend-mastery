# Idempotency Keys for Payment Processing

## Overview
Prevent duplicate charges by using idempotency keys (UUIDs). Handle network failures and retries safely.

## Setup

### 1. Install Dependencies
```bash
cd 02-idempotency-keys-payments
npm install
```

### 2. Configure Environment
```bash
cp .env.example .env
```

### 3. Run the Server
```bash
npm start
# Server runs on http://localhost:6102
```

## API Endpoints

| Method | Endpoint | Description |
|--------|----------|-------------|
| POST | `/api/payments` | Create payment with idempotency key |
| GET | `/api/payments/:id` | Retrieve payment |
| GET | `/api/payments/key/:key` | Retrieve by idempotency key |
| GET | `/api/logs` | View idempotency log |

## Idempotency Pattern

1. Client generates UUID (idempotency key)
2. Server checks cache before processing
3. If seen before → return cached response
4. If new → process & cache response
5. Cache expires after 24 hours

## Testing with cURL

**Create Payment with Idempotency Key:**
```bash
KEY=$(uuidgen | tr '[:upper:]' '[:lower:]')
curl -X POST http://localhost:6102/api/payments \
  -H "Content-Type: application/json" \
  -H "Idempotency-Key: $KEY" \
  -d '{"amount":1000,"currency":"USD","customerId":"cust_123"}'
```

**Retry Same Payment (Should Return Cached Response):**
Both requests return same response - no duplicate charge!

## Next Steps

1. Read theory.md for detailed concepts
2. Understand race condition handling
3. Move to Module 03: Double Entry Bookkeeping
