# Theory & Concepts: User Login & Registration

## Overview
User login and registration are fundamental authentication mechanisms that form the basis of most web applications. This module covers secure implementation patterns to prevent common vulnerabilities like SQL injection, weak password storage, and brute force attacks.

## Key Concepts

### 1. Password Security
**Hashing vs Encryption:**
- **Hashing**: One-way process (bcrypt, Argon2) - passwords cannot be recovered
- **Encryption**: Two-way process - original data can be decrypted
- **Best Practice**: Always hash passwords, never encrypt them

**Why bcrypt?**
- Automatically salts passwords
- Has built-in work factor (computational cost)
- Resistant to rainbow table attacks
- Slow by design (takes ~100ms per hash validation)

### 2. Input Validation
**Attack Types:**
- **SQL Injection**: `'; DROP TABLE users; --`
- **NoSQL Injection**: `{"$ne": null}`
- **XSS**: `<script>alert('hacked')</script>`
- **Email Spoofing**: Invalid email formats

**Prevention:**
- Validate on server-side (never trust client)
- Use schema validation libraries (Joi, Zod)
- Sanitize and escape output
- Whitelist allowed characters

### 3. Error Handling Strategy
**VULNERABLE:**
```
❌ User 'alice@test.com' not found in database
❌ Login failed: password hash doesn't match
```

**SECURE:**
```
✅ Invalid credentials. Please try again.
```

**Why?** Information disclosure - attackers enumerate valid users

### 4. Rate Limiting
**Brute Force Attack:**
- Attacker tries 10,000 password combinations per second
- Without rate limiting: Account compromised in seconds

**Defense:**
- 5 login attempts per 15 minutes
- Exponential backoff: 1st failure (1s), 2nd (2s), 3rd (4s)...
- Lock account temporarily after threshold

### 5. Session Management
**Stateful (Session-based):**
- Server stores session data
- Client receives session ID in cookie
- Good for traditional monolithic apps

**Stateless (Token-based):**
- Server issues JWT token
- Client stores token (localStorage/sessionStorage)
- Good for microservices and SPAs

This module uses stateful JWT approach for foundation.

### 6. HTTPS & Cookies
**Data in Transit:**
- All credentials must use HTTPS (TLS 1.2+)
- HTTP transmits data in plaintext

**Secure Cookie Flags:**
```
- HttpOnly: Prevents JS access (blocks XSS cookie theft)
- Secure: Only sent over HTTPS
- SameSite=Strict: Prevents CSRF attacks
```

### 7. Common Vulnerabilities (OWASP Top 10)

| Vulnerability | Attack | Prevention |
|---|---|---|
| **A04: Insecure Design** | Weak password policy | Min 8 chars, mixed case, numbers |
| **A01: Authentication Flaws** | Username enumeration | Generic error messages |
| **A02: Cryptographic Failures** | Plain-text passwords | Always hash with bcrypt |
| **A07: Cross-Site Scripting** | Cookie theft | HttpOnly + SecureFlag |
| **A05: Access Control** | Direct object reference | Verify user ownership |

### 8. Registration Best Practices

**Email Verification:**
- Send verification link with time-limited token
- Prevents invalid/fake email signups
- Token expires in 24 hours

**Password Requirements:**
- Minimum 8 characters
- Must include: uppercase, lowercase, number, special char
- Check against common password lists

**Rate Limiting Registration:**
- Prevent account enumeration: 1 signup per 10 seconds per IP
- Prevent spam: 10 accounts per day per IP

### 9. Login Best Practices

**Multi-Method Support:**
- Email password
- Username password
- Magic links (passwordless)
- OAuth/Social login

**Preventing Account Takeover:**
- Track unusual login locations
- Require 2FA if needed
- Send notification emails on login
- Provide "logout all devices" option

### 10. Real-World Breach Example

**LinkedIn Breach (2012) - 6.5M passwords**
- Passwords were salted SHA-1 (weak algorithm)
- Attackers cracked 90% in days
- **What went wrong:** Not using bcrypt with adequate work factor
- **Fix:** bcrypt with cost factor 10-12 (2^10 to 2^12 iterations)

**Facebook Account Takeover (Common)**
- Weak account recovery questions
- No 2FA enabled
- **Prevention in future modules:** Add 2FA/MFA to this basic login

## Summary Checklist

- [ ] Use bcrypt for password hashing (cost ≥ 10)
- [ ] Validate all inputs server-side with Joi/express-validator
- [ ] Use generic error messages ("Invalid credentials")
- [ ] Implement rate limiting on login endpoint
- [ ] Use HTTPS + secure cookie flags
- [ ] Hash passwords before storing
- [ ] Never log or expose passwords
- [ ] Implement email verification for registration
- [ ] Provide logout functionality
- [ ] Log authentication events for audit trail
