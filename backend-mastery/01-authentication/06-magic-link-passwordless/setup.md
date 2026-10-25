# Setup Guide: Magic Link Passwordless

## Prerequisites

- Node.js 16+ (crypto module support)
- npm or yarn
- HTTPS in production (localhost for development)
- Email service configured (SendGrid, AWS SES, Nodemailer)
- Modern browser

## Installation

### Step 1: Install Dependencies

```bash
cd 06-magic-link-passwordless
npm install
```

**Dependencies installed:**
- `express` - Web framework
- `jsonwebtoken` - JWT token generation
- `joi` - Input validation
- `uuid` - Unique IDs
- `crypto` - Built-in Node.js cryptography
- `cors` - Cross-origin requests
- `dotenv` - Environment variables
- `winston` - Logging
- `nodemailer` - Email sending (for development/testing)

### Step 2: Configure Environment

Create `.env` from `.env.example`:

```bash
cp .env.example .env
```

**Required variables:**
```env
# Server
HTTP_PORT=4006
NODE_ENV=development

# JWT
JWT_SECRET=your-super-secret-key-min-32-chars-here
JWT_EXPIRY=7d

# Email Configuration
EMAIL_SERVICE=gmail          # gmail, sendgrid, aws-ses
EMAIL_USER=your-email@gmail.com
EMAIL_PASS=your-app-password
EMAIL_FROM=noreply@example.com

# Frontend
FRONTEND_URL=http://localhost:3000

# Magic Link
MAGIC_LINK_EXPIRY=15m        # Token expiration time
MAGIC_LINK_TIMEOUT=15        # 15 minutes in seconds

# Logging
LOG_LEVEL=info
```

**Email Setup (Gmail Development):**
1. Enable 2FA on Gmail account
2. Generate app-specific password
3. Use as `EMAIL_PASS` in .env
4. Note: This is development only, use SendGrid/AWS SES in production

## Running the Server

### Development Mode

```bash
node server.js
```

**Expected output:**
```
2024-03-29 14:32:15 [INFO] Magic Link Passwordless server running on port 4006
2024-03-29 14:32:15 [INFO] Email service: gmail
2024-03-29 14:32:15 [INFO] Magic link expiry: 15 minutes
2024-03-29 14:32:15 [INFO] Ready to accept registration/authentication requests
```

### With Hot Reload

```bash
npm install -g nodemon
nodemon server.js
```

## API Endpoints

### 1. Register User

```
POST /auth/register
Content-Type: application/json

{
  "email": "user@example.com",
  "name": "John Doe"
}
```

**Response (201 Created):**
```json
{
  "message": "User registered",
  "user": {
    "id": "550e8400-e29b-41d4-a716-446655440000",
    "email": "user@example.com",
    "name": "John Doe",
    "createdAt": "2024-03-29T14:32:15.000Z"
  }
}
```

**Error Cases:**
- `409 Conflict`: Email already registered
- `400 Bad Request`: Missing required fields

### 2. Send Magic Link

```
POST /auth/send-magic-link
Content-Type: application/json

{
  "email": "user@example.com"
}
```

**Response (200 OK):**
```json
{
  "message": "Magic link sent to your email",
  "token": "a3f2b1e9d7c4f8a2b5e1d9c3f7a4b8e2d1c5f9a7b3e6d9c2f5a8b1e4d7c0f3"
}
```

**In Production:**
- Don't return token in response
- Token sent only to email
- User clicks link in email

**Error Cases:**
- `404 Not Found`: Email not registered
- `429 Too Many Requests`: Rate limited (>10 requests/hour)

### 3. Verify Magic Link

```
GET /auth/verify/:token
```

**Response (200 OK):**
```json
{
  "accessToken": "eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9...",
  "user": {
    "id": "550e8400-e29b-41d4-a716-446655440000",
    "email": "user@example.com",
    "name": "John Doe"
  }
}
```

**Error Cases:**
- `401 Unauthorized`: Token invalid, expired, or already used
- `400 Bad Request`: Malformed token

### 4. Get Current User

```
GET /api/me
Authorization: Bearer JWT_TOKEN
```

**Response (200 OK):**
```json
{
  "user": {
    "id": "550e8400-e29b-41d4-a716-446655440000",
    "email": "user@example.com",
    "name": "John Doe",
    "createdAt": "2024-03-29T14:32:15.000Z"
  }
}
```

**Error Cases:**
- `401 Unauthorized`: No token or invalid token
- `404 Not Found`: User not found

### 5. Logout

```
POST /auth/logout
Authorization: Bearer JWT_TOKEN
```

**Response (200 OK):**
```json
{
  "message": "Logged out successfully"
}
```

## Test Scenarios

### Scenario 1: Successful Registration

**Goal:** Register a new user

```bash
curl -X POST http://localhost:4006/auth/register \
  -H "Content-Type: application/json" \
  -d '{
    "email": "test1@example.com",
    "name": "Test User One"
  }'

# Expected: 201 Created
# {
#   "message": "User registered",
#   "user": {"id": "uuid", "email": "test1@example.com", ...}
# }
```

**What it tests:**
- ✓ Email validation (valid format)
- ✓ User creation
- ✓ UUID generation
- ✓ Timestamp creation

### Scenario 2: Send Magic Link

**Goal:** Generate and send magic link token

