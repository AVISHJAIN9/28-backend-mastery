# Double Entry Bookkeeping

## Overview
Implement the fundamental accounting principle: every debit must have a credit. Essential for financial accuracy in fintech.

## Setup

### 1. Install Dependencies
```bash
cd 03-double-entry-bookkeeping
npm install
```

### 2. Run the Server
```bash
npm start
# Server runs on http://localhost:6103
```

## API Endpoints

| Method | Endpoint | Description |
|--------|----------|-------------|
| POST | `/api/journal-entries` | Create journal entry (batch of debits/credits) |
| GET | `/api/journal-entries/:id` | Retrieve entry |
| GET | `/api/accounts/:account/balance` | Get account balance |
| GET | `/api/reconcile` | Verify accounting equation |

## Accounting Equation

```
Assets = Liabilities + Equity
```

## Transaction Example
**Customer pays $1000 for product:**

| Account | Debit | Credit | Description |
|---------|-------|--------|-------------|
| Cash | 1000 | | Money increased |
| Revenue | | 1000 | Income earned |
| **Total** | **1000** | **1000** | **Balanced!** |

## Testing with cURL

**Create Journal Entry:**
```bash
curl -X POST http://localhost:6103/api/journal-entries \
  -H "Content-Type: application/json" \
  -d '{
    "entries": [
      {"account": "Cash", "debit": 1000, "credit": 0},
      {"account": "Revenue", "debit": 0, "credit": 1000}
    ]
  }'
```

## Key Concepts

- **Assets** - Cash, accounts receivable (Debit balances)
- **Liabilities** - Loans, payables (Credit balances)
- **Equity** - Owner's capital (Credit balances)
- **Revenue** - Sales income (Credit balances)
- **Expenses** - Costs (Debit balances)

## Next Steps

1. Read theory.md for accounting concepts
2. Study pattern in controller.js
3. Move to Module 04: PCI DSS Compliance
