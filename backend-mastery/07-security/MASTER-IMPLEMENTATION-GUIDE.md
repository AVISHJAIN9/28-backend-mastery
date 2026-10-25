# Security Training Program - Complete Implementation Guide
## 17 Comprehensive Security Modules (Ports 4001-4017)

---

## ✅ MODULES 01-02: COMPLETE

### Module 01: OWASP API Top 10 (Port 4001)
- **Status:** ✅ COMPLETE
- **Files:** theory.md, server.js, App.jsx, README.md, COMPLETION-SUMMARY.md
- **Coverage:** 10 OWASP vulnerabilities with vulnerable + secure pairs
- **API Endpoints:** 20+ (10 vulnerable, 10 secure, utilities)
- **Backend:** 500 LOC, 8 middleware layers, Winston logging
- **Frontend:** 400 LOC React, interactive testing UI
- **Testing:** Full interactive test suite included

### Module 02: BOLA/IDOR Deep Dive (Port 4002)
- **Status:** ✅ COMPLETE  
- **Files:** theory.md, server.js, App.jsx
- **Focus:** Broken Object Level Authorization
- **Attack Vectors:** 5 (enumeration, race conditions, multi-tenant, timing, caching)
- **Real-world Examples:** Instagram, Uber, Airbnb
- **API Endpoints:** 10+ (5 vulnerable, 5 secure)
- **Backend:** 400 LOC, realistic multi-tenant scenario
- **Frontend:** React testing component
- **CVSS Score:** 9.1 (Critical)

---

## 📋 MODULES 03-17: READY TO BUILD

Each module follows the same pattern:

### Standard Module Structure

```
/0X-module-name/
├── theory.md          # 2-4KB comprehensive theory
├── server.js          # 300-500 LOC Express backend
├── App.jsx            # 300-400 LOC React component
├── README.md          # Setup guide + examples
├── routes.js          # (Skeleton)
├── middleware.js      # (Skeleton)
├── controller.js      # (Skeleton)
├── schema.js          # (Skeleton)
├── checklist.md       # (Skeleton)
└── .env.example       # (Skeleton)
```

---

## DETAILED MODULE SPECIFICATIONS

### Module 03: Mass Assignment Protection (Port 4003)

**theory.md Content:**
- What is mass assignment vulnerability
- Attack vectors (privilege escalation, data tampering)
- Real-world examples
- Prevention strategies (whitelist, schema, view models)
- CVSS: 7.8

**server.js Endpoints:**
```
POST /api/vulnerable/users      - Accepts all fields
POST /api/secure/users          - Whitelisted fields only
POST /api/vulnerable/update     - Mass assignment demo
POST /api/secure/update         - Protected update
GET /api/comparison             - Side-by-side comparison
```

**App.jsx Component:**
- Login form
- Send requests with extra fields
- Compare vulnerable vs secure responses
- Show what fields are accepted/rejected

**Real-world Example:**
- Privilege escalation: role=admin bypass
- Verification bypass: emailVerified=true
- Credit manipulation: credits=99999

---

### Module 04: Input Sanitization & Validation (Port 4004)

**theory.md:**
- Validation vs Sanitization vs Encoding
- Attack types: XSS, SQL Injection, Command Injection, Path Traversal
- Common regex patterns
- Prevention libraries (joi, express-validator, DOMPurify)
- CVSS: 9.3

**server.js Endpoints:**
```
GET /api/vulnerable/search      - No validation
GET /api/secure/search          - Input validation
POST /api/vulnerable/upload     - File upload no check
POST /api/secure/upload         - File validation
GET /api/vulnerable/path        - Path traversal allowed
GET /api/secure/path            - Path sanitized
```

**Demo Attacks:**
- XSS payload: `<script>alert('xss')</script>`
- SQL injection: `' OR '1'='1`
- Command injection: `; rm -rf /`
- Path traversal: `../../../etc/passwd`

---

### Module 05: Content Moderation (Port 4005)

**theory.md:**
- Content types: profanity, hate speech, spam, adult, misinformation
- Rule-based vs ML approaches
- Tools: Google Perspective, OpenAI, AWS Rekognition
- Implementation patterns
- CVSS: 5.3

**server.js Endpoints:**
```
POST /api/moderate/text         - Analyze content
POST /api/moderate/batch        - Bulk moderation
GET /api/moderate/rules         - View moderation rules
GET /api/moderate/report        - Moderation report
```

**Demo:**
- Test benign content
- Test offensive content
- Show ML confidence scores
- Demonstrate rule-based vs ML

---

### Module 06: Excessive Data Exposure (Port 4006)

**theory.md:**
- Sensitive data categories (financial, personal, auth, medical, internal)
- Response filtering patterns
- Data masking techniques
- Field-level access control
- CVSS: 7.5

