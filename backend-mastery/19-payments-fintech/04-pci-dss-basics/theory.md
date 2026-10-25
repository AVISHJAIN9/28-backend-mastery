# PCI DSS Basics - Theory & Concepts

## What is PCI DSS?

**PCI DSS** = Payment Card Industry Data Security Standard

It's a set of security requirements established by Visa, Mastercard, American Express, Discover, and JCB for organizations that handle credit card information.

### Key Facts

- **Started**: 2004
- **Current Version**: 3.2.1
- **Applies to**: Anyone processing, storing, or transmitting payment card data
- **Enforcement**: Mandatory or lose ability to process cards
- **Scope**: Can be reduced through tokenization/outsourcing

## Why PCI DSS Exists

### The Problem

Credit cards are high-value targets for hackers:
- Stolen card data = instant fraud
- Millions of records stolen in breaches
- Huge financial damages to merchants

### The Solution

PCI DSS enforces standardized security practices to:
- Reduce card theft
- Minimize breach impact
- Hold retailers accountable
- Create industry standards

## 12 Requirements of PCI DSS 3.2.1

### 1. Install and maintain a firewall configuration
- Firewall policies documenting traffic flows
- Access control policies
- Regular review and updates
- **Implementation**: AWS Security Groups, iptables rules, WAF

### 2. Do not use vendor-supplied defaults
- Change default passwords immediately
- Remove unnecessary accounts
- Secure configuration standards
- **Implementation**: Disable root login, change SSH port, update BIOS

### 3. Protect stored cardholder data
- Encryption at rest (AES-256)
- Access controls
- Secure deletion
- **Rule**: Never store sensitive auth data (CVV, PIN)

### 4. Encrypt transmission of cardholder data
- TLS/SSL (minimum TLS 1.2)
- HTTPS everywhere
- Secure communication protocols
- **Implementation**: 256-bit encryption, certificate validation

### 5. Protect systems against malware
- Anti-virus/anti-malware
- Regular scanning
- Disabled USB ports
- **Implementation**: ClamAV, intrusion detection

### 6. Develop and maintain secure systems
- Security patches current
- Regular updates
- Vulnerability scanning
- **Implementation**: Automated patching, security testing

### 7. Restrict access by business need
- Least privilege access
- Role-based access control (RBAC)
- Separation of duties
- **Implementation**: Users only get permissions they need

### 8. Identify and authenticate access
- Unique user IDs
- Multi-factor authentication
- Strong passwords
- **Implementation**: MFA for admin, password complexity rules

### 9. Restrict physical access
- Video surveillance
- Access logs
- Visitor badges
- **Implementation**: Data center access restrictions

### 10. Track and monitor network access
- Detailed logging
- Access logs
- Security event tracking
- **Implementation**: Log rotation, syslog, SIEM tools

### 11. Test security systems regularly
- Penetration testing
- Vulnerability scanning
- Annual assessment
- **Implementation**: Burp Suite, OWASP ZAP, external audits

### 12. Maintain security policy
- Written policies
- Regular training
- Incident response plan
- **Implementation**: Security documentation, breach procedures

## Data Classification

### CHD (Cardholder Data) - MUST BE PROTECTED

```javascript
// Forbidden to store:
- Primary Account Number (PAN)
- Card expiration date
- Service code
- CVC/CVV (security code)

// Never write to logs:
const card = {
  number: '4111111111111111',  // ❌ FORBIDDEN
  exp: '12/25',                // ❌ FORBIDDEN
  cvv: '123'                   // ❌ FORBIDDEN
};
```

### SAD (Sensitive Authentication Data)
- PIN blocks
- Full track data
- CVC/CVV codes

**Rule**: Can use for processing only, must not store

## What NOT to Do (Anti-Patterns)

### ❌ Never Store Full Card Numbers

```javascript
// VIOLATION: Direct card storage
app.post('/api/payment', (req, res) => {
  const payment = {
    cardNumber: req.body.cardNumber,  // ILLEGAL
    cardExpiry: req.body.cardExpiry,  // ILLEGAL
    cvv: req.body.cvv                 // ILLEGAL
  };
  db.payments.insert(payment);
});

// Result: PCI DSS violation, fines up to $100,000+ per month
```

### ❌ Never Log Card Details

```javascript
// VIOLATION: Card in logs
logger.info('Processing payment', {
  amount: 100,
  card: req.body.cardNumber  // ILLEGAL - now in logs forever!
});
```

### ❌ Never Send Card Data via Email

```javascript
// VIOLATION: Unencrypted transmission
sendEmail(customer, {
  subject: 'Payment Confirmation',
  body: `Card: ${cardNumber}`,  // ILLEGAL
});
```

### ❌ Never Store CVV

```javascript
// VIOLATION: CVV storage
const payment = {
  cardNumber: tokenize(card),
  cvv: card.cvv  // ILLEGAL - CVV can never be stored
};
```

## Secure Implementation Pattern

### 1. Use Tokenization

```javascript
// RIGHT: Use token instead of card number
app.post('/api/payment', async (req, res) => {
  // Never see actual card
  const stripeToken = await stripe.createToken(req.body);
  
  // Store token only
  const payment = {
    stripeToken,  // ✓ Safe to store
    amount: 100,
    description: 'Product purchase'
  };
  
  await db.payments.insert(payment);
  
  // Process with token
  const charge = await stripe.charges.create({
    amount: payment.amount,
    source: payment.stripeToken
  });
});
```

