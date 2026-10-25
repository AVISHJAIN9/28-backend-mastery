# Security Modules - Quick Reference Card

## 🚀 Start Any Module in 30 Seconds

```bash
# 1. Navigate to module
cd /Users/avishjain/Downloads/backend-mastery/07-security/0X-module-name

# 2. Install & run
npm install && node server.js

# 3. Test in browser
http://localhost:40XX
```

---

## 📋 Module Quick Access

### Phase 1: ✅ COMPLETE
- **[Module 01](#module-01)** - OWASP API Top 10 (Port 4001) ✅
- **[Module 02](#module-02)** - BOLA/IDOR (Port 4002) ✅

### Phase 2: 📋 READY
- **[Module 03](#module-03)** - Mass Assignment (Port 4003)
- **[Module 04](#module-04)** - Input Validation (Port 4004)
- **[Module 05](#module-05)** - Content Moderation (Port 4005)
- **[Module 06](#module-06)** - Data Exposure (Port 4006)

### Phase 3: 📋 READY
- **[Module 07](#module-07)** - Prototype Pollution (Port 4007)
- **[Module 08](#module-08)** - SSRF (Port 4008)
- **[Module 09](#module-09)** - ReDoS (Port 4009)
- **[Module 10](#module-10)** - Parameter Pollution (Port 4010)
- **[Module 11](#module-11)** - Dependencies (Port 4011)
- **[Module 12](#module-12)** - Secrets Vault (Port 4012)

### Phase 4: 📋 READY
- **[Module 13](#module-13)** - mTLS (Port 4013)
- **[Module 14](#module-14)** - SQL Injection (Port 4014)
- **[Module 15](#module-15)** - XSS/CSRF/SSRF (Port 4015)
- **[Module 16](#module-16)** - Encryption @Rest (Port 4016)
- **[Module 17](#module-17)** - TLS/HTTPS (Port 4017)

---

## 🎯 Find Modules by Topic

### Authentication & Authorization
- Module 01: OWASP Top 10 (includes auth sections)
- Module 02: BOLA/IDOR (broken authorization)
- Module 13: mTLS (cert-based auth)

### Injection Attacks
- Module 04: Input Validation (XSS, SQLi, command injection)
- Module 14: SQL Injection (deep dive)
- Module 09: ReDoS (regex injection)

### Data Security
- Module 06: Data Exposure (what data leaks)
- Module 16: Encryption @Rest (how to encrypt)
- Module 17: TLS/HTTPS (transport encryption)

### Web Attacks
- Module 15: XSS/CSRF/SSRF (three critical web vulns)
- Module 08: SSRF (server-side request forgery)

### Advanced Exploitation
- Module 07: Prototype Pollution (JS-specific)
- Module 10: Parameter Pollution (HTTP tricks)
- Module 03: Mass Assignment (privilege escalation)

### Infrastructure Security
- Module 11: Dependencies (supply chain)
- Module 12: Secrets Vault (credential management)
- Module 13: mTLS (mutual TLS)

### Content & Moderation
- Module 05: Content Moderation (offensive content detection)

---

## 📊 CVSS Score Guide

| CVSS | Severity | Examples |
|------|----------|----------|
| 9.8 | CRITICAL | SQL Injection (Module 14) |
| 9.3 | CRITICAL | Input Validation (Module 04), Secrets Vault (Module 12) |
| 8.8 | HIGH | Dependencies (Module 11) |
| 8.7 | HIGH | XSS/CSRF/SSRF (Module 15) |
| 8.6 | HIGH | SSRF (Module 08) |
| 7.8 | HIGH | Mass Assignment (Module 03) |
| 7.5 | HIGH | Data Exposure (Module 06), ReDoS (Module 09) |
| 7.3 | HIGH | TLS/HTTPS (Module 17) |
| 7.1 | HIGH | Encryption @Rest (Module 16) |
| 6.5 | MEDIUM | Parameter Pollution (Module 10) |
| 6.2 | MEDIUM | mTLS (Module 13) |
| 6.1 | MEDIUM | Prototype Pollution (Module 07) |
| 5.3 | MEDIUM | Content Moderation (Module 05) |

---

## Module Details

### Module 01
**OWASP API Top 10** | Port 4001 | ✅ COMPLETE

**Covers:**
- A01: Broken Object Level Authorization
- A02: Broken Authentication
- A03: Broken Object Property Level Authorization
- A04: Unrestricted Resource Consumption
- A05: Broken Function Level Authorization
- A06: Unrestricted Access to Sensitive Business Flows
- A07: Server-Side Request Forgery (SSRF)
- A08: Lack of Protection from Automated Threats
- A09: Inadequate Logging & Monitoring
- A10: Unsafe Consumption of APIs

**Key Endpoints:**
- `/api/vulnerable/*` (exploitable endpoints)
- `/api/secure/*` (hardened versions)
- `/api/test-auth` (JWT token testing)

**Real-World:** Equifax breach, Facebook data leak, Twitch API abuse

---

### Module 02
**BOLA/IDOR Deep Dive** | Port 4002 | ✅ COMPLETE

**Attack Vectors:**
1. Numeric ID enumeration
2. Race conditions
3. Multi-tenant isolation bypass
4. Timing analysis
5. Cache poisoning

**Key Endpoints:**
- `/api/user/:id` (vulnerable user access)
- `/api/invoice/:id` (unauthorized invoice view)
- `/api/race-condition` (timing test)
- `/api/tenant-isolation` (isolation break)

**Real-World:** Instagram account takeover, Uber driver data, Airbnb booking access

---

### Module 03
**Mass Assignment** | Port 4003 | CVSS 7.8

**Vulnerability:** User can modify unauthorized fields (especially `role`, `is_admin`)

**Attack:** `POST /users { name: "Hacker", is_admin: true }`

**Prevention:** Whitelist fields, schema validation

---

### Module 04
**Input Validation** | Port 4004 | CVSS 9.3 (CRITICAL)

**Attacks:**
- XSS: `<script>alert('xss')</script>`
- SQLi: `' OR '1'='1`
- Command Injection: `; rm -rf /`
- Path Traversal: `../../../etc/passwd`

**Defense:** Length limits, format validation, character whitelist, HTML encoding

---

### Module 05
**Content Moderation** | Port 5005 | CVSS 5.3

**Detection Methods:**
- Rule-based filtering
- ML classification (TensorFlow.js)
- Hybrid approach

**Tools:** Google Perspective API, OpenAI, AWS Rekognition

---

### Module 06
**Data Exposure** | Port 4006 | CVSS 7.5

**Sensitive Categories:**
- Financial: CC numbers, bank accounts
- Personal: SSN, phone numbers
- Auth: Passwords, API keys
- Medical: Health records
- Internal: Admin notes, system info

**Prevention:** Field filtering, masking (***-**-6789), access control

---

### Module 07
**Prototype Pollution** | Port 4007 | CVSS 6.1

**Attack:** `POST /config { __proto__: { isAdmin: true } }`

**Impact:** Modifying object prototypes in JavaScript

**Prevention:** Input validation, Object.freeze()

---

### Module 08
**SSRF** | Port 4008 | CVSS 8.6

**Attack:** Trick server into making internal requests

**Example:** `POST /proxy { url: "http://localhost:6379" }` → Redis access

**Prevention:** Whitelist domains, block local IPs

---

### Module 09
**ReDoS** | Port 4009 | CVSS 7.5

**Attack:** Evil regex causes exponential backtracking

**Example:** `/^(a+)+b$/` with input `aaaaaaaaaaaX` → Hangs

**Prevention:** Timeout limits, safe regex patterns

---

### Module 10
**Parameter Pollution** | Port 4010 | CVSS 6.5

**Attack:** Duplicate params confuse parser

**Example:** `?id=1&id=2` → Different parsing between server/WAF

**Prevention:** Consistent param handling

---

### Module 11
**Dependencies** | Port 4011 | CVSS 8.8

**Risks:** Malicious npm packages, outdated vulnerabilities

**Solutions:** `npm audit`, lockfiles, private registries

---

### Module 12
**Secrets Vault** | Port 4012 | CVSS 9.3 (CRITICAL)

**Secrets Covered:**
- API keys
- Database passwords
- Private encryption keys
- OAuth tokens
- Firebase credentials

**Storage:** HashiCorp Vault, AWS Secrets Manager, Azure Key Vault

---

### Module 13
**mTLS** | Port 4013 | CVSS 6.2

**Protection:** Both client and server authenticate with certificates

**Use Case:** Microservice-to-microservice communication

---

### Module 14
**SQL Injection** | Port 4014 | CVSS 9.8 (HIGHEST)

**Attack:** `SELECT * FROM users WHERE id='1' OR '1'='1'`

**Prevention:** Parameterized queries, prepared statements

---

### Module 15
**XSS/CSRF/SSRF Trifecta** | Port 4015 | CVSS 8.7

**XSS:** Inject malicious scripts on victim's browser
**CSRF:** Trick browser into making unwanted requests
**SSRF:** Force server to access internal resources

---

### Module 16
**Encryption @Rest** | Port 4016 | CVSS 7.1

**Encryption Methods:**
- AES-256-GCM
- RSA for key exchange
- HMAC for integrity

**Implementation:** Node.js crypto module

---

### Module 17
**TLS/HTTPS Internals** | Port 4017 | CVSS 7.3

**Handshake:** Certificate exchange, cipher negotiation

**Key Exchange:** ECDHE for perfect forward secrecy

**Certificate:** Self-signed vs CA-signed

---

## ⚡ Common Commands

### Start All Modules (Sequential)
```bash
for i in {1..17}; do
  PORT=$(printf "%d" $((4000 + i)))
  MODULE=$(ls -d 0$i-* | head -1)
  echo "Starting $MODULE on port $PORT..."
  cd 0$i-*/
  npm install &
  node server.js &
  sleep 2
done
```

### Test All Endpoints
```bash
for port in {4001..4017}; do
  echo "Testing port $port..."
  curl -s http://localhost:$port/api/info | jq .
done
```

### Check All Running
```bash
lsof -i :4001 -i :4002 -i :4003 -i :4004 -i :4005 -i :4006 -i :4007 \
     -i :4008 -i :4009 -i :4010 -i :4011 -i :4012 -i :4013 -i :4014 \
     -i :4015 -i :4016 -i :4017
```

### Kill All Modules
```bash
killall node
```

---

## 🧪 Testing Checklist

For each module, verify:
- [ ] Vulnerable endpoints work
- [ ] Secure endpoints work
- [ ] React UI loads
- [ ] Authentication required (if applicable)
- [ ] Error messages don't leak info
- [ ] Rate limiting works
- [ ] Logging captures attacks

---

## 📚 Documentation Priority

1. **Start Here:** [README.md](README.md) - Program overview
2. **Build Guide:** [MASTER-IMPLEMENTATION-GUIDE.md](MASTER-IMPLEMENTATION-GUIDE.md) - Detailed specs
3. **Status:** [COMPLETION-STATUS-REPORT.md](COMPLETION-STATUS-REPORT.md) - Progress tracking
4. **Roadmap:** [SECURITY-ROADMAP.md](SECURITY-ROADMAP.md) - 17-module overview
5. **Per-Module:** Each module's `theory.md` for deep concepts

---

## 🎯 Study Path Recommendations

### Fast Track (8-10 hours)
- Modules 01, 02, 04, 14, 17 (core concepts)

### Standard Track (24-30 hours)
- All modules 01-17 sequentially

### Deep Dive Track (40+ hours)
- All modules + extended labs, CTF challenges

---

## 💡 Pro Tips

1. **Run one module at a time** until you master it
2. **Read theory.md first** before looking at code
3. **Try to exploit then defend** for each module
4. **Use curl/Postman** to test endpoints
5. **Check logs** to understand attack flow
6. **Modify code** to experiment with variations
7. **Create test cases** for vulnerable patterns

---

## 🆘 Troubleshooting

| Issue | Solution |
|-------|----------|
| Port already in use | Kill process: `lsof -i :PORT \| grep LISTEN \| awk '{print $2}' \| xargs kill -9` |
| Module won't start | Check: `npm install`, Node.js version, required env vars |
| React UI not loading | Clear cache, check console for errors |
| API returns 401 | Verify JWT token in Authorization header |
| CORS errors | Check Helmet & CORS middleware config |
| 500 errors | Check server logs for stack trace |

---

## 🏅 Achievement Badges

- [x] Phase 1: Foundation (11%)
- [ ] Phase 2: Common (35%)
- [ ] Phase 3: Advanced (65%)
- [ ] Phase 4: Complete (100%)
- [ ] All modules tested
- [ ] Integration tests passing
- [ ] Security audit complete

---

**Last Updated:** March 29, 2026  
**Next Phase:** Module 03 - Mass Assignment Protection  
**Estimated Time to Phase 2:** 4-6 hours

---

*For detailed specifications, see [MASTER-IMPLEMENTATION-GUIDE.md](MASTER-IMPLEMENTATION-GUIDE.md)*
