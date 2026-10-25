# Implementation Checklist: Magic Link Passwordless

## Understanding Phase

- [ ] **Understand Magic Link Concept**
  - [ ] How magic links work (token gen → email → verify)
  - [ ] Why better than passwords (no password fatigue)
  - [ ] Token lifecycle (generation → expiry → one-time use)
  - [ ] Email as identity proof (user controls email account)
  - [ ] Security model (token randomness, expiration, one-time use)

- [ ] **Study Token Security**
  - [ ] Cryptographically random generation (crypto.randomBytes)
  - [ ] Bits needed (256 bits = 32 bytes = unguessable)
  - [ ] Token transmission in URLs (HTTPS encryption)
  - [ ] Token storage (temporary, with TTL)
  - [ ] One-time use enforcement

- [ ] **Learn Attack Vectors**
  - [ ] Brute force attacks (impossible with 256-bit token)
  - [ ] Token reuse (mark used=true immediately)
  - [ ] Email interception (requires email breach)
  - [ ] Expiration bypass (timestamp validation)
  - [ ] Timing attacks (constant-time comparison)
  - [ ] Lost device (user can request new link)

- [ ] **Real-World Examples**
  - [ ] Slack magic links for email confirmation
  - [ ] Notion passwordless login
  - [ ] Medium email-based authentication
  - [ ] GitHub mobile app verification flows

## Architecture Phase

- [ ] **Database Design**
  - [ ] Users table:
    - [ ] id (UUID)
    - [ ] email (unique index)
    - [ ] name
    - [ ] createdAt
    - [ ] emailVerified (boolean)
    - [ ] lastLogin
  - [ ] Magic links table:
    - [ ] token (unique, indexed)
    - [ ] userId (foreign key)
    - [ ] email
    - [ ] createdAt
    - [ ] expiresAt (indexed for cleanup)
    - [ ] used (boolean)

- [ ] **Session/Token Management**
  - [ ] Token storage: In-memory Map (dev) or Redis (prod)
  - [ ] Token expiration: 15 minutes
  - [ ] Cleanup job: Delete expired tokens every hour
  - [ ] Rate limiting: 10 requests per email per hour

- [ ] **Configuration**
  - [ ] Magic link expiry time (15 minutes)
  - [ ] Email service (SendGrid, AWS SES, or Nodemailer)
  - [ ] Email from address
  - [ ] Frontend URL (for email links)
  - [ ] JWT secret and expiry

## Implementation Phase

- [ ] **Schema Validation (schema.js)**
  - [ ] registerSchema: email, name
  - [ ] sendMagicLinkSchema: email (must be registered)
  - [ ] verifyMagicLinkSchema: token (must be valid)

- [ ] **Token Generation (controller.js)**
  - [ ] Generate 32-byte random token
  - [ ] Convert to hex string (64 chars)
  - [ ] Store with metadata:
    - [ ] userId
    - [ ] email
    - [ ] createdAt timestamp
    - [ ] expiresAt (15 min from now)
    - [ ] used: false

- [ ] **User Registration**
  - [ ] Validate email and name
  - [ ] Check email uniqueness
  - [ ] Create user record
  - [ ] Return user object (201 Created)
  - [ ] Error: 409 if email exists
  - [ ] Error: 400 if invalid input

- [ ] **Send Magic Link Endpoint**
  - [ ] Validate email is registered
  - [ ] Generate random token (32 bytes)
  - [ ] Store token temporarily (15 min TTL)
  - [ ] Build magic link URL: frontend_url/auth/verify/TOKEN
  - [ ] Send email with link
  - [ ] Return success message
  - [ ] Error: 404 if user not found
  - [ ] Error: 429 if rate limited

- [ ] **Verify Magic Link Endpoint**
  - [ ] Extract token from URL param
  - [ ] Look up token in storage
  - [ ] Validate:
    - [ ] Token exists
    - [ ] Not expired (check against expiresAt)
    - [ ] Not already used (check used flag)
  - [ ] Mark token as used (used=true)
  - [ ] Generate JWT access token
  - [ ] Return JWT + user object
  - [ ] Error: 401 if invalid/expired/used
  - [ ] Error: 400 if malformed token

