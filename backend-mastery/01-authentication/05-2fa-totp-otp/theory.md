# 2FA / TOTP / OTP - Deep Dive Theory

## Overview

Two-Factor Authentication (2FA) adds a second verification layer beyond passwords. This module covers TOTP (Time-based One-Time Password) and OTP (One-Time Password) - the most common 2FA methods used by Google, GitHub, AWS, and banks.

**Key Insight:** Even if attacker steals password, they can't login without the second factor (your phone).

---

## The Security Problem (Why 2FA?)

### Single Factor (Password Only) Vulnerabilities

```
1. Weak passwords: "password123" easily guessed
2. Password reuse: Same password on 10 sites, one breach = all compromised
3. Phishing: User tricks into entering password on fake site
4. Brute force: Attacker tries millions of passwords
5. Data breaches: Server hacked, password hashes stolen and cracked
6. Keylogger malware: Captures passwords when typed
```

**Real Breach Example (2013):**
- Yahoo: 3 billion accounts compromised
- Attackers got password hashes
- With modern GPUs: cracked millions of passwords
- Users with password-only accounts: FULLY COMPROMISED

### 2FA Solution

```
Even if attacker has password, they need SECOND factor:
  - TOTP code (6 digits, changes every 30 seconds)
  - SMS code (received to phone)
  - Hardware key (physical device)
  - Biometric (fingerprint/face)
  - Backup code (stored securely)

Result: Attack harder, much higher cost for attacker
```

---

## Authentication Factors Explained

### Something You Know (Knowledge Factor)

```
Password, PIN, security question
Problem: Can be guessed, phished, leaked
Example: "my_password_123"
```

### Something You Have (Possession Factor)

```
Your phone, security key, smart card
Problem: Can be lost or stolen
Example: Google Authenticator app with TOTP codes
```

### Something You Are (Inherence Factor)

```
Biometric: fingerprint, face, iris
Problem: Can't be changed if compromised
Example: Face ID, fingerprint scanner
```

### Where You Are (Location Factor)

```
Geolocation, IP address, device
Problem: Can be spoofed or VPN'd
Example: "Login detected in new location - verify"
```

---

## 2FA Methods Comparison

| Method | Security | User Experience | Recovery | Cost |
|--------|----------|-----------------|----------|---------|
| **SMS OTP** | ⭐⭐⭐ (medium) | Easy (text arrives) | Phone replacement | Free |
| **TOTP (Authenticator App)** | ⭐⭐⭐⭐⭐ (very strong) | Good (app on phone) | Backup codes essential | Free |
| **Backup Codes** | ⭐⭐⭐⭐⭐ (very strong) | Hard (must save) | Only option if device lost | Free |
| **Hardware Key** | ⭐⭐⭐⭐⭐ (very strong) | Excellent (tap device) | Need backup key | $50-100 |
| **Biometric** | ⭐⭐⭐⭐⭐ (very strong) | Excellent (natural) | Can't recover | Built-in |

---

## TOTP Deep Dive (Time-based One-Time Password)

### How TOTP Works

```
Step 1: Registration
  Server generates SECRET (32 random bytes)
  Server encodes as QR code (otpauth://...)
  User scans QR code with Authenticator app
  Authenticator stores secret securely
  Server stores secret for verification

Step 2: Login (User enters password)
  Server: "Password correct, now enter TOTP code"
  User opens Authenticator app
  App generates 6-digit code using:
    - Secret (stored on device)
    - Current time (device clock)
    - HMAC-SHA1 algorithm
  Code valid for 30 seconds, then changes

Step 3: Server Verification
  User submits 6-digit code
  Server uses same algorithm:
    - Secret (stored in DB)
    - Server's current time
    - Generate expected code
  Compare user code == expected code
  If match: ✓ User authenticated
```

### The Math Behind TOTP

```javascript
// TOTP calculation (simplified)
totp = HMAC-SHA1(
  secret="NzgyNzg3ODk4MA==",
  message=Math.floor(Date.now() / 30000)  // Current 30-second step
)
code = totp % 1000000  // Last 6 digits

// Result: 123456 (changes every 30 seconds)
// Each unique time period = unique code
// Without secret, impossible to predict next code
```

### TOTP Advantages

1. **No internet required** - Works offline (unlike SMS)
2. **Very secure** - Secret never leaves device
3. **Time-synced** - No delivery delays (unlike SMS)
4. **Portable** - Works across apps (Google Authenticator, Authy, etc.)
5. **No infrastructure** - No SMS provider needed

