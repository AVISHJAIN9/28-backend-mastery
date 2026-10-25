# OWASP API Security Top 10

The Open Web Application Security Project (OWASP) identifies the top 10 security risks for APIs.

## API1: Broken Object Level Authorization (BOLA)

**What it is:**
- Users can access objects they shouldn't
- Example: accessing /api/users/2 reveals user 2's data even if you're user 1

**Risk:** High - Exposes sensitive user/object data

**Prevention:**
```javascript
// ✗ Vulnerable
app.get('/users/:id', (req, res) => {
  const user = User.findById(req.params.id);
  res.json(user); // No authorization check!
});

// ✓ Secure
app.get('/users/:id', verifyOwner, (req, res) => {
  const user = User.findById(req.params.id);
  if (user.id !== req.user.id) return res.status(403).send('Forbidden');
  res.json(user);
});
```

---

## API2: Broken Authentication

**What it is:**
- Weak authentication implementation
- No API key validation
- No rate limiting on login

**Risk:** High - Unauthorized access

**Prevention:**
- Require strong password policies
- Use JWT or OAuth2 properly
- Rate limit authentication endpoints
- Implement MFA
- Validate sessions

---

## API3: Excessive Data Exposure

**What it is:**
- API returns more data than needed
- Exposing internal fields in responses
- No field filtering

**Risk:** Medium - Information disclosure

**Prevention:**
```javascript
// ✗ Exposes too much
res.json(user); // includes password_hash, ssn, etc

// ✓ Only necessary fields
res.json({
  id: user.id,
  name: user.name,
  email: user.email
});
```

---

## API4: Lack of Resources & Rate Limiting

**What it is:**
- No rate limiting
- DDoS attacks possible
- Resource exhaustion

**Risk:** High - Availability issues

**Prevention:**
```javascript
const rateLimit = require('express-rate-limit');
const limiter = rateLimit({
  windowMs: 15 * 60 * 1000, // 15 min
  max: 100 // 100 requests per window
});

app.use('/api/', limiter);
```

---

## API5: Broken Function Level Authorization

**What it is:**
- Users can access admin functions
- No role-based access control
- Example: Regular user can delete other users

**Risk:** High - Privilege escalation

**Prevention:**
```javascript
const isAdmin = (req, res, next) => {
  if (req.user.role !== 'admin') {
    return res.status(403).json({ error: 'Admin only' });
  }
  next();
};

app.delete('/users/:id', isAdmin, (req, res) => {
  // Delete user
});
```

---

## API6: Mass Assignment

**What it is:**
- Users can modify fields they shouldn't
- Extra parameters accepted and processed

**Risk:** Medium - Data manipulation

**Prevention:**
```javascript
// ✗ Vulnerable - allows setting isAdmin
const user = new User(req.body);

// ✓ Safe - explicit fields only
const user = new User({
  name: req.body.name,
  email: req.body.email,
  role: 'user' // hardcoded, not from input
});
```

---

## API7: Security Misconfiguration

**What it is:**
- Debug mode on in production
- Unneeded HTTP methods enabled
- Default credentials not changed
- Missing security headers

**Risk:** Medium - Information disclosure

**Prevention:**
```javascript
// Set security headers
app.use(helmet());

// Disable debug in production
app.set('env', 'production');

// Disable trace
app.trace = undefined;
```

---

## API8: Injection

**What it is:**
- SQL injection, NoSQL injection
- Command injection
- LDAP injection

**Risk:** Critical - Complete compromise

**Prevention:**
```javascript
// ✗ Vulnerable
User.find({ name: req.body.name });

// ✓ Safe - parameterized
User.findOne({ name: req.body.name });
```

---

## API9: Improper Assets Management

**What it is:**
- Undocumented API endpoints
- Old API versions active
- Unmonitored endpoints

**Risk:** Medium - Unauthorized access

**Prevention:**
- Maintain API documentation
- Version your APIs (/v1/, /v2/)
- Retire old versions
- Monitor all endpoints

---

## API10: Insufficient Logging & Monitoring

**What it is:**
- No security event logging
- No alerting system
- Can't detect attacks

**Risk:** High - Can't respond to breaches

**Prevention:**
```javascript
const winston = require('winston');
logger.warn('Failed login', { user: email, ip });
logger.error('SQL injection attempt', { query });
```

---

## OWASP Top 10 Summary

| # | Risk | Criticality | Detection |
|---|------|-------------|-----------|
| 1 | BOLA | High | Test authorization |
| 2 | Broken Auth | High | Password policies |
| 3 | Excessive Data | Medium | Field filtering |
| 4 | No Rate Limits | High | Simulate abuse |
| 5 | Function Auth | High | Role testing |
| 6 | Mass Assignment | Medium | Input validation |
| 7 | Misc Config | Medium | Config review |
| 8 | Injection | Critical | Input testing |
| 9 | Assets | Medium | API audit |
| 10 | Logging | High | Monitoring check |

---

## Testing for OWASP Issues

1. **BOLA**: Try accessing other users' data
2. **Authentication**: Try invalid credentials, expired tokens
3. **Data Exposure**: Check response JSON for sensitive fields
4. **Rate Limits**: Send many requests quickly
5. **Function Auth**: Use regular account for admin operations
6. **Mass Assignment**: Try setting admin=true in body
7. **Config**: Check for debug headers, stack traces
8. **Injection**: Try SQL syntax in inputs
9. **Assets**: Check for old endpoints
10. **Logging**: Check if attacks are logged
