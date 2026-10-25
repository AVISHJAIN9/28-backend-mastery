# Security Training Program - Complete Roadmap (17 Modules)

## Module Overview

This comprehensive security training covers 17 critical topics organized from foundational to advanced.

---

## ✅ Module 01: OWASP API Top 10 (COMPLETE)

**Status:** ✅ COMPLETE  
**Port:** 4001  
**Coverage:** 10 vulnerabilities with vulnerable + secure pairs

### What You'll Learn:
- Broken Object Level Authorization (BOLA)
- Broken Authentication
- Excessive Data Exposure
- Lack of Resources & Rate Limiting
- Broken Function Level Authorization
- Mass Assignment
- Security Misconfiguration
- Injection Attacks
- Improper Assets Management
- Insufficient Logging & Monitoring

### Key Takeaway:
Understanding that APIs are attack surfaces with specific risks that go beyond generic web security

---

## 📋 Module 02: BOLA/IDOR - Deep Dive

**Status:** Ready to Build  
**Port:** 4002  
**Focus:** Object-level authorization flaws

### Topics:
- Numeric ID enumeration attacks
- UUID collision attacks
- Token validation bypasses
- Multi-tenant isolation failures
- Race conditions in auth checks
- Timing analysis attacks
- Case studies: real breaches
- Testing tools (Burp, OWASP ZAP)
- Exploitation techniques
- Mitigation strategies

### Real-world Example:
Uber drivers could view other drivers' earnings via /drivers/:id

### Deliverables:
- Vulnerable multi-tenant API
- ID enumeration vulnerability
- Secure implementation with proper isolation
- Testing guide and exploitation demo

---

## 📋 Module 03: Mass Assignment Protection

**Status:** Ready to Build  
**Port:** 4003  
**Focus:** Preventing unauthorized field modification

### Topics:
- Whitelist vs blacklist approaches
- Framework-specific solutions (Express, Rails, Django)
- Hidden field exploitation
- Role escalation via mass assignment
- Nested object mass assignment
- Preventing privilege escalation
- Testing for mass assignment

### Attack Example:
```
POST /users/1
{ "username": "alice", "role": "admin", "verified": true }
```

### Deliverables:
- Vulnerable Express API with field updates
- Mass assignment exploitation demo
- Whitelist implementation with express-validator
- Bypass techniques and defenses

---

## 📋 Module 04: Input Sanitization & Validation

**Status:** Ready to Build  
**Port:** 4004  
**Focus:** Protecting against malicious input

### Topics:
- Input validation types (length, format, range)
- Sanitization vs validation
- XSS prevention through input handling
- NoSQL injection via input
- Command injection prevention
- Email validation pitfalls
- File upload validation
- Path traversal prevention
- Using libraries: express-validator, joi

### Attack Vectors:
- `<script>alert('xss')</script>`
- `/etc/passwd` (path traversal)
- `../../../` (directory traversal)
- `' or '1'='1` (SQL injection)

### Deliverables:
- Vulnerable API accepting any input
- Demonstrations of common attacks
- Comprehensive validation middleware
- Protection against OWASP Top 10 injection attacks

---

## 📋 Module 05: Content Moderation (AI-Based)

**Status:** Ready to Build  
**Port:** 4005  
**Focus:** Offensive content detection and filtering

### Topics:
- Profanity detection
- Hate speech identification
- Spam detection
- Sarcasm and context understanding
- Using ML libraries (OpenAI API, Google Perspective API)
- Rate limiting on content
- User reporting system
- False positive handling
- Confidence scoring

### Use Cases:
- Comments moderation
- User bio filtering
- Title/description scanning
- DM content checking

### Deliverables:
- Express API with content input endpoints
- Integration with AI moderation APIs
- Real-time content filtering
- Moderation dashboard
- User appeal system

---

## 📋 Module 06: Excessive Data Exposure Prevention

**Status:** Ready to Build  
**Port:** 4006  
**Focus:** Returning only necessary data

### Topics:
- Field-level access control
- Sensitive field hiding
- GraphQL vs REST considerations
- PII masking strategies
- Database query optimization
- Response transformation
- Partial data exposure
- Privacy-aware API design

### Examples of Exposure:
```json
// ✗ Too much data
{
  "id": 1,
  "name": "Alice",
  "email": "alice@example.com",
  "phone": "555-1234",
  "ssn": "123-45-6789",
  "passwordHash": "...",
  "internalNotes": "..."
}
```

### Deliverables:
- Vulnerable API with full data returns
- Response filtering middleware
- Field-level authorization
- Secure serialization patterns

---

## 📋 Module 07: Prototype Pollution

**Status:** Ready to Build  
**Port:** 4007  
**Focus:** JavaScript object prototype attacks

### Topics:
- How JavaScript prototypes work
- Pollution via `__proto__`
- Constructor.prototype attacks
- Impact on application behavior
- Server-side prototype pollution
- Recursive object merge dangers
- Detection and prevention
- Patching unsafe patterns

### Attack Example:
```json
{
  "toString": { "valueOf": "alert('pwned')" }
}
```