### TOTP Disadvantages

1. **Clock skew** - Device clock must be accurate (±1 minute acceptable)
2. **Lost device = locked out** - Without backup codes, can't access account
3. **User education** - Users must save QR code or secret

---

## OTP Methods (One-Time Password)

### SMS OTP

```
Login Flow:
  User enters password
  Server sends 6-digit code to phone via SMS
  User receives SMS with code
  User enters code
  Server verifies match
  User authenticated

Pros:
  ✓ No setup required (everyone has phone)
  ✓ Easy to understand
  ✓ Server-generated (good for first-time users)

Cons:
  ✗ SMS interceptable (SIM jacking, SS7 attacks)
  ✗ Requires internet connection (SMS delivery)
  ✗ SMS delays (few seconds to minutes)
  ✗ Phone number portability risks
  ✗ NIST discourages (not approved for government)
```

### Email OTP

```
Login Flow:
  User enters password
  Server sends 6-digit code to email
  User checks email
  User enters code
  Server verifies
  User authenticated

Pros:
  ✓ Non-invasive (no text notifications)
  ✓ Works on any device
  ✓ No SMS infrastructure needed

Cons:
  ✗ Slower delivery (email delay 5-10 seconds)
  ✗ Can be intercepted (if email compromised)
  ✗ Requires device with email access
```

### Backup Codes (Recovery)

```
What are backup codes?
  - 8-10 character codes (e.g., "A1B2C3D4")
  - Generated during 2FA setup
  - Hashed and stored on server
  - One-time use only
  - Should be saved offline

Usage:
  If you lose your phone:
    - Can't generate TOTP codes anymore
    - Use one backup code to regain access
    - After login: set up new authenticator

Example:
  "TOTP code? I don't have my phone."
    User submits backup code instead
    Server marks code as used
    User logs in
    User sets up new authenticator
```

---

## 2FA Login Flow (Complete)

```
┌─────────────┐
│ User enters │
│ email +     │
│ password    │
└──────┬──────┘
       ↓
┌──────────────────────────┐
│ Server: Password match?  │
│ bcrypt.compare()         │
└──────┬───────────────────┘
       │
    ✗ No  → 401 Unauthorized
       │
    ✓ Yes ↓
┌──────────────────────────┐
│ Check: MFA enabled?      │
│ user.mfaEnabled = true?  │
└──────┬───────────────────┘
       │
    ✗ No  → Return JWT token (login complete)
       │
    ✓ Yes ↓
┌──────────────────────────────┐
│ Create temp session          │
│ sessionToken = random UUID   │
│ expires = 5 minutes          │
│ Store in server memory       │
└──────┬───────────────────────┘
       ↓
┌──────────────────────────┐
│ Return to user:          │
│ sessionToken             │
│ "Enter TOTP code"        │
│ "Or use backup code"     │
└──────┬───────────────────┘
       ↓
┌──────────────────────────┐
│ User enters 6-digit code │
│ from Authenticator app   │
└──────┬───────────────────┘
       ↓
┌──────────────────────────────┐
│ Server: Verify TOTP          │
│ speakeasy.totp.verify()      │
│ With ±1 time step tolerance  │
└──────┬───────────────────────┘
       │
    ✗ Invalid → 401 Unauthorized
       │              (Rate limit: max 5 attempts)
       │
    ✓ Valid   ↓
┌──────────────────────────┐
│ Return JWT access token  │
│ user fully authenticated │
│ Delete sessionToken      │
└──────────────────────────┘
```

### TOTP Verification with Time Window

```javascript
const verified = speakeasy.totp.verify({
  secret: user.mfaSecret,
  encoding: 'base32',
  token: userInputCode,
  window: 2  // Allow ±1 time step (30 seconds each)
});

// Why window=2?
// User enters code at 29.9 second mark
// Code changes at 30.0 second mark
// Server checks at 30.1 second mark
// Without window: code already expired
// With window: accounts for clock skew
```

### Backup Code Storage

```javascript
// During setup:
const backupCodes = generateBackupCodes(10);
user.backupCodes = backupCodes.map(code => ({
  code: bcrypt.hashSync(code, 10),  // Hash stored
  used: false
}));

// User sees un-hashed codes: "AAAA-BBBB", "CCCC-DDDD", etc
// These are stored offline by user

// During use:
const userCode = req.body.code;  // "AAAA-BBBB"
const match = user.backupCodes.find(bc => 
  !bc.used && bcrypt.compareSync(userCode, bc.code)
);
if (match) {
  match.used = true;  // Mark as one-time use
  // Grant access
}
```