**server.js Endpoints:**
```
GET /api/vulnerable/user/:id    - All fields returned
GET /api/secure/user/:id        - Safe fields only
GET /api/vulnerable/invoice/:id - Sensitive data exposed
GET /api/secure/invoice/:id     - Filtered response
```

**Data Shown:**
- Vulnerable: password_hash, SSN, creditCard
- Secure: id, username, email only

---

### Module 07: Prototype Pollution (Port 4007)

**theory.md:**
- JavaScript prototype chain
- __proto__ manipulation
- constructor.prototype exploitation
- Unsafe libraries (Object.assign, _.merge)
- Prevention techniques
- CVSS: 6.1

**server.js Endpoints:**
```
POST /api/vulnerable/merge      - Unsafe Object.assign
POST /api/secure/merge          - Safe merge
POST /api/vulnerable/profile    - Prototype pollution demo
POST /api/secure/profile        - Protected
```

**Demo Attack:**
```json
{ "__proto__": { "isAdmin": true } }
```

---

### Module 08: SSRF (Port 4008)

**theory.md:**
- Attack targets (metadata, internal services, file://)
- Cloud metadata endpoints (AWS, GCP, Azure)
- Common vulnerable patterns
- URL whitelist prevention
- Private IP range blocking
- CVSS: 8.6

**server.js Endpoints:**
```
GET /api/vulnerable/fetch?url=  - Fetch any URL
GET /api/secure/fetch?url=      - Whitelist validated
POST /api/vulnerable/proxy      - Proxy without checks
POST /api/secure/proxy          - Safe proxy
```

**Attack Targets Explained:**
- 169.254.169.254/latest/meta-data/
- localhost:8080, 10.0.0.1:27017
- file:///etc/passwd

---

### Module 09: ReDoS (Port 4009)

**theory.md:**
- Catastrophic backtracking explanation
- Vulnerable patterns (nested quantifiers, alternations)
- Exponential time complexity
- Attack execution
- Prevention: rewrite, timeouts, safe-regex
- CVSS: 7.5

**server.js Endpoints:**
```
GET /api/vulnerable/validate?email= - Vulnerable regex
GET /api/secure/validate?email=     - Safe regex
POST /api/vulnerable/test           - ReDoS demo
POST /api/secure/test               - Protected
```

**Demo Attack:**
```javascript
/^(a+)+$/ with input "aaaaaaaaaaaaaaaaaax"
```

---

### Module 10: Parameter Pollution (Port 4010)

**theory.md:**
- Framework differences (PHP, Java, Node, ASP.NET)
- How different servers handle duplicates
- Cache poisoning via pollution
- WAF bypass techniques
- Prevention strategies
- CVSS: 6.5

**server.js Endpoints:**
```
GET /api/vulnerable/process?id=1&id=2     - No normalization
GET /api/secure/process?id=1&id=2         - Explicit handling
GET /api/framework-test?param=a&param=b   - Show framework behavior
```

---

### Module 11: Dependency Audit (Port 4011)

**theory.md:**
- npm audit, Snyk, npm-check-updates
- Supply chain attacks (event-stream, etc)
- CVE databases
- Lockfile security
- Typosquatting
- CVSS: 8.8

**server.js Endpoints:**
```
POST /api/audit/scan            - Scan dependencies
GET /api/vulnerabilities        - List vulnerabilities
GET /api/packages               - Package list
POST /api/update-check          - Check for updates
```

---

### Module 12: Secrets Vault (Port 4012)

**theory.md:**
- Environment variables (insecure)
- HashiCorp Vault setup
- AWS Secrets Manager
- Azure KeyVault
- Encryption, rotation, audit logging
- CVSS: 9.3

**server.js Endpoints:**
```
GET /api/secrets/retrieve       - Fetch secret
POST /api/secrets/rotate        - Rotate credential
GET /api/secrets/audit          - Audit log
POST /api/secrets/store         - Store secret
```

---

### Module 13: mTLS (Port 4013)

**theory.md:**
- TLS handshake process
- Certificate generation (CA, server, client)
- Certificate validation
- Chain of trust
- mTLS implementation
- CVSS: 6.2

**server.js:**
- HTTPS server with client cert requirement
- Certificate validation
- Connection info display

---

### Module 14: SQL Injection (Port 4014)

**theory.md:**
- SQL injection attack patterns
- Parameterized queries
- ORMs and protection
- Blind SQL injection
- Time-based SQL injection
- Testing tools
- CVSS: 9.8

**server.js Endpoints:**
```
GET /api/vulnerable/search?q=   - String concatenation
GET /api/secure/search?q=       - Parameterized query
GET /api/vulnerable/login       - SQL authentication bypass
GET /api/secure/login           - Safe authentication
```

---

### Module 15: XSS/CSRF/SSRF Defense (Port 4015)

**theory.md:**
- XSS types (reflected, stored, DOM)
- CSRF attack flow
- SSRF (covered elsewhere but included)
- CSP headers
- CSRF tokens
- SameSite cookies
- CVSS: 8.7

**server.js Endpoints:**
```
POST /api/vulnerable/comment    - No XSS protection
POST /api/secure/comment        - XSS prevention
POST /api/vulnerable/action     - No CSRF token
POST /api/secure/action         - CSRF protected
```

---

### Module 16: Encryption at Rest (Port 4016)

**theory.md:**
- AES-256 symmetric encryption
- Encryption modes (CBC, GCM, CTR)
- PBKDF2 key derivation
- IV/Nonce usage
- Authenticated encryption
- Key management
- CVSS: 7.1

**server.js Endpoints:**
```
POST /api/encrypt               - Encrypt data
POST /api/decrypt               - Decrypt data
POST /api/hash                  - One-way hash
GET /api/keys                   - Key info
```

---

### Module 17: TLS/HTTPS Internals (Port 4017)

**theory.md:**
- TLS 1.3 handshake steps
- Certificate authorities (Let's Encrypt, etc)
- Self-signed certificates
- HSTS headers
- Certificate pinning
- Cipher suite selection
- Perfect forward secrecy
- CVSS: 7.3

**server.js:**
- HTTPS server setup
- TLS version info
- Cipher suite display
- Certificate details
- HSTS header configuration

---

## Implementation Priorities

### Priority 1 (Done): Modules 01-02
- ✅ OWASP Top 10
- ✅ BOLA/IDOR

### Priority 2 (Next): Modules 03-06
- Critical vulnerabilities
- Common in real APIs
- High impact
- Estimated: 4-6 hours

### Priority 3 (Then): Modules 07-12
- Advanced attacks
- Infrastructure security
- Supply chain
- Estimated: 6-8 hours

### Priority 4 (Finally): Modules 13-17
- Cryptography
- TLS/HTTPS
- Transport security
- Estimated: 4-6 hours

---

## Quick Build Checklist

For Each Module:

- [ ] Create directory `/0X-module-name/`
- [ ] Write `theory.md` (2-4KB)
- [ ] Write `server.js` (300-500 LOC, Express server on port 40XX)
- [ ] Write `App.jsx` (300-400 LOC, React testing UI)
- [ ] Write `README.md` (Setup, examples, real-world cases)
- [ ] Test endpoints manually
- [ ] Add examples to interactive UI
- [ ] Document attack/defense patterns
- [ ] Add real-world examples

---

## Setup & Testing All Modules

```bash
#!/bin/bash

# Install shared dependencies once
cd /Users/avishjain/Downloads/backend-mastery/07-security
npm install express helmet express-rate-limit jsonwebtoken winston joi uuid

# Run all modules
for i in {01..17}; do
  dir=$(ls -d ${i}-* 2>/dev/null | head -1)
  if [ -d "$dir" ] && [ -f "$dir/server.js" ]; then
    (cd "$dir" && node server.js) &
    PORT=$((4000 + i))
    echo "Module ${i} started on port $PORT"
  fi
done

# Verify all running
for port in {4001..4017}; do
  curl -s http://localhost:$port/api/ >/dev/null && echo "Port $port: ✓" || echo "Port $port: ✗"
done
```

---

## Estimated Completion Time

| Phase | Modules | Time | Status |
|-------|---------|------|--------|
| Phase 1 | 01-02 | 4-6 hrs | ✅ COMPLETE |
| Phase 2 | 03-06 | 4-6 hrs | 📋 Ready |
| Phase 3 | 07-12 | 6-8 hrs | 📋 Ready |
| Phase 4 | 13-17 | 4-6 hrs | 📋 Ready |
| **Total** | 01-17 | **18-26 hrs** | **Ready** |

---

## Learning Outcomes

After completing all 17 modules, you will understand:

✅ All 10 OWASP API vulnerabilities  
✅ Object-level authorization attacks  
✅ Injection and validation bypass  
✅ Cryptography and encryption  
✅ Transport security (TLS/HTTPS)  
✅ Supply chain security  
✅ Authentication and authorization  
✅ Real-world breach patterns  
✅ Testing and exploitation techniques  
✅ Defense strategies and patterns  
✅ Industry best practices  

---

## Next Steps

**Immediate:** Verify Modules 01-02 are working  
```bash
cd /Users/avishjain/Downloads/backend-mastery/07-security/01-owasp-api-top-10
npm install && node server.js
# Should start on http://localhost:4001
```

**Short-term:** Build Modules 03-06 (common vulnerabilities)  
**Mid-term:** Build Modules 07-12 (advanced attacks)  
**Long-term:** Build Modules 13-17 (crypto & transport)  

---

**Status:** Ready for full 17-module build  
**Quality:** Production-level implementation  
**Learning:** Comprehensive security curriculum  
**Time Estimate:** 18-26 hours for complete build
