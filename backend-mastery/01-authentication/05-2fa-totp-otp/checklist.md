# Implementation Checklist: 2FA / TOTP / OTP

## Understanding Phase

- [ ] **Understand Authentication Factors**
  - [ ] Something you know (password)
  - [ ] Something you have (phone, key)
  - [ ] Something you are (biometric)
  - [ ] Where you are (location)
  - [ ] Why 2FA is better than password-only

- [ ] **Understand TOTP Algorithm**
  - [ ] How HMAC-SHA1 works
  - [ ] Time-based step calculation (30-second windows)
  - [ ] How QR code encodes secret
  - [ ] Why time window tolerance is needed
  - [ ] Clock skew and synchronization

- [ ] **Understand OTP Methods**
  - [ ] TOTP (authenticator app) - most secure
  - [ ] SMS OTP - easiest but weaker
  - [ ] Email OTP - medium security
  - [ ] Backup codes - recovery mechanism
  - [ ] When to use each method

- [ ] **Study Real-World Attacks**
  - [ ] SIM jacking (SMS bypass)
  - [ ] SS7 attacks (SMS interception)
  - [ ] Phishing (user tricks into revealing code)
  - [ ] Brute force (trying all 6-digit codes)
  - [ ] Time-based race condition (code expires)
  - [ ] Lost device (can't generate codes)

## Architecture Phase

- [ ] **Database Design**
  - [ ] Users table with MFA fields:
    - [ ] mfaEnabled (boolean)
    - [ ] mfaSecret (base32 encoded secret)
    - [ ] mfaMethod (totp, sms, email)
  - [ ] Backup codes table with:
    - [ ] userId (foreign key)
    - [ ] code (bcrypt hashed)
    - [ ] used (boolean, one-time use)
    - [ ] createdAt

- [ ] **Session Management**
  - [ ] Temp session after password verification
  - [ ] Session expires after 5 minutes
  - [ ] Session auto-deleted after verification
  - [ ] No reuse of session tokens

## Implementation Phase

- [ ] **Schema Validation (schema.js)**
  - [ ] registerSchema: email, password, name
  - [ ] loginSchema: email, password
  - [ ] setupMFASchema: no input (uses auth token)
  - [ ] verifyMFASchema: 6-digit token, sessionToken
  - [ ] verifyBackupCodeSchema: 8-char code, sessionToken
  - [ ] disableMFASchema: password confirmation
  - [ ] generateBackupCodesSchema: TOTP verification

- [ ] **User Registration**
  - [ ] Validate input with Joi schema
  - [ ] Check email uniqueness
  - [ ] Hash password with bcrypt (cost 10)
  - [ ] Store user with mfaEnabled=false
  - [ ] Return 201 with user object

- [ ] **Login Endpoint**
  - [ ] Validate credentials schema
  - [ ] Find user by email
  - [ ] Compare password with bcrypt
  - [ ] Check if mfaEnabled
  - [ ] If MFA disabled: return JWT token
  - [ ] If MFA enabled: create session, return sessionToken

- [ ] **Setup MFA Endpoint**
  - [ ] Require JWT authentication
  - [ ] Generate TOTP secret (speakeasy library)
  - [ ] Generate QR code (qrcode library)
  - [ ] Store tempSecret on user object
  - [ ] Generate 10 backup codes
  - [ ] Return QR code + secret + backup codes

- [ ] **2FA Verification Endpoint**
  - [ ] Find session by sessionToken
  - [ ] Check session not expired
  - [ ] Get user from session
  - [ ] Verify TOTP token with speakeasy (window=2)
  - [ ] Check for code reuse (prevent replay)
  - [ ] If valid: generate JWT token
  - [ ] Delete session (one-time use)
  - [ ] Rate limiting: max 5 attempts

- [ ] **Backup Code Fallback**
  - [ ] Find session by sessionToken
  - [ ] Get user from session
  - [ ] Find backup code matching user input
  - [ ] Verify code hasn't been used
  - [ ] Use bcrypt to compare hashed code
  - [ ] Mark code as used (one-time only)
  - [ ] Generate JWT token

- [ ] **Protected Endpoint**
  - [ ] Require JWT with mfaVerified=true claim
  - [ ] Return user profile
  - [ ] Error: 401 if no JWT

## Testing Phase

- [ ] **Manual Testing**
  - [ ] Scenario 1: Register user (no MFA)
  - [ ] Scenario 2: Login without MFA
  - [ ] Scenario 3: Setup MFA (get QR code)
  - [ ] Scenario 4: Scan QR with real authenticator
  - [ ] Scenario 5: Verify TOTP code
  - [ ] Scenario 6: Access protected endpoint
  - [ ] Scenario 7: Login with MFA enabled
  - [ ] Scenario 8: Verify TOTP during login
  - [ ] Scenario 9: Use backup code
  - [ ] Scenario 10: Generate new backup codes
  - [ ] Scenario 11: Disable MFA
  - [ ] Scenario 12: Wrong TOTP code (rate limit)

- [ ] **Edge Cases**
  - [ ] TOTP code expires during verification
  - [ ] Time window tolerance working correctly
  - [ ] Reused code rejected (same code twice)
  - [ ] Old backup code rejected (used=true)
  - [ ] Session expires mid-verification
  - [ ] Rate limiting kicks in after 5 attempts
  - [ ] Device clock is 2 minutes off

- [ ] **Security Testing**
  - [ ] Brute force protection (rate limiting)
  - [ ] Session token can't be reused
  - [ ] Backup codes one-time use
  - [ ] Backup codes hashed in database
  - [ ] TOTP code validates with time window
  - [ ] No information leakage (timing attacks)

## Frontend Testing (App.jsx)

- [ ] **Registration Form**
  - [ ] Input validation (email, password, name)
  - [ ] Submit to /auth/register
  - [ ] Handle success (201) and error (409, 400)
  - [ ] Clear form after success

- [ ] **Login Form**
  - [ ] Input validation (email, password)
  - [ ] Submit to /auth/login
  - [ ] If MFA disabled: receive JWT token
  - [ ] If MFA enabled: receive sessionToken
  - [ ] Show \"Enter 2FA code\" prompt when needed

- [ ] **MFA Setup UI**
  - [ ] Button to start MFA setup
  - [ ] Display QR code (image)
  - [ ] Show secret (text fallback)
  - [ ] Display backup codes
  - [ ] Input field for 6-digit TOTP verification
  - [ ] Button to confirm setup

- [ ] **2FA Verification UI**
  - [ ] Input field for 6-digit code
  - [ ] Alternative: \"Use backup code\" link
  - [ ] Submit button
  - [ ] Show error messages
  - [ ] Show remaining attempts

- [ ] **Settings Page**
  - [ ] Show MFA status (enabled/disabled)
  - [ ] Button to disable MFA (requires password)
  - [ ] Button to regenerate backup codes
  - [ ] Show number of remaining backup codes
  - [ ] Warning if only 1-2 codes left

## Security Hardening

- [ ] **Code Security**
  - [ ] Hash backup codes with bcrypt
  - [ ] Use constant-time comparison (avoid timing attacks)
  - [ ] Clear sensitive data from memory
  - [ ] No secrets in logs

- [ ] **Session Security**
  - [ ] sessionToken is cryptographically random
  - [ ] sessionToken expires after 5 minutes
  - [ ] sessionToken deleted after use
  - [ ] No sessionToken reuse
  - [ ] HTTPS only in production

- [ ] **Rate Limiting**
  - [ ] Max 5 attempts per session
  - [ ] 30-second lockout after 3 failed attempts
  - [ ] 5-minute lockout after 5 failed attempts
  - [ ] Rate limit per IP + user combo

## Completed ✓

- [x] schema.js - Complete with all validation schemas
- [x] theory.md - 500+ lines deep dive
- [x] checklist.md - Comprehensive tracking