### 2. Outsource Payment Processing

```javascript
// Architecture:
Browser → Stripe Hosted Form → Stripe (handles card data)
              ↓
         No card data to your server!
              ↓
         Your backend processes token
```

### 3. Encryption at Rest

```javascript
// Store sensitive data encrypted
const crypto = require('crypto');

const ENCRYPTION_KEY = process.env.ENCRYPTION_KEY;

function encryptData(data) {
  const iv = crypto.randomBytes(16);
  const cipher = crypto.createCipheriv('aes-256-cbc', ENCRYPTION_KEY, iv);
  return iv.toString('hex') + ':' + cipher.update(data, 'utf8', 'hex') + cipher.final('hex');
}

function decryptData(encrypted) {
  const parts = encrypted.split(':');
  const iv = Buffer.from(parts[0], 'hex');
  const decipher = crypto.createDecipheriv('aes-256-cbc', ENCRYPTION_KEY, iv);
  return decipher.update(parts[1], 'hex', 'utf8') + decipher.final('utf8');
}

// Usage
const encrypted = encryptData(sensitiveData);
db.data.insert({ value: encrypted });
```

### 4. HTTPS Everywhere

```javascript
// Express setup
const https = require('https');
const fs = require('fs');

const options = {
  key: fs.readFileSync('private-key.pem'),
  cert: fs.readFileSync('certificate.pem')
};

https.createServer(options, app).listen(443);

// Force HTTP to HTTPS
app.use((req, res, next) => {
  if (req.header('x-forwarded-proto') !== 'https') {
    res.redirect(`https://${req.header('host')}${req.url}`);
  } else {
    next();
  }
});
```

### 5. Access Control

```javascript
// Least privilege access
const checkPaymentAccess = (req, res, next) => {
  // Users can only see their own payments
  if (req.user.id !== parseInt(req.params.userId)) {
    return res.status(403).json({ error: 'Forbidden' });
  }
  
  // Admins can see all
  if (req.user.role === 'admin') {
    return next();
  }
  
  next();
};

app.get('/api/users/:userId/payments', checkPaymentAccess, (req, res) => {
  // Endpoint logic
});
```

### 6. Input Validation

```javascript
// Validate and sanitize all inputs
const Joi = require('joi');

const paymentSchema = Joi.object({
  amount: Joi.number().min(1).max(999999).required(),
  currency: Joi.string().length(3).required(),
  customerId: Joi.string().alphanum().required(),
  description: Joi.string().max(250)
  // Note: No 'cardNumber' or 'cvv' fields!
});

app.post('/api/payment', (req, res) => {
  const { error, value } = paymentSchema.validate(req.body);
  if (error) {
    return res.status(400).json({ error: error.details[0].message });
  }
  // Process validated data only
});
```

## Compliance Scopes

### Level 1 (Highest Risk)
- \>6 million card transactions/year
- Major breaches detected
- **Requirement**: External audit, PCI compliance quarterly

### Level 2
- 1-6 million transactions/year
- **Requirement**: Self-assessment questionnaire + scan

### Level 3
- <1 million transactions/year
- Not a target of breaches
- **Requirement**: Self-assessment questionnaire

### Level 4 (Lowest Risk)
- E-commerce
- All cards outsourced to processor
- **Requirement**: Self-assessment questionnaire

## Penalties for Non-Compliance

| Violation | Fine | Duration |
|-----------|------|----------|
| Minor | $5,000 - $25,000 | Monthly |
| Major | $25,000 - $100,000+ | Monthly |
| Data Breach | Compromised amount × $25 | Per record |
| Loss of card processing | Total business impact | Until compliance |

## Real-World Breach: Target (2013)

```
What happened:
- 40 million card numbers stolen
- 70 million personal records compromised
- PCI DSS violations
- Lack of encryption
- Poor network segmentation

Result:
- $18.5 million settlement
- Business reputation damaged
- Trust lost for years
- Forced to overhaul security
```

## Compliance Checklist

- [ ] No storage of CVV/PIN
- [ ] All card data tokenized
- [ ] HTTPS/TLS enabled
- [ ] Firewalls configured
- [ ] Access controls implemented
- [ ] Unique user IDs required
- [ ] Multi-factor authentication for admins
- [ ] Intrusion detection enabled
- [ ] Regular vulnerability scans
- [ ] Annual penetration testing
- [ ] Security incident response plan
- [ ] Employee security training

## Best Practices

✅ Use Stripe/PayPal (they handle PCI)  
✅ Never store full card numbers  
✅ Tokenize all card data  
✅ Encrypt sensitive data  
✅ Use HTTPS everywhere  
✅ Log access but never card data  
✅ Regular security audits  
✅ Train all employees  
✅ Have incident response plan  
✅ Monitor for unauthorized access  

## Summary

PCI DSS is the law for handling payment cards:
1. Protects customer data
2. Reduces fraud
3. Creates industry standards
4. Non-compliance = massive penalties
5. Best approach: Use payment processors (Stripe, PayPal)

## Key Takeaways

1. **Never store full card numbers** - Use tokenization
2. **Never store CVV** - Temporary, for processing only
3. **Encrypt everything** - At rest and in transit
4. **HTTPS always** - Never HTTP
5. **Access controls** - Least privilege
6. **Log everything** - Except card data
7. **Test regularly** - Pentesting, vulnerability scanning
8. **Train employees** - Security awareness