- [ ] **Protected Endpoint**
  - [ ] Require JWT in Authorization header
  - [ ] Validate JWT signature
  - [ ] Extract userId from JWT claims
  - [ ] Look up user by ID
  - [ ] Return user data
  - [ ] Error: 401 if no JWT or invalid
  - [ ] Error: 404 if user not found

- [ ] **Email Service Integration**
  - [ ] Configure SMTP (Gmail, SendGrid, AWS SES)
  - [ ] Build email template with:
    - [ ] Branding/logo
    - [ ] Greeting with username
    - [ ] Magic link button
    - [ ] Fallback text link
    - [ ] Expiration notice (15 min)
    - [ ] Security warning
  - [ ] Send email asynchronously
  - [ ] Log email events (sent, bounced, failed)

- [ ] **Middleware (middleware.js)**
  - [ ] JWT verification middleware
  - [ ] Error handling
  - [ ] Logging (Winston)
  - [ ] CORS configuration

- [ ] **Routes (routes.js)**
  - [ ] POST /auth/register
  - [ ] POST /auth/send-magic-link
  - [ ] GET /auth/verify/:token
  - [ ] GET /api/me (protected)
  - [ ] POST /auth/logout

## Testing Phase

- [ ] **Manual Testing**
  - [ ] Scenario 1: Register user successfully
  - [ ] Scenario 2: Send magic link (token generated)
  - [ ] Scenario 3: Click link, verify token (login)
  - [ ] Scenario 4: Access protected route with JWT
  - [ ] Scenario 5: Use same token twice (rejected)
  - [ ] Scenario 6: Wait 16 min, use expired token
  - [ ] Scenario 7: Non-existent email (404)
  - [ ] Scenario 8: Invalid email format (400)

- [ ] **Edge Cases**
  - [ ] Very short token expiry (5 sec)
  - [ ] Very long token expiry (1 hour)
  - [ ] Concurrent requests for same email
  - [ ] Multiple tokens active for one user
  - [ ] Token containing special chars (hex only)
  - [ ] Very long email address
  - [ ] Case sensitivity in email (should be lowercase)
  - [ ] Whitespace in email (should be trimmed)

