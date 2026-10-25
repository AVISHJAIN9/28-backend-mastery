# ACH & Bank Transfers - Theory & Concepts

## Automated Clearing House (ACH) Overview

ACH is a US banking network for electronic fund transfers (debits/credits). It's:
- **Batch-processed** - Not real-time, typically 1-2 business days
- **Low-cost** - Much cheaper than wire transfers ($0.25-$1)
- **Secure** - Bank-to-bank verification
- **Standardized** - NACHA rules govern all transactions
- **High-volume** - Processes 25+ billion transactions annually

### ACH Uses
1. **Direct Deposit** - Employer salary payments
2. **Bill Payments** - Utility, loan payments
3. **Vendor Payouts** - Marketplace seller disbursements
4. **P2P Transfers** - Between consumers
5. **Subscription Billing** - Recurring payments

## Plaid Integration

Plaid enables ACH by securely connecting bank accounts:

```javascript
const plaid = new PlaidClient({
  clientID: process.env.PLAID_CLIENT_ID,
  secret: process.env.PLAID_SECRET,
  env: 'sandbox'
});

// User authenticates and Plaid returns access token
// Use token to fetch account info and initiate transfers
```

## ACH Transfer Types

### 1. Credit (ACH Push)
- Send money FROM your account TO customer account
- Takes 1-2 business days
- Non-reversible after 1-2 days
- Cost: $0.25-$1 per transaction

### 2. Debit (ACH Pull)
- Withdraw money FROM customer account TO your account
- Requires customer authorization
- Can be disputed (warranty period varies)
- Common for recurring payments

## Implementation Example

```javascript
const initiateACHTransfer = async (customerId, amount, bankAccount) => {
  // 1. Verify Plaid token is valid
  const accountInfo = await plaid.auth.get(accessToken);
  
  // 2. Validate amount and account
  if (amount < 1 || amount > 999999) {
    throw new Error('Invalid amount');
  }
  
  // 3. Create transfer request
  const transfer = await plaid.transfer.create({
    access_token: accessToken,
    account_id: accountInfo.accounts[0].account_id,
    funding_account_id: process.env.TRANSFER_ACCOUNT_ID,
    type: 'credit',
    amount: amount,
    description: 'Payout from platform'
  });
  
  // 4. Store transfer record
  db.transfers.save({
    transferId: transfer.transfer_id,
    customerId: customerId,
    amount: amount,
    status: 'initiated',
    createdAt: new Date()
  });
  
  // 5. Poll for status
  // ACH takes 1-2 days, check daily
};
```

## NACHA Rules & Compliance

### Transaction Limits
- **Standard Credit**: $5,000 per transaction (can be increased)
- **Same-day ACH**: Allows faster processing (more expensive)
- **Debit limit**: $5,525 per debit entry (NACHA rule)

### Verification Requirements
- Account holder name must match exactly
- Account number validation (checksum)
- Routing number validation
- OFAC screening for sanctions

### Micro-deposits (Account Verification)
```javascript
// Plaid sends 2 small deposits (e.g., $0.11, $0.29)
// Customer verifies amounts
// Proves account ownership
// Used before large transfers

const verifyBankAccount = async (accessToken, amounts) => {
  // User provides the two deposit amounts
  // Plaid validates
  return await plaid.processor.token.create({
    access_token: accessToken
  });
};
```

## Error Handling

### Common ACH Failures
1. **Insufficient funds** - Account has < transfer amount
2. **Account closed** - Bank returned code
3. **Invalid routing** - Routing number not found
4. **Duplicate** - Same transfer initiated twice
5. **Account type mismatch** - Trying debit on savings

```javascript
const handleACHFailure = (error) => {
  const failures = {
    'insufficient_funds': 'Account lacks funds',
    'account_closed': 'Account no longer exists',
    'invalid_account_number': 'Account number incorrect',
    'no_account': 'Routing number not found',
    'duplicate_transfer': 'This transfer already pending'
  };
  
  return failures[error.code] || 'ACH transfer failed';
};
```

## Security Considerations

### Data Protection
- Never store bank account numbers in plain text
- Use Plaid's tokenization
- Encrypt in-transit (HTTPS/TLS)
- Mask account number in logs ($xxxx5678)

### Duplicate Detection
- Track transfer IDs to prevent re-submission
- Implement idempotency keys (like Module 02)
- Use request deduplication

### Fraud Prevention
- Verify account before large transfers
- Implement velocity checks (max per day)
- Monitor for unusual patterns
- Require customer confirmation

## Real-World Flow

### Seller Payout (Marketplace)
```
1. Seller requests withdrawal: $1,000
   └─ Check minimum ($100)
   └─ Verify bank account linked (Plaid)

2. Initiate ACH credit transfer
   └─ Deduct from marketplace account
   └─ Initiate ACH to seller's bank

3. Bank processes (1-2 business days)
   └─ Send via Federal Reserve
   └─ Receiving bank credits account

4. Seller receives funds
   └─ Update transfer status: COMPLETED
   └─ Send notification

5. Handle failures
   └─ If rejected: FAILED status
   └─ Refund to marketplace account
   └─ Notify seller
```

## Production Considerations

### Processing
- Batch ACH transfers (Plaid batches nightly)
- Schedule transfers to meet cutoff times
- Handle timezone differences
- Track processing windows (14:00 ET deadline)

### Reconciliation
- Daily: Check transfer statuses
- Weekly: Reconcile bank statements against transfers
- Monthly: Full audit of ACH activity

### Compliance
- Keep 3 years of ACH records
- NACHA rule compliance
- State-specific regulations
- Export compliance (OFAC)

### Scaling
- Use transfer webhooks for status updates
- Cache Plaid tokens (don't re-authenticate)
- Implement rate limiting on transfers
- Monitor Plaid API usage

## Cost Model

**Assumption: Process $100,000/month in payouts**

- Plaid API: ~2,000 API calls @ $0.50 per transfer = $1,000
- ACH transfer fees: 2,000 transfers × $0.50 = $1,000
- **Total: $2,000/month**

**Per-transaction cost: $1 per payout**

## Next Steps

1. Get Plaid credentials (register at plaid.com)
2. Implement bank account linking (Plaid Flow)
3. Build transfer initiation endpoint
4. Add transfer status polling
5. Implement webhook handling for updates
6. Add reconciliation jobs
7. Create seller dashboard for withdrawals
