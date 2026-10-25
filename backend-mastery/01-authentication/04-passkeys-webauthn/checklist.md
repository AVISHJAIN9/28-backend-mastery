# Implementation Checklist: WebAuthn Passkeys

## Understanding Phase

- [ ] **Understand Public Key Cryptography**
  - [ ] Private key never leaves device
  - [ ] Public key stored on server
  - [ ] Signature proves key ownership
  - [ ] Challenge prevents replay attacks

- [ ] **Learn WebAuthn Flow**
  - [ ] Registration: challenge → biometric → credential → public key storage
  - [ ] Authentication: challenge → biometric → signature → JWT tokens
  - [ ] Difference from password auth
  - [ ] Security advantages

- [ ] **Study Attack Prevention**
  - [ ] Phishing prevention via origin binding
  - [ ] Replay attack prevention via unique challenges
  - [ ] Clone detection via counter validation
  - [ ] Database breach protection (no passwords)

## Architecture Phase

- [ ] **Database Design**
  - [ ] Users table with id, email, name, created_at
  - [ ] WebAuthn credentials table with:
    - [ ] credential_id (from device)
    - [ ] user_id (foreign key)
    - [ ] public_key (base64-encoded)
    - [ ] counter (clone detection)
    - [ ] transports (usb, nfc, ble, internal)
    - [ ] created_at, last_used

- [ ] **Challenge Storage**
  - [ ] In-memory Map for development
  - [ ] Redis for production
  - [ ] TTL set to 5 minutes
  - [ ] Key format: user_id or email

- [ ] **Configuration**
  - [ ] RP_NAME (Relying Party name)
  - [ ] RP_ID (Domain name - critical!)
  - [ ] RP_ORIGIN (Frontend URL)
  - [ ] JWT_SECRET
  - [ ] HTTPS settings

## Implementation Phase

- [ ] **Registration Endpoint (`/auth/webauthn/register/start`)**
  - [ ] Validate email and name input (Joi schema)
  - [ ] Check email doesn't already exist
  - [ ] Generate random 32-byte challenge
  - [ ] Store challenge with email, 5-min TTL
  - [ ] Return challenge, RP info, user entity
  - [ ] Error handling: 409 for duplicate, 400 for invalid input

- [ ] **Complete Registration (`/auth/webauthn/register/complete`)**
  - [ ] Validate userId exists in challenges
  - [ ] Validate credential structure
  - [ ] Verify challenge hasn't expired
  - [ ] Create user record
  - [ ] Store credential (id, public key, counter)
  - [ ] Delete used challenge
  - [ ] Return 201 Created with user info
  - [ ] Error handling: 400 for missing credential

- [ ] **Authentication Endpoint (`/auth/webauthn/authenticate/start`)**
  - [ ] Validate email input
  - [ ] Check user exists
  - [ ] Generate new random challenge
  - [ ] Store challenge with user_id, 5-min TTL
  - [ ] Return challenge and options
  - [ ] Error handling: 404 if user not found

- [ ] **Complete Authentication (`/auth/webauthn/authenticate/complete`)**
  - [ ] Validate email, credential ID, signature
  - [ ] Find user and credential
  - [ ] Find stored challenge
  - [ ] Verify signature with public key
  - [ ] Validate counter increased
  - [ ] Update counter and last_used
  - [ ] Generate JWT access + refresh tokens
  - [ ] Delete used challenge
  - [ ] Return 200 with tokens
  - [ ] Error handling: 401 for invalid signature, 400 for counter issue

- [ ] **Input Validation (schema.js)**
  - [ ] Email: valid email format
  - [ ] Name: 2-100 chars
  - [ ] UserId: UUID format
  - [ ] Credential: required fields only
  - [ ] Counter: positive integer

- [ ] **Middleware (middleware.js)**
  - [ ] JWT verification middleware
  - [ ] Error handling (never expose stack traces)
  - [ ] Request logging (Winston)
  - [ ] Rate limiting on auth endpoints
  - [ ] CORS configuration

- [ ] **Routes (routes.js)**
  - [ ] POST /auth/webauthn/register/start
  - [ ] POST /auth/webauthn/register/complete
  - [ ] POST /auth/webauthn/authenticate/start
  - [ ] POST /auth/webauthn/authenticate/complete
  - [ ] GET /api/me (protected)
  - [ ] POST /auth/logout

## Testing Phase

- [ ] **Unit Tests**
  - [ ] Challenge generation is random
  - [ ] Challenge expiration works
  - [ ] Counter increment validation
  - [ ] Signature verification logic

- [ ] **Integration Tests**
  - [ ] Full registration flow
  - [ ] Full authentication flow
  - [ ] Token validation on protected routes
  - [ ] Logout invalidates token

- [ ] **Manual Testing**
  - [ ] Scenario 1: Successful registration
  - [ ] Scenario 2: Authentication flow
  - [ ] Scenario 3: Duplicate email rejection
  - [ ] Scenario 4: User not found
  - [ ] Scenario 5: Missing fields validation
  - [ ] Scenario 6: Invalid signature
  - [ ] Scenario 7: Counter not incremented
  - [ ] Scenario 8: Protected endpoint access

