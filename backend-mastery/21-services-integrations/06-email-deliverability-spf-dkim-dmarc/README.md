# Email Deliverability - SPF, DKIM, DMARC

## What is this?

This module covers email authentication protocols that prevent spoofing and improve inbox placement:
- **SPF (Sender Policy Framework)**: DNS record authorizing mail servers to send email for domain
- **DKIM (DomainKeys Identified Mail)**: Cryptographic signature proving email authenticity
- **DMARC (Domain-based Message Authentication, Reporting & Conformance)**: Policy enforcement and rejection reporting
- **List Unsubscribe Headers**: Compliance with CAN-SPAM and GDPR requirements

## Why does it matter?

Without SPF/DKIM/DMARC, emails get marked SPAM or rejected entirely. Modern email providers require all three for high deliverability. DMARC reports identify compromised servers sending fraudulent email. Non-compliance results in failed CAN-SPAM lawsuits.

## How it works (step by step)

1. **SPF Setup**: Admin creates DNS TXT record `v=spf1 include:sendgrid.net ~all`
2. **DKIM Setup**: Generate key pair, publish public key in DNS as CNAME
3. **DMARC Setup**: Create policy record `v=DMARC1; p=quarantine; rua=mailto:reports@domain.com`
4. **Email Sending**: Sender uses authorized server, signs with DKIM private key
5. **Recipient Server**: Validates SPF (check source IP), DKIM (verify signature), DMARC (apply policy)
6. **Reporting**: Aggregated reports sent to DMARC mailbox weekly with pass/fail stats

## Key concepts

- **SPF Soft Fail (~all) vs Hard Fail (-all)**: Soft fail rejects if all else fails, hard fail rejects immediately
- **DKIM Signing**: Private key must stay secure; public key public in DNS
- **DMARC Policy**: Reject = hard fail, Quarantine = mark spam, None = monitor only
- **Subdomain isolation**: mail.example.com and billing.example.com need separate DKIM keys
- **DMARC Reports**: Identify phishing attempts, misconfigured servers
- **List Unsubscribe**: Required `List-Unsubscribe` header with both email and mailto options

## Common mistakes

1. **SPF record too many includes** → DNS limit max 10 → Use SPF flattening service
2. **DKIM key hardcoded in code** → Public exposure risk → Use environment variables
3. **DMARC policy too strict initially** → Legitimate emails rejected → Start with p=none
4. **No DMARC reporting address** → Miss security issues → Setup rua= address
5. **Expired DKIM keys** → Signature verification fails → Rotate annually
6. **No List-Unsubscribe header** → Report as SPAM → Include for bulk mail

## Real world usage

**E-commerce Platform**: Setup SPF/DKIM/DMARC → order confirmations reach inbox → customer opens → clicks link
**SaaS Onboarding**: Verify SPF/DKIM → welcome emails avoid spam → users activate accounts
**Security: Phishing Detection**: Attacker spoofs domain → DMARC check fails → email rejected
**Compliance**: Audit trail of email authentication → GDPR proof of legitimacy

## API Endpoints

### DNS Configuration
- `GET /api/dns/spf` - Show required SPF record
- `GET /api/dns/dkim` - Show required DKIM record and key
- `GET /api/dns/dmarc` - Show required DMARC record

### Email Sending
- `POST /api/send/transactional` - Send with all headers
- `POST /api/send/bulk` - Send bulk with List-Unsubscribe

### Validation
- `POST /api/validate/spf` - Validate SPF DNS record
- `POST /api/validate/dkim` - Check DKIM key setup
- `POST /api/reports` - View DMARC reports

## Quick Start

```bash
npm install
node server.js
# Running on http://localhost:6306
```

## Testing

```bash
# Get SPF record template
curl http://localhost:6306/api/dns/spf

# Get DKIM key
curl http://localhost:6306/api/dns/dkim

# Send test email with all headers
curl -X POST http://localhost:6306/api/send/transactional \
  -H "Content-Type: application/json" \
  -d '{
    "to":"user@example.com",
    "subject":"Test",
    "body":"Test message"
  }'
```
