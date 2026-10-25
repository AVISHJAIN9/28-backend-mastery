# Module 07: Refunds & Chargebacks - Setup

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
HTTP_PORT=6107
NODE_ENV=development
```

## How to run
```bash
npm start
```
Server: http://localhost:6107

## How to test

**Refund States:** INITIATED → PROCESSING → COMPLETED/FAILED
**Chargeback States:** INITIATED → DEFENSE_OPEN → SUBMITTED → WON/LOST

**Initiate Refund:**
```bash
curl -X POST http://localhost:6107/api/refunds \
  -H "Content-Type: application/json" \
  -d '{"chargeId": "ch_123", "amount": 5000, "reason": "customer_request"}'
```

**Record Chargeback:**
```bash
curl -X POST http://localhost:6107/api/chargebacks \
  -H "Content-Type: application/json" \
  -d '{"chargeId": "ch_123", "amount": 5000, "reason": "fraudulent"}'
```

**Using React UI:**
1. `npm start`
2. Open `preview.html`
3. Initiate refunds/chargebacks
4. See state transitions