- [ ] **Frontend Testing (App.jsx)**
  - [ ] Registration button triggers flow
  - [ ] Biometric prompt appears
  - [ ] Credential successfully stored
  - [ ] Login button triggers authentication
  - [ ] JWT token received and stored
  - [ ] Protected endpoint accessed with token
  - [ ] Logout clears token

- [ ] **Browser Compatibility**
  - [ ] Chrome/Edge: ✓ Test
  - [ ] Safari: ✓ Test
  - [ ] Firefox: ✓ Test
  - [ ] Mobile (iOS): ✓ Test
  - [ ] Mobile (Android): ✓ Test

## Security Phase

- [ ] **Cryptographic Validation**
  - [ ] Public key properly formatted
  - [ ] Signature verification algorithm correct
  - [ ] Challenge randomness verified
  - [ ] No hardcoded secrets

- [ ] **Injection Prevention**
  - [ ] SQL injection: Use parameterized queries
  - [ ] XSS prevention: Escape all outputs
  - [ ] CSRF prevention: Origin validation

- [ ] **Access Control**
  - [ ] Users can only access own data
  - [ ] Admin endpoints require authentication
  - [ ] Sensitive endpoints require HTTPS

- [ ] **Data Protection**
  - [ ] Public keys stored (not passwords)
  - [ ] Challenges in secure storage
  - [ ] JWT tokens signed with secret
  - [ ] Sensitive logs don't expose data

- [ ] **Rate Limiting**
  - [ ] Registration: 10 per hour per IP
  - [ ] Authentication: 20 per hour per IP
  - [ ] Proper error messages (don't leak info)

## Documentation Phase

- [ ] **Code Comments**
  - [ ] Explain WebAuthn flow
  - [ ] Document security-critical sections
  - [ ] Note any deviations from spec

- [ ] **README.md**
  - [ ] Module overview
  - [ ] API documentation
  - [ ] Real-world examples
  - [ ] Security best practices

- [ ] **theory.md**
  - [ ] WebAuthn concepts
  - [ ] Registration and auth flows
  - [ ] Cryptography explanation
  - [ ] Attack prevention details
  - [ ] Compliance information
  - [ ] 300+ lines, comprehensive

- [ ] **setup.md**
  - [ ] Installation instructions
  - [ ] Environment configuration
  - [ ] All 8 test scenarios
  - [ ] Expected outputs
  - [ ] Troubleshooting guide
  - [ ] 400+ lines, detailed

- [ ] **preview.html**
  - [ ] Visual flow diagram
  - [ ] Interactive demo of registration
  - [ ] Interactive demo of authentication
  - [ ] Key concepts explained
  - [ ] Security features highlighted
  - [ ] Real-world examples

## Edge Cases Phase

- [ ] **Challenge Expiration**
  - [ ] Challenge expires after 5 minutes
  - [ ] Expired challenge returns 400
  - [ ] New challenge can be requested

- [ ] **Clone Detection**
  - [ ] Counter increases on each signature
  - [ ] Same counter twice = rejection (401)
  - [ ] Backward counter = rejection (400)
  - [ ] Logging of suspicious activity

- [ ] **Multiple Credentials**
  - [ ] User can register multiple keys
  - [ ] User can authenticate with any key
  - [ ] Each key has own counter
  - [ ] Delete key removes it from user

- [ ] **Account Recovery**
  - [ ] User loses device, needs recovery
  - [ ] Backup codes generated during registration
  - [ ] Backup codes can restore account
  - [ ] Backup codes one-time use

- [ ] **Cross-Device Sync**
  - [ ] User registers on phone
  - [ ] Credential synced to iCloud/Google
  - [ ] Can login on desktop with same key
  - [ ] Optional - depends on authenticator

## Production Readiness Phase

- [ ] **Database**
  - [ ] Credentials stored in persistent DB
  - [ ] Migrations created
  - [ ] Backups configured
  - [ ] Indexes on frequently queried fields

- [ ] **Performance**
  - [ ] Signature verification < 100ms
  - [ ] Challenge generation < 10ms
  - [ ] Response times acceptable
  - [ ] No memory leaks in long runs

- [ ] **Monitoring**
  - [ ] Login success/failure rates logged
  - [ ] Failed signature attempts tracked
  - [ ] Alerts for suspicious activity
  - [ ] All errors logged with context

- [ ] **Security**
  - [ ] HTTPS enforced in production
  - [ ] RP_ID matches actual domain
  - [ ] JWT_SECRET is strong (32+ chars)
  - [ ] No debug mode in production
  - [ ] CORS properly configured

- [ ] **Deployment**
  - [ ] Environment variables configured
  - [ ] Database migrations run
  - [ ] Health check endpoint working
  - [ ] Rolling deployment tested
  - [ ] Rollback procedure documented

## Completed ✓

- [x] theory.md - 500+ lines with deep dive
- [x] setup.md - 400+ lines with 8 test scenarios
- [x] preview.html - 450+ lines with interactive demo
- [x] checklist.md - Comprehensive implementation tracking
