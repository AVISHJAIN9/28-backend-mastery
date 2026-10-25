# Refunds & Chargebacks - State Machines

## Overview
Handle both merchant-initiated refunds and customer-initiated disputes using state machines. Critical for payment integrity.

## Setup

### 1. Install Dependencies
```bash
cd 07-refund-chargeback-state-machine
npm install
```

### 2. Run the Server
```bash
npm start
# Server runs on http://localhost:6107
```

## Refund State Machine

```
INITIATED → PROCESSING → COMPLETED (or FAILED)
```

## Chargeback State Machine

```
INITIATED → DEFENSE_OPEN → SUBMITTED → WON (or LOST)
```

## Key Differences

**Refunds (Merchant-initiated):**
- You give money back
- Full control
- Instant processing

**Chargebacks (Customer-initiated):**
- Customer disputes with bank
- 7-day defense window
- Bank decides outcome
- Chargeback fee ($15-$100)

## API Endpoints

**Refunds:**
| Method | Endpoint | Description |
|--------|----------|-------------|
| POST | `/api/refunds` | Initiate refund |
| GET | `/api/refunds/:id` | Get refund status |

**Chargebacks:**
| Method | Endpoint | Description |
|--------|----------|-------------|
| POST | `/api/chargebacks` | Record chargeback |
| GET | `/api/chargebacks/:id` | Get chargeback status |
| POST | `/api/chargebacks/:id/submit-defense` | Submit evidence |

## Prevention Strategies

1. **Clear Descriptions** - Charge appears clearly
2. **Confirmation Emails** - Send receipt immediately
3. **Easy Contact** - Provide customer service
4. **Quick Refunds** - Process legitimate ones fast
5. **Authentication** - Use 3D Secure

## Chargeback Defense

1. **Document Everything**
   - Order confirmation
   - Shipping proof
   - Customer emails

2. **Respond Quickly**
   - 7-day deadline
   - Don't miss deadline (auto-loss)

3. **Key Goal**
   - Keep chargeback rate < 0.1%

## Testing

```bash
curl -X POST http://localhost:6107/api/refunds \
  -H "Content-Type: application/json" \
  -d '{"chargeId": "ch_123", "amount": 5000, "reason": "requested_by_customer"}'
```

## Next Steps

1. Read theory.md for dispute handling
2. Understand state machines
3. Practice evidence collection
4. Move to Module 08: Stripe Connect
