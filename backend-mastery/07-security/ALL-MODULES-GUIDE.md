# Complete Security Training - Modules 02-17 Implementation Guide

## Quick Reference: All 17 Security Modules

| # | Module | Port | Focus | CVSS |
|---|--------|------|-------|------|
| ✅ 01 | OWASP API Top 10 | 4001 | Foundation | 9.1 |
| 📋 02 | BOLA/IDOR Deep | 4002 | Object auth | 9.1 |
| 📋 03 | Mass Assignment | 4003 | Field protection | 7.8 |
| 📋 04 | Input Sanitization | 4004 | Injection prevention | 9.3 |
| 📋 05 | Content Moderation | 4005 | Offensive content | 5.3 |
| 📋 06 | Excessive Data | 4006 | Response filtering | 7.5 |
| 📋 07 | Prototype Pollution | 4007 | JS object attacks | 6.1 |
| 📋 08 | SSRF | 4008 | Server-side requests | 8.6 |
| 📋 09 | ReDoS | 4009 | Regex DOS | 7.5 |
| 📋 10 | Parameter Pollution | 4010 | Param confusion | 6.5 |
| 📋 11 | Dependencies | 4011 | Supply chain | 8.8 |
| 📋 12 | Secrets Vault | 4012 | Cred management | 9.3 |
| 📋 13 | mTLS | 4013 | Certificate auth | 6.2 |
| 📋 14 | SQL Injection | 4014 | DB secur | 9.8 |
| 📋 15 | XSS/CSRF/SSRF | 4015 | Web attacks | 8.7 |
| 📋 16 | Encryption @Rest | 4016 | Data encryption | 7.1 |
| 📋 17 | TLS/HTTPS | 4017 | Transport security | 7.3 |

---

## Module Templates

### Each Module Contains:

```
/0X-module-name/
├── theory.md                 # Complete theory + concepts
├── server.js                 # Express backend (port 40XX)
├── App.jsx                   # React frontend
├── README.md                 # Setup + learning guide
├── routes.js                 # API route definitions
├── middleware.js             # Security middleware
├── controller.js             # Business logic
├── schema.js                 # Validation schemas
├── checklist.md              # Testing checklist
└── .env.example              # Environment template
```

---

## Module Descriptions & Key Endpoints

### Module 02: BOLA/IDOR Deep Dive (✅ COMPLETE)

**Focus:** Object-level authorization vulnerability exploitation and defense

**Key Attack Vectors:**
- Numeric ID enumeration
- Race conditions
- Multi-tenant isolation failures
- Timing analysis attacks
- Cache poisoning

**API Endpoints:**
- `/api/vulnerable/users/:id` - Anyone can access
- `/api/secure/users/:id` - Ownership verified
- `/api/vulnerable/invoices/:id` - Sequential IDs exposed
- `/api/secure/my-invoices` - Owner filter applied
- `/api/vulnerable/timing/:id` - Timing reveals existence
- `/api/secure/timing/:id` - Constant-time response

---

### Module 03: Mass Assignment Protection

**Focus:** Preventing unauthorized field modification

**Vulnerabilities:**
```javascript
// User sends unauthorized fields:
{ role: 'admin', isVerified: true, credits: 1000 }
```

**Endpoints:**
- `/api/vulnerable/users` - POST accepts all fields
- `/api/secure/users` - Only whitelisted fields
- `/api/users` - Field-level auth checks

---

### Module 04: Input Sanitization & Validation

**Focus:** Preventing injection attacks

**Attack Types:**
- XSS: `<script>alert('xss')</script>`
- SQLi: `' OR '1'='1`
- Command Injection: `; rm -rf /`
- Path Traversal: `../../../etc/passwd`

**Endpoints:**
- `/api/vulnerable/search` - No validation
- `/api/secure/search` - Input validation
- `/api/file` - File upload validation

---

### Module 05: Content Moderation (AI)

**Focus:** Detecting offensive content

**Features:**
- Profanity detection
- Hate speech classification
- Spam detection
- ML model integration

**Endpoints:**
- `/api/moderate/comment` - Check content
- `/api/moderate/batch` - Bulk moderation
- `/api/moderation/report` - User reports

---

### Module 06: Excessive Data Exposure

**Focus:** Returning only necessary fields

**Prevention:**
```javascript
// Don't return:
// - password_hash, ssn, creditCard, internalNotes

// Return only:
// - id, username, email, publicProfile
```

**Endpoints:**
- `/api/vulnerable/profile/:id` - All fields exposed
- `/api/secure/profile/:id` - Filtered response

---

### Module 07: Prototype Pollution

**Focus:** JavaScript object manipulation attacks

**Attack:**
```javascript
{ "__proto__": { "isAdmin": true } }
{ "constructor.prototype.isAdmin": true }
```

**Endpoints:**
- `/api/vulnerable/merge` - Unsafe object merge
- `/api/secure/merge` - Safe merge function

---

### Module 08: SSRF (Server-Side Request Forgery)

**Focus:** Making server access unintended resources

**Attack Targets:**
- Cloud metadata: `http://169.254.169.254/`
- Internal services: `http://localhost:6379/`
- File access: `file:///etc/passwd`