- [ ] **Security Testing**
  - [ ] Brute force 1M tokens (should all fail)
  - [ ] Token entropy (32 bytes minimum)
  - [ ] Token not in logs or history
  - [ ] Timing attack (all 401s take same time)
  - [ ] Token one-time use enforced
  - [ ] Expiration enforced
  - [ ] User isolation (can't access other user data)
  - [ ] Email validation (can't register fake emails)

- [ ] **Integration Tests**
  - [ ] Full flow: Register → Send → Verify → Access
  - [ ] Full flow: Send link → Expire → Request new link
  - [ ] Email service integration (actual email send)
  - [ ] Rate limiting (10 per hour per email)
  - [ ] JWT expiration (after 7 days)

## Frontend Testing (App.jsx)

- [ ] **Registration Form**
  - [ ] Email input with validation
  - [ ] Name input
  - [ ] Submit button
  - [ ] Success message
  - [ ] Error message for duplicate email
  - [ ] Loading state during submission

- [ ] **Magic Link Request Form**
  - [ ] Email input
  - [ ] Submit button
  - [ ] Success message: "Check your email"
  - [ ] Error message for user not found
  - [ ] Resend link button (with cooldown)
  - [ ] Loading state

- [ ] **Verification Page**
  - [ ] Extract token from URL (?token=ABC123)
  - [ ] Auto-submit token to backend
  - [ ] Loading spinner
  - [ ] Success: Store JWT, redirect to app
  - [ ] Error: Show "Link expired, request new one"
  - [ ] Show countdown timer (15 min)

- [ ] **Protected Page**
  - [ ] Fetch /api/me with JWT
  - [ ] Display user info
  - [ ] Logout button (clears JWT)
  - [ ] Handle JWT expiration (redirect to login)

## Security Hardening

- [ ] **Token Security**
  - [ ] 256-bit random (crypto.randomBytes(32))
  - [ ] Hex-encoded (64 char string)
  - [ ] Not in URLs in production (only in email)
  - [ ] Not logged or printed
  - [ ] Marked used immediately after verification

- [ ] **Email Security**
  - [ ] HTTPS only in production
  - [ ] Frontend URL must be frontend domain (not admin)
  - [ ] Email template must NOT include plain token
  - [ ] Link must go through frontend proxy (not direct to backend)

- [ ] **Rate Limiting**
  - [ ] Max 10 send-magic-link per email per hour
  - [ ] Max 5 verify attempts per token
  - [ ] Max 100 requests per IP per hour
  - [ ] Exponential backoff: 3 attempts → 30s wait, 5 → 5min

- [ ] **Error Messages**
  - [ ] Always generic: "Invalid or expired link"
  - [ ] Don't distinguish between expired/used/invalid
  - [ ] Don't leak user existence
  - [ ] Don't expose stack traces

- [ ] **Session/Token**
  - [ ] JWT signed with strong secret (32+ chars)
  - [ ] JWT expires after 7 days
  - [ ] Logout endpoint (clear client JWT)
  - [ ] HTTPS only (Secure cookie flag)

## Documentation Phase

- [ ] **Code Comments**
  - [ ] Explain token generation algorithm
  - [ ] Mark security-critical sections
  - [ ] Document why 15-minute expiry
  - [ ] Explain one-time use enforcement

- [ ] **README.md**
  - [ ] What are magic links
  - [ ] How they work (step-by-step)
  - [ ] When to use vs alternatives
  - [ ] API documentation
  - [ ] Error codes

- [ ] **theory.md**
  - [ ] Magic link security deep dive (500+ lines)
  - [ ] Token anatomy and lifecycle
  - [ ] Attack prevention
  - [ ] Real-world examples
  - [ ] Compliance (GDPR, NIST)

- [ ] **setup.md**
  - [ ] Installation steps
  - [ ] Email configuration
  - [ ] 8 test scenarios with curl commands
  - [ ] Expected outputs
  - [ ] Troubleshooting guide

## Production Readiness

- [ ] **Email Service**
  - [ ] Production email service (SendGrid, AWS SES)
  - [ ] Email templates with branding
  - [ ] Tracking/logging (bounce, delivery)
  - [ ] From address properly configured
  - [ ] Reply-to address set
  - [ ] Unsubscribe link (if applicable)

- [ ] **Database**
  - [ ] Magic links table with TTL index
  - [ ] Users table with email index
  - [ ] Regular cleanup job (delete expired tokens)
  - [ ] Backups configured
  - [ ] Read replicas for analytics

- [ ] **Performance**
  - [ ] Token verification < 10ms
  - [ ] Email send < 1 second (async)
  - [ ] JWT generation < 5ms
  - [ ] No N+1 queries

- [ ] **Monitoring**
  - [ ] Track email delivery rate
  - [ ] Monitor verification success rate
  - [ ] Alert on failed emails
  - [ ] Monitor rate limit triggers
  - [ ] Track signup conversion

- [ ] **Security**
  - [ ] HTTPS enforced
  - [ ] HSTS headers
  - [ ] CSP headers configured
  - [ ] Rate limiting deployed
  - [ ] Token cleanup job running
  - [ ] Logs don't contain tokens

- [ ] **Deployment**
  - [ ] Environment variables configured
  - [ ] Email service credentials secured
  - [ ] JWT secret strong and unique
  - [ ] Frontend URL correctly set
  - [ ] Error logs monitored
  - [ ] Graceful shutdown configured

## Completed ✓

- [x] theory.md - 500+ line deep dive
- [x] setup.md - 400+ lines with 8 test scenarios
- [x] checklist.md - Comprehensive implementation tracking
- [x] preview.html - Interactive demo (next)
