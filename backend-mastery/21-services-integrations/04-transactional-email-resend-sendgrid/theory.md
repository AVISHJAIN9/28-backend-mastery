# Transactional Email Security: Theory & Concepts

## 1. Email Delivery Fundamentals

### SMTP Protocol
Simple Mail Transfer Protocol (SMTP) establishes connections to mail servers:
```
1. Client connects to server (port 25, 465, or 587)
2. TLS encryption negotiated
3. Authentication (username/password)
4. Message envelope (FROM, TO, SUBJECT)
5. Message body
6. Server queues for delivery
```

**Risk**: Unencrypted SMTP exposes credentials. Always use TLS.

### Transactional vs Marketing Email
- **Transactional**: Password resets, order confirmations, account alerts
  - Required by law to deliver (no unsubscribe needed)
  - Higher priority, lower volume
  - Tighter latency (< 5 minutes)

- **Marketing**: Newsletters, promotions, announcements
  - Must include unsubscribe link (CAN-SPAM, GDPR)
  - Can go to spam without liability
  - Higher volume, flexible timing

## 2. Email Authentication

### SPF (Sender Policy Framework)
SPF authorizes IP addresses to send email:
```
v=spf1 ip4:192.168.1.1 include:sendgrid.net ~all
```

**How**: Recipient queries DNS TXT record, verifies sender IP is authorized.

**Limitation**: Only checks envelope FROM, not visible FROM header.

### DKIM (DomainKeys Identified Mail)
DKIM signs emails with private key:
1. Server signs email with private key
2. Public key published in DNS
3. Recipient verifies signature
4. If valid: email authentic ✓

**Key point**: Prevents email tampering. Private key exposure = attackers can forge emails.

### DMARC (Domain Message Authentication Reporting Conformance)
DMARC specifies action if SPF/DKIM fails:
```
v=DMARC1; p=reject; rua=mailto:reports@company.com
```

**Policies**:
- `p=none`: Monitor only
- `p=quarantine`: Mark as spam
- `p=reject`: Hard reject

## 3. OTP Security

### Generation
Must be:
- **Unpredictable**: Cryptographic random
- **Time-limited**: Expire in 5-10 minutes
- **Single-use**: Invalidate after use
- **Rate-limited**: Max 3 attempts then lockout

### Vulnerable vs Secure
```javascript
// VULNERABLE - Sequential codes
const code = lastCode + 1; // 123456 → 123457 (predictable)

// SECURE - Cryptographic randomness
const code = crypto.randomInt(100000, 999999);

// VULNERABLE - No expiration
if (otp === storedOtp) return 'verified';

// SECURE - Check expiration
if (Date.now() > expiresAt) throw new Error('OTP expired');
```

## 4. Email Compliance

### CAN-SPAM Act (USA)
Law regulating commercial email:
- Must include unsubscribe mechanism
- Process unsubscribe within 10 days
- Include physical address
- Identify as advertisement
- No misleading subject lines

**Penalty**: Up to $43,280 per violation

### GDPR (EU)
- **Opt-in required**: Explicit consent before marketing email
- **Right to access**: User can request their data
- **Right to deletion**: User can delete account and data
- **Privacy policy**: Must explain data usage

**Penalty**: Up to €20 million or 4% annual revenue

## 5. Email Deliverability

### Factors Affecting Inbox Placement
1. **Domain reputation**: Low bounce rate (< 2%), complaint rate (< 0.1%)
2. **IP reputation**: Consistent sending patterns
3. **Authentication**: SPF/DKIM/DMARC all passing
4. **Content quality**: No spam keywords, proper formatting
5. **List quality**: No invalid emails, high engagement
6. **Volume ramp**: Gradually increase sending

### Bounce Handling
- **Hard bounce**: Invalid email → remove permanently
- **Soft bounce**: Server down → retry 3x then remove
- **Complaint**: User marked spam → investigate & remove

## 6. Real-World: SaaS Onboarding Flow

```
1. User registers → Verification email
2. Click link → Email verified
3. Add payment → Confirmation email
4. Login → Welcome email
5. Inactive 7 days → Reminder email
6. Inactive 30 days → Remove from reminders
```

Each email should:
- Include unsubscribe link
- Track opens/clicks
- Log timestamp for audit trail
- Be deliverable from verified domain

## 7. Security Checklist

- [ ] All emails sent over TLS encryption
- [ ] SPF record with -all (hard fail)
- [ ] DKIM keys rotated quarterly
- [ ] DMARC policy p=quarantine or p=reject
- [ ] List-Unsubscribe header on bulk emails
- [ ] OTP expires after 5-10 minutes
- [ ] Rate limiting on OTP attempts
- [ ] Bounce/complaint handling automated
- [ ] No PII in email headers
- [ ] Unsubscribe removes users within 10 days
- [ ] GDPR consent captured before marketing
- [ ] Email logs retained 90+ days
- [ ] Bounce rate monitored and alerted
- [ ] Complaint rate < 0.1%
- [ ] Regular delivery testing
