# Email Deliverability Infrastructure: Theory & Concepts

## 1. DNS & Email Records

### DNS Query Process
```
Recipient mail server receives email from IP 1.2.3.4
↓
Server queries DNS for SPF record
↓
DNS: "v=spf1 include:sendgrid.net ~all"
↓
Server checks: Is 1.2.3.4 authorized?
↓
If yes: SPF pass ✓ | If no: SPF fail ✗
```

**DNS Propagation**: Changes take 0-48 hours to propagate globally.

### DNS Limits
SPF has max 10 DNS lookups per record:
```
v=spf1 
  include:service1.com   (lookup 1)
  include:service2.com   (lookup 2)
  include:service3.com   (lookup 3)
  -all
```

If you exceed 10 lookups, email fails SPF check at some mail servers.
**Solution**: Use SPF flattening service to consolidate lookups.

## 2. Email Reputation

### Sender Score
G Data ranks senders 0-100 based on:
- **Bounce rate**: Target < 2%
  - Hard bounce (invalid email): Remove immediately
  - Soft bounce (server down): Retry 3x over 72 hours

- **Complaint rate**: Target < 0.1%
  - User marked email as spam
  - Mail server reports complaint to reputation database
  - Multiple complaints trigger blocking

- **Authentication**: SPF, DKIM, DMARC passing
  - Failures indicate spoofing or misconfiguration

- **Engagement**: Opens, clicks vs sends
  - No engagement after 3 sends = user not interested

- **Volume**: Sudden spikes trigger manual review
  - Ramp up slowly (10% increase per day for 10 days)

### IP Reputation
Each sending IP tracked separately:
- Dedicated IP: Only your email (requires $ 80-100/month)
- Shared IP: Multiple customers (risk if one spams)

**Scenario**:
1. Customer A sends 1M emails
2. Complaint rate 5% (50k complaints)
3. IP reputation drops
4. Customer B uses same IP
5. Customer B emails delivered to spam (collateral damage)

## 3. DMARC Implementation

### Policy Rollout Strategy
Start cautious, gradually increase enforcement:

**Month 1**: `p=none` - Monitor only
```
v=DMARC1; p=none; rua=mailto:reports@company.com
```
Monitor DMARC reports, identify issues.

**Month 2**: `p=quarantine` - Spam folder
```
v=DMARC1; p=quarantine; rua=mailto:reports@company.com
```
Monitor for legitimate mail being blocked.

**Month 3+**: `p=reject` - Hard reject
```
v=DMARC1; p=reject; rua=mailto:reports@company.com; pct=100
```

### DMARC Reports
Weekly reports show:
```
From IP 1.2.3.4:
  - 10,000 messages aligned (SPF/DKIM pass) ✓
  - 50 messages SPF fail ✗
  - 0 messages DKIM fail
  
From IP 4.5.6.7 (attacker):
  - 1,000 phishing attempts ✗
  - All fail SPF and DKIM
  - DMARC policy: reject
```

## 4. Subdomain Isolation

### Multi-Brand Email
Large companies send from multiple brands:
```
company.com     (main domain)
brand1.com      (subsidiary 1)
brand2.com      (subsidiary 2)
```

Each needs separate DKIM keys and SPF records:
```
# company.com
v=spf1 include:sendgrid.net -all
default._domainkey: [public key 1]

# brand1.com
v=spf1 include:sendgrid.net -all
default._domainkey: [public key 2]
```

## 5. List Unsubscribe

### Headers Required
```
List-Unsubscribe: <mailto:unsubscribe@company.com>, <https://company.com/unsubscribe?email=user@example.com>
List-Unsubscribe-Post: List-Unsubscribe=One-Click
```

**Gmail feature**: "Unsubscribe" button in email header (not footer)

If List-Unsubscribe header present:
- Gmail shows unsubscribe button
- User clicks → One-click unsubscribe (POST request)
- Server processes unsubscribe
- No email receipt required

## 6. Email Encryption

### S/MIME (Secure/Multipurpose Internet Mail Extensions)
Pre-shared certificates encrypt email body:
```
Sender has recipient's public certificate
  ↓
Sender encrypts email with public key
  ↓
Recipient receives encrypted email
  ↓
Recipient decrypts with private key
  ↓
Only recipient can read email
```

**Use case**: Healthcare, financial institutions
**Limitation**: Both parties must have certificates

### TLS in Transit
Automatic encryption between mail servers (STARTTLS):
- Server A connects to Server B
- TLS negotiated (like HTTPS)
- Email transmitted encrypted
- Email stored unencrypted at rest (default)

## 7. Security Checklist

- [ ] SPF record with -all (hard fail)
- [ ] DKIM public key in DNS
- [ ] DKIM private key secure (environment variable)
- [ ] DMARC policy p=quarantine or p=reject
- [ ] DMARC reports received weekly
- [ ] List-Unsubscribe header on all bulk email
- [ ] One-click unsubscribe working
- [ ] Bounce handling automated
- [ ] Complaint handling reviewed weekly
- [ ] IP reputation monitored (SenderScore, Validity)
- [ ] Volume ramp-up gradual (10% per day)
- [ ] Engagement tracked (opens, clicks, bounces)
- [ ] Inactive subscribers cleaned (90+ days no open)
- [ ] List purchased from reputable vendor
- [ ] No purchased lists without verification