```bash
curl -X POST http://localhost:4006/auth/send-magic-link \
  -H "Content-Type: application/json" \
  -d '{"email": "test1@example.com"}'

# Expected: 200 OK
# {
#   "message": "Magic link sent to your email",
#   "token": "64-char-hex-string"
# }
```

**What it tests:**
- ✓ User existence check
- ✓ Random token generation (32 bytes)
- ✓ Token storage with expiry
- ✓ Email sending
- ✓ Token formatting (hex string)

### Scenario 3: Verify Magic Link (Success)

**Goal:** Use token to login

```bash
# Get token from scenario 2 response:
TOKEN="a3f2b1e9d7c4f8a2b5e1d9c3f7a4b8e2..."

curl -X GET "http://localhost:4006/auth/verify/$TOKEN"

# Expected: 200 OK
# {
#   "accessToken": "jwt-token",
#   "user": {...}
# }
```

**What it tests:**
- ✓ Token lookup
- ✓ Token validation (exists)
- ✓ Expiration check
- ✓ One-time use enforcement
- ✓ JWT generation
- ✓ User retrieval

### Scenario 4: Token Already Used

**Goal:** Prevent reusing same token

```bash
TOKEN="a3f2b1e9d7c4f8a2b5e1d9c3f7a4b8e2..."

# First use: Success
curl -X GET "http://localhost:4006/auth/verify/$TOKEN"
# Expected: 200 OK, JWT returned

# Second use: Should fail
curl -X GET "http://localhost:4006/auth/verify/$TOKEN"
# Expected: 401 Unauthorized
# {"error": "Invalid or expired link"}
```

**What it tests:**
- ✓ Token marked as used
- ✓ Replay attack prevention
- ✓ One-time use enforcement

### Scenario 5: Expired Token

**Goal:** Reject expired tokens

```bash
# Create token and wait 16 minutes (exceeds 15 min expiry)
# Then try to use:

curl -X GET "http://localhost:4006/auth/verify/OLD_TOKEN"

# Expected: 401 Unauthorized
# {"error": "Invalid or expired link"}
```

**What it tests:**
- ✓ Expiration timestamp check
- ✓ Current time comparison
- ✓ Security (old tokens rejected)

### Scenario 6: User Not Found

**Goal:** Handle missing user

```bash
curl -X POST http://localhost:4006/auth/send-magic-link \
  -H "Content-Type: application/json" \
  -d '{"email": "nonexistent@example.com"}'

# Expected: 404 Not Found
# {"error": "User not found"}
```

**What it tests:**
- ✓ Email lookup
- ✓ User existence validation
- ✓ Proper error codes

### Scenario 7: Invalid Email

**Goal:** Validate email format

```bash
curl -X POST http://localhost:4006/auth/register \
  -H "Content-Type: application/json" \
  -d '{
    "email": "not-an-email",
    "name": "Test User"
  }'

# Expected: 400 Bad Request
# {"error": "'email' must be a valid email"}
```

**What it tests:**
- ✓ Email validation (Joi schema)
- ✓ Error messages
- ✓ Input sanitization

### Scenario 8: Protected Endpoint

**Goal:** Access protected route with JWT

```bash
# First, get JWT from magic link verification
JWT="eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9..."

curl -X GET http://localhost:4006/api/me \
  -H "Authorization: Bearer $JWT"

# Expected: 200 OK
# {
#   "user": {...}
# }
```

**What it tests:**
- ✓ JWT validation
- ✓ Auth middleware
- ✓ User lookup via JWT claims
- ✓ Protected route access

## Automated Testing

Create `test.js` to automate all scenarios:

```bash
node test.js
```

**Output:**
```
✓ Scenario 1: Successful Registration
✓ Scenario 2: Send Magic Link
✓ Scenario 3: Verify Magic Link (Success)
✓ Scenario 4: Token Already Used
✓ Scenario 5: Expired Token
✓ Scenario 6: User Not Found
✓ Scenario 7: Invalid Email
✓ Scenario 8: Protected Endpoint

All tests passed! ✓
```

## Debugging

### Enable Verbose Logging

```env
LOG_LEVEL=debug
```

### Check Server Health

```bash
curl http://localhost:4006/health
```

### Monitor Email Sends

```bash
# Check mailbox in development (Nodemailer logs to console)
# In production, check SendGrid/AWS SES logs
```

## Troubleshooting

| Issue | Cause | Solution |
|-------|-------|----------|
| **Port already in use** | Another service on 4006 | Change PORT or `killall node` |
| **Email not sending** | Invalid SMTP config | Check EMAIL_* variables in .env |
| **Token invalid immediately** | Clock skew | Sync system time |
| **CORS errors** | Frontend on different origin | Check CORS headers |
| **JWT not working** | Wrong JWT_SECRET | Verify JWT_SECRET matches |
| **Token expired too soon** | MAGIC_LINK_TIMEOUT set wrong | Should be seconds: 15 * 60 = 900 |

## Production Checklist

- [ ] Use SendGrid or AWS SES (not Gmail)
- [ ] Set `NODE_ENV=production`
- [ ] Change `JWT_SECRET` to strong random value
- [ ] Set `FRONTEND_URL` to actual domain
- [ ] Enable HTTPS only
- [ ] Configure email reply-to address
- [ ] Set up email template (HTML with branding)
- [ ] Implement rate limiting
- [ ] Add monitoring/alerting
- [ ] Set up email delivery tracking
- [ ] Test with real email addresses
- [ ] Implement token cleanup job (delete expired tokens)
- [ ] Add usage analytics
- [ ] Set up backup email service
