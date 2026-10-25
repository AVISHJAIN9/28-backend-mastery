# PCI DSS Compliance Basics

## Overview
Secure payment handling without storing sensitive card data. Implement tokenization to stay PCI DSS compliant.

## Setup

### 1. Install Dependencies
```bash
cd 04-pci-dss-basics
npm install
```

### 2. Run the Server
```bash
npm start
# Server runs on http://localhost:6104
```

## API Endpoints

| Method | Endpoint | Description |
|--------|----------|-------------|
| POST | `/api/tokenize-card` | Convert card to token |
| POST | `/api/process-payment` | Charge using token |
| GET | `/api/compliance-status` | Verify compliance checks |

## PCI DSS Requirements

1. **Never store full card numbers** - Use tokens
2. **Never store CVV** - Card verification code
3. **Encrypt data in transit** - Use HTTPS/TLS
4. **Restrict access** - Minimal staff access
5. **Monitor activity** - Log all transactions

## Tokenization Flow

```
Customer Card → [Token Service] ← Only this touches card
                      ↓
                Token (safe to store)
                      ↓
Your Database (no card data)
```

## Testing with cURL

**Tokenize Card:**
```bash
curl -X POST http://localhost:6104/api/tokenize-card \
  -H "Content-Type: application/json" \
  -d '{
    "cardNumber": "4242424242424242",
    "expiry": "12/25",
    "name": "John Doe"
  }'
# Returns: {token: "tok_abc123", ...}
```

**Process Payment with Token:**
```bash
curl -X POST http://localhost:6104/api/process-payment \
  -H "Content-Type: application/json" \
  -d '{
    "token": "tok_abc123",
    "amount": 5000,
    "currency": "USD"
  }'
```

## Next Steps

1. Read theory.md for compliance details
2. Review tokenization in controller.js
3. Move to Module 05: Razorpay/PayU
