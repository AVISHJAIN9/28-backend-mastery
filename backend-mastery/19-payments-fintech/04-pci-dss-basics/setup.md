# Module 04: PCI DSS Basics - Setup

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
HTTP_PORT=6104
NODE_ENV=development
ENABLE_REAL_STRIPE_TOKENIZATION=false
```

## How to run
```bash
npm start
```
Server: http://localhost:6104

## How to test

**Golden Rule:** Touch card data BUT don't store it. Use tokens!

**Tokenize Card:**
```bash
curl -X POST http://localhost:6104/api/tokenize-card \
  -H "Content-Type: application/json" \
  -d '{
    "cardNumber": "4242424242424242",
    "expiry": "12/25",
    "name": "John Doe"
  }'
# Returns: {token: "tok_abc123"}
```

**Process Payment (use token, not card):**
```bash
curl -X POST http://localhost:6104/api/process-payment \
  -H "Content-Type: application/json" \
  -d '{"token": "tok_abc123", "amount": 5000}'
```

**Using React UI:**
1. `npm start`
2. Open `preview.html`
3. Tokenize card → See token generated
4. Process payment with token (card cleared)