---

## Security Best Practices

### 1. Time Step Tolerance

```javascript
// ✓ Good: Allow ±1 time step
window: 2  // Accounts for clock skew

// ✗ Bad: No tolerance
window: 0  // Too strict, fails on slow networks

// ✗ Bad: Too much tolerance
window: 10  // Allows codes from 5 minutes ago
```

### 2. Code Reuse Prevention

```javascript
// ✓ Good: Track last code used
if (code === user.lastTotp) {
  return 401;  // Reject reused code
}
user.lastTotp = code;

// ✗ Bad: No reuse tracking
// Attacker can intercept + resend code within 30 seconds
```

### 3. Backup Code Best Practices

```javascript
// ✓ Good: Limited codes (10)
// ✓ Good: One-time use only
// ✓ Good: Hashed in database
// ✓ Good: User saves offline
// ✗ Bad: Unlimited codes (attacker brute forces)
// ✗ Bad: Reusable codes (compromised code used repeatedly)
// ✗ Bad: Plaintext in database (breach = loss of 2FA)
// ✗ Bad: Only in email (lost email = lost recovery)
```

### 4. Session Management

```javascript
// ✓ Good: Session expires after 5 minutes
expires: Date.now() + 5 * 60 * 1000

// ✓ Good: Session deleted after verification
sessions.delete(sessionToken);

// ✗ Bad: No expiration (ancient codes still work)
// ✗ Bad: No cleanup (memory leak)
```

### 5. Rate Limiting

```javascript
// ✓ Good: Limit TOTP attempts
const attempts = loginAttempts.get(sessionToken) || 0;
if (attempts >= 5) {
  return 429;  // Too many attempts
}

// ✓ Good: Exponential backoff
// After 3 attempts: wait 30 seconds
// After 5 attempts: wait 5 minutes
```

---

## Real-World Examples

### Google Accounts
- TOTP preferred (Authenticator app, Google Authenticator)
- SMS as backup
- Backup codes generated
- Security keys supported

### AWS Management Console
- Highly recommended 2FA
- MFA device required for root access
- TOTP, SMS, hardware key options
- 6-month grace period before required

### GitHub
- TOTP required for sensitive operations
- SMS optional
- Backup codes generated
- Security keys supported

### Banking (Chase, Wells Fargo)
- SMS OTP most common
- TOTP as backup option
- Biometric on mobile
- Complex 2FA for high-value transfers

---

## Compliance & Standards

### NIST Guidelines
- **NIST SP 800-63B (2017)**: SMS OTP acceptable but not preferred
- **NIST SP 800-63-3 (2020)**: TOTP preferred over SMS
- **NIST Future (2024)**: Passkeys recommended as replacement

### Regulatory Requirements
- **PCI-DSS**: 2FA required for admin access (since v3.2)
- **HIPAA**: Strongly recommended for healthcare data
- **SOC2**: Multi-factor authentication required
- **GDPR**: Best practice for security
- **SEC**: Requires 2FA for financial systems (2023+)

---

## Migration Path: Password Only → Password + 2FA

```
Phase 1: Introduce 2FA (Optional)
  - Add 2FA opt-in to settings
  - Educate users on benefits
  - Provide setup guide

Phase 2: Encourage 2FA (Recommended)
  - Show encouragement prompt on login
  - Warn about account risks
  - Show % of users with 2FA

Phase 3: Enforce 2FA (Different by user type)
  - Admins: Required immediately
  - High-privilege: Required within 30 days
  - Regular users: Optional (or recommended)

Phase 4: Mandatory 2FA (All users)
  - All users must enable 2FA
  - Grace period of 3-6 months
  - Lockout after grace period

Phase 5: Passwordless (Eliminate passwords)
  - Passkeys as primary (WebAuthn)
  - 2FA becomes redundant
  - Legacy passwords deprecated
```

---

## Future Trends

1. **Shift from SMS → TOTP**: NIST guidelines driving change
2. **Passkeys (WebAuthn)**: Replacement for both password + 2FA
3. **Biometric 2FA**: Face/fingerprint becoming standard
4. **Risk-based 2FA**: Only prompt when high-risk login detected
5. **Contextual 2FA**: Different factors based on location/device/time
6. **Distributed 2FA**: Social recovery (friends approve login)