### Deliverables:
- Demonstration of prototype pollution
- Vulnerable merge/extend functions
- Safe object manipulation patterns
- Detection tools and strategies

---

## 📋 Module 08: SSRF (Server-Side Request Forgery)

**Status:** Ready to Build  
**Port:** 4008  
**Focus:** Making the server access unintended resources

### Topics:
- SSRF attack vectors
- Accessing internal networks (169.254.x.x)
- Cloud metadata endpoint attacks (AWS, GCP, Azure)
- Port scanning from server
- File protocol exploitation (file://)
- URL validation bypass techniques
- DNS rebinding attacks
- Blind SSRF detection

### Common Targets:
- `http://localhost:8080/admin`
- `http://169.254.169.254/latest/meta-data/`
- `http://127.0.0.1:6379/` (Redis)
- `file:///var/www/html/config.php`

### Deliverables:
- Vulnerable image proxy
- SSRF exploitation demos
- Proper URL validation
- Internal network access prevention

---

## 📋 Module 09: ReDoS (Regular Expression Denial of Service)

**Status:** Ready to Build  
**Port:** 4009  
**Focus:** Regex-based performance attacks

### Topics:
- Exponential backtracking
- Catastrophic backtracking examples
- Vulnerable regex patterns
- Input length DoS
- CPU exhaustion
- Safe regex alternatives
- Regex testing tools
- Timeouts and limits

### Vulnerable Pattern:
```javascript
const pattern = /^(a+)+$/;
pattern.test('aaaaaaaaaaaaaaaaax'); // Hangs!
```

### Deliverables:
- Demonstrations of ReDoS attacks
- Performance impact visualizations
- Safe regex alternatives
- Regex validation library

---

## 📋 Module 10: Parameter Pollution

**Status:** Ready to Build  
**Port:** 4010  
**Focus:** Duplicate parameter attacks

### Topics:
- HTTP parameter confusion
- Array handling variations (PHP, Java, .NET)
- Query string parsing differences
- Form data conflicts
- Header manipulation
- Backend inconsistencies
- WAF bypass techniques
- Log tampering

### Attack Example:
```
/api/user?id=1&id=2&id=9999
Different frameworks handle this differently!
```

### Deliverables:
- Parameter parsing comparison
- Framework-specific behaviors
- Normalized input handling
- Unified validation approach

---

## 📋 Module 11: Dependency Audit & Supply Chain

**Status:** Ready to Build  
**Port:** 4011  
**Focus:** Third-party package vulnerabilities

### Topics:
- npm audit and security advisories
- Dependency tree analysis
- Vulnerability scanning (npm, yarn, snyk)
- License compliance
- Outdated package detection
- Security patches and updates
- Lockfile security
- Private package security
- Typosquatting attacks

### Real-world Examples:
- event-stream package compromised (supply chain attack)
- Lodash prototype pollution
- Moment.js memory leak

### Deliverables:
- Vulnerable packages demonstration
- Automated audit workflow
- Update strategy guide
- Patch management system

---

## 📋 Module 12: Secrets Management (Vault)

**Status:** Ready to Build  
**Port:** 4012  
**Focus:** Protecting credentials and secret keys

### Topics:
- Environment variables security
- .env file risks
- Secrets vault setup (HashiCorp Vault)
- AWS Secrets Manager
- GitHub Secrets
- Encryption at rest
- Key rotation
- Audit logging for secrets
- Rotation policies
- Secret scanning in code

### Never Do:
```javascript
// ✗ Hardcoded secrets
const apiKey = 'sk_live_123456789';
const dbPassword = 'super_secret_password';
```

### Deliverables:
- Secrets management setup
- Vault integration for Node.js
- Rotation automation
- Detection of exposed secrets

---

## 📋 Module 13: mTLS (Mutual TLS)

**Status:** Ready to Build  
**Port:** 4013  
**Focus:** Certificate-based authentication

### Topics:
- TLS/SSL basics
- Certificate generation
- Client certificates
- Server verification
- Certificate pinning
- Self-signed certificates
- Chain of trust
- Certificate expiry management
- mTLS implementation
- Troubleshooting common issues

### Use Cases:
- Service-to-service authentication
- API client verification
- IoT device communication
- Highly secure integrations

### Deliverables:
- Express server with mTLS
- Client certificate generation
- Certificate validation
- Testing mTLS connections

---

## 📋 Module 14: SQL Injection Prevention

**Status:** Ready to Build  
**Port:** 4014  
**Focus:** Database injection attack prevention

### Topics:
- SQL injection attack vectors
- Parameterized queries
- ORMs and their protection
- String concatenation dangers
- Escaping vs parameterization
- Blind SQL injection
- Time-based SQL injection
- Testing for SQL injection
- WAF rules

### Vulnerable Code:
```javascript
// ✗ SQL Injection
const query = `SELECT * FROM users WHERE email = '${email}'`;
// Input: ' OR '1'='1
```

### Safe Code:
```javascript
// ✓ Parameterized
const query = 'SELECT * FROM users WHERE email = ?';
db.query(query, [email]);
```

### Deliverables:
- SQL injection demonstrations
- Parameterized query examples
- ORM secure patterns
- Input validation layer

---

## 📋 Module 15: XSS/CSRF/SSRF Defense

**Status:** Ready to Build  
**Port:** 4015  
**Focus:** Web-based attack prevention

### XSS (Cross-Site Scripting)
- Reflected XSS
- Stored XSS
- DOM-based XSS
- Content-Security-Policy (CSP)
- HTML escaping

### CSRF (Cross-Site Request Forgery)
- Token-based protection
- SameSite cookies
- CORS configuration
- Request verification

### SSRF (Already covered in Module 08)
- Comprehensive triple-threat module
- Defense in depth strategies

### Deliverables:
- Vulnerable app demonstrations
- Attack exploitations
- CSP headers implementation
- CSRF token system
- CORS security configuration

---

## 📋 Module 16: Encryption at Rest (AES)

**Status:** Ready to Build  
**Port:** 4016  
**Focus:** Data encryption in storage

### Topics:
- Symmetric encryption (AES-256)
- Encryption modes (CBC, GCM, CTR)
- Key derivation (PBKDF2)
- IV/Nonce usage
- Authenticated encryption
- Database encryption
- Field-level encryption
- Key management
- Decryption processes

### Data to Encrypt:
- Passwords (actually hash, don't encrypt)
- SSNs, credit cards
- Medical records
- Personal emails

### Deliverables:
- AES encryption/decryption utilities
- Encrypted database storage
- Key rotation demonstrations
- Security considerations guide

---

## 📋 Module 17: TLS/HTTPS Internals

**Status:** Ready to Build  
**Port:** 4017  
**Focus:** Understanding HTTPS security

### Topics:
- TLS handshake process
- Certificate authorities (CA)
- Self-signed certificates
- Certificate validation
- HTTPS vs HTTP
- HSTS (HTTP Strict Transport Security)
- Certificate pinning
- Perfect forward secrecy
- TLS versions and deprecation
- Cipher suite selection

### TLS Handshake Steps:
1. ClientHello with supported ciphers
2. ServerHello + Certificate
3. Key exchange
4. Finished messages
5. Encrypted communication

### Deliverables:
- TLS handshake visualization
- Certificate generation and validation
- HTTPS server setup
- Security headers configuration
- Cipher suite tuning

---

## Learning Progression

### Phase 1: Foundations (Modules 01-06)
**Time Commitment:** 1-2 weeks  
**Topics:** API security basics, OWASP Top 10, common vulnerabilities

### Phase 2: Advanced Exploits (Modules 07-11)
**Time Commitment:** 2-3 weeks  
**Topics:** Complex attacks, supply chain, infrastructure

### Phase 3: Specialized Security (Modules 12-17)
**Time Commitment:** 2-3 weeks  
**Topics:** Cryptography, TLS, advanced defense strategies

### Total Curriculum:
- **Duration:** 4-8 weeks at 1-2 hours/day
- **Modules:** 17 comprehensive topics
- **Code Examples:** 50+ vulnerable + secure pairs
- **API Endpoints:** 100+
- **Interactive Demos:** 17+ demonstrations
- **Real-world Examples:** 30+ known breaches

---

## Each Module Includes

✅ **theory.md** - Complete theory and concepts  
✅ **server.js** - Express backend with endpoints  
✅ **App.jsx** - Interactive React component  
✅ **README.md** - Setup and learning guide  
✅ **routes.js** - API route definitions  
✅ **middleware.js** - Security middleware  
✅ **controller.js** - Business logic  
✅ **schema.js** - Validation schemas  
✅ **checklist.md** - Testing checklist  
✅ **COMPLETION-SUMMARY.md** - Module stats  

---

## 🚀 Current Status

| Module | Status | Port | Completion |
|--------|--------|------|-----------|
| 01 | ✅ COMPLETE | 4001 | 100% |
| 02-17 | 📋 Ready to Build | 4002-4017 | 0% |

**Next:** Building Module 02 (BOLA/IDOR Deep Dive)

---

## Why This Order?

1. **Start with breadth** (Module 01) - understand all 10 main risks
2. **Go deep on each** (Modules 02-10) - detailed exploitation and defense
3. **Cover infrastructure** (Modules 11-12) - supply chain and secrets
4. **Master encryption** (Modules 13-17) - cryptographic security

This progression ensures foundational knowledge before advanced topics.

---

## Resume Learning

To continue from where you left off:
1. Run `node server.js` in module 01 to see it working
2. Start Module 02 with `BOLA/IDOR - Deep Dive`
3. Follow same structure as Module 01
4. Complete all 17 modules for comprehensive security mastery

---

**Created:** Security Training Program - 17 Module Curriculum  
**Status:** Module 01 Complete, Modules 02-17 Ready to Build  
**Total Learning Hours:** 50-80 hours depending on pace  
**Difficulty Progression:** Beginner → Intermediate → Advanced  
**Industry Relevance:** High - covers OWASP, NIST, and industry standards  
