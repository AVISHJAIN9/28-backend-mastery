# Module 01-01: User Login & Register - Theory & Deep Dive

## Table of Contents

1. [Evolution of Authentication](#evolution)
2. [Password Storage](#password-storage)
3. [Authentication Flows](#flows)
4. [Security Best Practices](#best-practices)
5. [Common Vulnerabilities](#vulnerabilities)
6. [Real-World Implementations](#real-world)

---

## Evolution of Authentication {#evolution}

### Phase 1: Early Web (1990s) - Plaintext Passwords

**The Problem:**
```
User Registration:
  Email: alice@test.com
  Password: mypassword123
  
Database (plaintext):
  email         | password
  alice@test.com| mypassword123  ← EXPOSED!
```

**Risks:**
- Database breach = all passwords compromised
- Developers can see passwords
- No tamper detection
- Regulatory violations (GDPR, PCI-DSS)

### Phase 2: Simple Hashing (2000s) - MD5/SHA1

**Improvement:**
```
Password Hash = MD5('mypassword123') = 'e6f7c4e8f5a1b2c3...'

User inputs: mypassword123
  → MD5('mypassword123') → e6f7c4e8f5a1b2c3
  → Compare with stored hash ✓ Match!
```

**Problem - Rainbow Tables:**
```
Precomputed hashes:
  'password123'        → 482c811da5d5b4bc6d497ffa98491e38
  'mypassword123'      → e6f7c4e8f5a1b2c3d4e5f6a7b8c9d0e1
  'admin123'           → 0192023a7bbd73250516f069df18b500
  
Attacker finds match → Password recovered!
```

### Phase 3: Salted Hashing (2010s) - bcrypt/scrypt

**Solution - Add Random Salt:**
```
Salt = generate_random(16 bytes) = 'k9x2m4p7q1n8v5r3'

User 1 password 'password123':
  Hash = bcrypt('password123' + 'k9x2m4p7q1n8v5r3') = 'hash1'

User 2 password 'password123' (same password!):
  Hash = bcrypt('password123' + 'j2w8l3h5g9d1b4c6') = 'hash2'
  
Different hashes for same password! Rainbow tables useless.
```

### Phase 4: Key Stretching (2020+) - Argon2/PBKDF2

**Modern Approach:**
```
bcrypt/Argon2 = Hash + Salt + Key Stretching

Key Stretching = Run hash algorithm many times
  Iteration 1: hash1 = bcrypt(password + salt)
  Iteration 2: hash2 = bcrypt(hash1 + salt)
  Iteration 3: hash3 = bcrypt(hash2 + salt)
  ...x10,000 times
  
Result: hash3 (after 10,000 stretches)

Purpose: Makes cracking exponentially harder
  1 password test: 10,000 hashes computed
  Attacker tries: 100,000 passwords = 1 billion hashes
```

---

## Password Storage {#password-storage}

### Never Store Plaintext

```javascript
// ✗ WRONG
const register = (req, res) => {
  const user = {
    email: req.body.email,
    password: req.body.password  // ← EXPOSED!
  };
  db.save(user);
};

// ✓ CORRECT
const register = async (req, res) => {
  const hashedPassword = await bcrypt.hash(req.body.password, 10);
  const user = {
    email: req.body.email,
    password: hashedPassword  // ← Hashed
  };
  db.save(user);
};
```

### bcrypt Explanation

```javascript
const bcrypt = require('bcryptjs');

// bcrypt hash: $2a$10$randomSaltHashedPassword
//             │   │   │ └─ Hashed content
//             │   │   └─── Cost factor (10 = 2^10 iterations)
//             │   └─ Salt version
//             └─ Algorithm identifier (bcrypt = $2a)

const password = 'mySecurePassword123';
const salt = await bcrypt.genSalt(10);  // Generate random salt
const hash = await bcrypt.hash(password, salt);
// hash = $2a$10$nOUIs5kJ7naTuTVk3/tfm.SIUgzLQRtH5EqIy0iHQVLVXHB2qButa

// Verification
const isValid = await bcrypt.compare(password, hash);  // true
const isInvalid = await bcrypt.compare('wrong', hash);  // false
```

**Cost Factor (Rounds):**
```javascript
// Cost = 10 (2^10 = 1024 rounds)
// Each round ≈ 10ms on modern hardware
// Total time ≈ 10ms

// Your password: ~25ms to verify
// Attacker testing 1000 passwords: ~25 seconds
// vs plaintext: <1ms per password

// As hardware gets faster, increase cost:
// 2024: cost = 12 (4x harder than 2020)
```

### Password Requirements - Best Practices

```javascript
// ✓ Good password
{
  minLength: 12,           // Prevents brute force
  requireUppercase: true,  // Increases entropy
  requireLowercase: true,
  requireNumbers: true,    // Mix of character types
  requireSymbols: true,    // !@#$%^&*
  noCommonPatterns: true   // Not 'password', '123456'
}

// ✗ Bad password
{
  minLength: 6,            // Too short (64 possibilities per char)
  noRequirements: true     // Any character allowed
}
```

---

## Authentication Flows {#flows}

### 1. Registration Flow

```
┌─────────────┐
│   Client    │
└──────┬──────┘
       │ POST /register {email, password, name}
       v
┌─────────────────────────────┐
│  Validate Input             │
│  - email format valid?      │
│  - password strong enough?  │
│  - name not empty?          │
└────────┬────────────────────┘
         │
    ┌────v────┐
    │ Valid?  │
    └────┬────┘
    ┌────v────┐
    │   No    │────→ 400 Bad Request
    └─────────┘
    ┌────v────┐
    │   Yes   │
    └────┬────┘
         │
    ┌────v─────────────────────────┐
    │ User Already Exists?         │
    │ (Check email in database)    │
    └────┬─────────────────────────┘
         │
    ┌────v────┐
    │   Yes   │────→ 409 Conflict (User exists)
    └─────────┘
    ┌────v────┐
    │    No   │
    └────┬────┘
         │
    ┌────v─────────────────────────┐
    │ Hash Password                │
    │ bcrypt.hash(password, salt)  │
    └────┬─────────────────────────┘
         │
    ┌────v─────────────────────────┐
    │ Save to Database             │
    │ {email, hashedPassword, id}  │
    └────┬─────────────────────────┘
         │
    ┌────v──────────────────────────┐
    │ Return 201 Created            │
    │ {id, email, name} (no pwd!)   │
    └──────────────────────────────┘
```

### 2. Login Flow

```
┌─────────────┐
│   Client    │
└──────┬──────┘
       │ POST /login {email, password}
       v
┌──────────────────────────────┐
│ Validate Input               │
│ - email not empty?           │
│ - password not empty?        │
└────┬─────────────────────────┘
     │
 ┌───v───┐
 │Valid? │
 └───┬───┘
 ┌───v────┐
 │  No    │────→ 400 Bad Request
 └────────┘
 ┌───v────┐
 │  Yes   │
 └───┬────┘
     │
 ┌───v──────────────────────────┐
 │ Find User by Email           │
 └───┬──────────────────────────┘
     │
 ┌───v────┐
 │ Found? │
 └───┬────┘
 ┌───v────┐
 │  No    │────→ 401 Unauthorized ("Invalid credentials")
 └────────┘
 ┌───v────┐
 │  Yes   │
 └───┬────┘
     │
 ┌───v──────────────────────────────────────┐
 │ Compare Passwords                        │
 │ bcrypt.compare(input, storedHash)        │
 └───┬──────────────────────────────────────┘
     │
 ┌───v───────┐
 │ Match?    │
 └───┬───────┘
 ┌───v────┐
 │  No    │────→ 401 Unauthorized ("Invalid credentials")
 └────────┘
 ┌───v────┐
 │  Yes   │
 └───┬────┘
     │
 ┌───v────────────────────────────────┐
 │ Return 200 Success                │
 │ Send session token or JWT         │
 │ {id, email, name, token}          │
 └───────────────────────────────────┘
```

---

## Security Best Practices {#best-practices}

### 1. Never Log Passwords

```javascript
// ✗ WRONG
logger.info('Login attempt', { email, password });

// ✓ CORRECT
logger.info('Login attempt', { email, ip: req.ip });

// Not in logs either:
logger.debug(`User ${email} password is ${password}`);
```

### 2. Time-Safe Comparisons

```javascript
// ✗ WRONG - Timing attack vulnerable
if (password === storedPassword) {
  // Takes less time if first character matches
  // Attacker measures response time to guess password
  return 'Login success';
}

// ✓ CORRECT - Bcrypt handles timing-safe comparison
const isValid = await bcrypt.compare(password, hash);
// Always takes same time regardless of match
```

### 3. Consistent Error Messages

```javascript
// ✗ WRONG - Information disclosure
if (!user) {
  return res.status(400).json({ error: 'Email not registered' });
}
if (password !== stored) {
  return res.status(400).json({ error: 'Wrong password' });
}

// Attacker learns: email exists = user can enumerate accounts

// ✓ CORRECT
if (!user || !(await bcrypt.compare(password, user.password))) {
  return res.status(401).json({ error: 'Invalid credentials' });
}

// Both cases return same message = attacker learns nothing
```

### 4. Rate Limiting

```javascript
// Without rate limiting:
Attacker tries: 1000 passwords in 10 seconds ← Too fast!

// With rate limiting (e.g., 5 attempts per 15 minutes):
Attacker tries: 1 password per attempt
               Need: 1000 * 15 minutes = 250 hours
```

### 5. HTTPS Only

```javascript
// ✗ HTTP (plaintext)
POST http://example.com/login  ← Password visible in transit!
{email: alice@test.com, password: mySecurePassword123}

// ✓ HTTPS (encrypted)
POST https://example.com/login  ← Encrypted with TLS
{email: alice@test.com, password: mySecurePassword123}
                                    (encrypted)
```

---

## Common Vulnerabilities {#vulnerabilities}

### 1. Credential Stuffing

**Attack:**
```
Attacker has email/password from previous breach
Tries same credentials on your platform
Many users reuse passwords across sites
Success rate: 1-3% of users
```

**Defense:**
```
- Require strong, unique passwords
- Implement account lockout
- Monitor for credential stuffing patterns
- Alert user of suspicious login
```

### 2. Brute Force Attack

**Attack:**
```
Dictionary attack: Try common passwords
  password, 123456, qwerty, abc123...
  
Rainbow table: Lookup precomputed hashes
  Hash found in database?
  → Yes = Password recovered
```

**Defense:**
```
- Use bcrypt with high cost factor (12+)
- Rate limit login attempts
- Implement CAPTCHA after 3 failures
- Log all attempts
```

### 3. Keylogger/Phishing

**Attack:**
```
Malware captures keystrokes
User enters password on fake website
Attacker intercepts credentials
```

**Defense:**
```
- Recommend password manager
- Enable 2FA
- Advise users on phishing
- Monitor for suspicious access patterns
```

### 4. Session Fixation

**Attack:**
```
Attacker tricks user to login with known session ID
Attacker uses same session ID to access account
```

**Defense:**
```
- Generate new session after login
- Invalidate old session
- Use secure cookies (HttpOnly, Secure flags)
```

---

## Real-World Implementations {#real-world}

### Google Login

```
User clicks "Sign in with Google"
  ↓
Google handles authentication (2FA, password)
  ↓
Your app receives authorized token
  ↓
You trust Google, not user's password
```

**Benefits:**
- User doesn't share password with you
- Password stored only at Google
- Google updates security → you benefit

### AWS IAM

```
Root Account: Email + Password
              Recommended: Enable 2FA
              
IAM User:     Access Key ID + Secret Access Key
              Similar to email/password
              Can be rotated periodically
              
MFA Device:   Time-based token (TOTP)
              Adds 2nd factor
```

### Banking Applications

```
Login: Username + Password
       ↓ Correct credentials
Response: Send SMS to registered phone
User enters: SMS code
       ↓ Code correct
Session: Access granted with time limit
         Auto-logout after inactivity
```

---

## Summary

- **Never store plaintext passwords** - Use bcrypt/Argon2
- **Use salts and key stretching** - Makes cracking hard
- **Rate limit authentication** - Prevents brute force
- **Use consistent error messages** - Don't reveal user existence
- **HTTPS only** - Encrypt in transit
- **Monitor for attacks** - Log suspicious patterns
- **Consider 2FA** - For sensitive accounts

