# Module 02: Idempotency Keys - Setup

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
HTTP_PORT=6102
NODE_ENV=development
IDEMPOTENCY_CACHE_TTL=86400
```

## How to run
```bash
npm start
```
Server: http://localhost:6102

## How to test

**Key Concept:** Same idempotency key = cached response (no duplicate charge)

**Using cURL:**
```bash
KEY='uuid-123-abc'
curl -X POST http://localhost:6102/api/payments \
  -H "Idempotency-Key: $KEY" \
  -H "Content-Type: application/json" \
  -d '{"amount":1000,"currency":"USD"}'

# Retry with same KEY = sees cache, returns same response
```

**Using React UI:**
1. `npm start`
2. Open `preview.html`
3. UI auto-generates UUID for each payment
4. Submit same UUID twice → cached response