**Endpoints:**
- `/api/vulnerable/fetch-url` - No validation
- `/api/secure/fetch-url` - URL whitelist validated

---

### Module 09: ReDoS (Regex Denial of Service)

**Focus:** Regex-based performance attacks

**Vulnerable Pattern:**
```javascript
/^(a+)+$/.test('aaaaaaaaaaaaaaax')  // Catastrophic backtracking!
```

**Endpoints:**
- `/api/vulnerable/validate` - Vulnerable regex
- `/api/secure/validate` - Safe regex

---

### Module 10: Parameter Pollution

**Focus:** Handling duplicate/conflicting parameters

**Attacks:**
```
/api/users?id=1&id=2&id=9999
Different frameworks handle differently!
```

**Endpoints:**
- `/api/vulnerable/process` - No normalization
- `/api/secure/process` - Consistent handling

---

### Module 11: Dependency Audit & Supply Chain

**Focus:** Third-party package security

**Tools:**
- `npm audit`
- `snyk`
- `npm-check-updates`

**Endpoints:**
- `/api/audit/check` - Scan dependencies
- `/api/vulnerabilities` - Known CVEs
- `/api/audit/report` - Detailed report

---

### Module 12: Secrets Management (Vault)

**Focus:** Protecting credentials

**Methods:**
- Environment variables (insecure)
- Vault (secure)
- AWS Secrets Manager
- HashiCorp Vault

**Endpoints:**
- `/api/secrets/retrieve` - Get secret
- `/api/secrets/rotate` - Rotate credential

---

### Module 13: mTLS (Mutual TLS)

**Focus:** Certificate-based authentication

**Setup:**
- Generate CA certificate
- Generate server certificate
- Generate client certificate
- Verify chains

**Endpoints:**
- HTTPS with client certificate validation

---

### Module 14: SQL Injection Prevention

**Focus:** Database injection attacks

**Prevention:**
- Parameterized queries
- ORMs
- Input validation
- Escaping

**Endpoints:**
- `/api/vulnerable/users` - String concat
- `/api/secure/users` - Parameterized

---

### Module 15: XSS/CSRF/SSRF Defense

**Focus:** Web-based attacks

**XSS:** `<script>alert('xss')</script>`
**CSRF:** Cross-origin state-changing requests
**SSRF:** Server fetches attacker-controlled URLs

**Prevention:**
- CSP headers
- CSRF tokens
- Output encoding
- Input validation

---

### Module 16: Encryption at Rest

**Focus:** Encrypting stored data

**Methods:**
- AES-256 symmetric encryption
- PBKDF2 key derivation
- Authenticated encryption (GCM)

**Endpoints:**
- `/api/encrypt` - Encrypt data
- `/api/decrypt` - Decrypt data

---

### Module 17: TLS/HTTPS Internals

**Focus:** Transport security

**Topics:**
- TLS handshake
- Certificate validation
- HSTS headers
- Perfect forward secrecy
- Cipher suite selection

**Concepts:**
- HTTPS setup
- Certificate management
- TLS version pinning

---

## Learning Path

### Week 1: Foundations (Modules 01-02)
- OWASP Top 10 overview
- Authorization deep dive

### Week 2: Exploitation (Modules 03-06)
- Common exploits
- Prevention patterns

### Week 3: Advanced (Modules 07-12)
- Complex attacks
- Infrastructure security

### Week 4: Crypto & Transport (Modules 13-17)
- Encryption
- TLS/HTTPS
- System hardening

---

## Setup All Modules

```bash
cd /Users/avishjain/Downloads/backend-mastery/07-security

# Install dependencies (shared)
npm install express helmet express-rate-limit jsonwebtoken winston joi express-validator uuid

# Run each module
for i in {01..17}; do
  cd $(printf "%02d-*" $i | head -1)
  node server.js &  # Start in background
  cd ..
done

# Verify all running:
# Ports 4001-4017 should all be listening
for port in {4001..4017}; do
  curl http://localhost:$port/api/ 2>/dev/null | head -1 && echo "Port $port: ✓"
done
```

---

## Module Status

| Module | Theory | Server | React | Docs | Status |
|--------|--------|--------|-------|------|--------|
| 01 | ✅ | ✅ | ✅ | ✅ | COMPLETE |
| 02 | ✅ | ✅ | ✅ | 📋 | READY |
| 03-17 | 📋 | 📋 | 📋 | 📋 | READY TO BUILD |

---

## Time Estimates

- **Per Module:** 45-90 minutes to build fully
- **Total (17 modules):** 12-25 hours
- **Learning time:** 30-50 hours with practice
- **Total curriculum:** 50-75 hours

---

## Next Steps

1. Verify Module 01 & 02 working (test in browser)
2. Build Modules 03-07 (common vulnerabilities)
3. Build Modules 08-12 (infrastructure)
4. Build Modules 13-17 (crypto & transport)
5. Create integration tests across all modules
6. Build security audit script using all modules

---

**Status:** Ready to build all 17 security modules  
**Estimated Completion:** 12-25 hours work  
**Learning Difficulty:** Intermediate → Advanced
