# Setup Guide: WebAuthn Passkeys

## Prerequisites

- Node.js 16+ (for crypto support)
- npm or yarn
- HTTPS in production (localhost works for dev)
- Modern browser (Chrome, Safari, Firefox, Edge)
- Optional: Hardware security key (YubiKey, Titan) for testing

## Installation

### Step 1: Install Dependencies

```bash
cd 04-passkeys-webauthn
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

### Step 2: Configure Environment

Create `.env` from `.env.example`:

```bash
cp .env.example .env
```

**Required variables:**
```env
# Server
HTTP_PORT=4004
NODE_ENV=development

# JWT
JWT_SECRET=your-super-secret-key-min-32-chars-here
JWT_EXPIRY=7d

# RP (Relying Party) - IMPORTANT for WebAuthn
RP_NAME=My App
RP_ID=localhost              # For production: example.com
RP_ORIGIN=http://localhost:3000  # Frontend URL

# Logging
LOG_LEVEL=info
```

**⚠️ Important for WebAuthn:**
- `RP_ID` must match your domain
- `RP_ORIGIN` must match frontend origin
- Both are checked by browser for security

## Running the Server

### Development Mode

```bash
node server.js
```

**Expected output:**
```
2024-03-29 14:32:15 [INFO] WebAuthn Passkeys server running on port 4004
2024-03-29 14:32:15 [INFO] HTTPS: NO (use for dev only)
2024-03-29 14:32:15 [INFO] RP_ID: localhost
2024-03-29 14:32:15 [INFO] Ready to accept registration/authentication requests
```

### With Hot Reload

```bash
npm install -g nodemon
nodemon server.js
```

### Production (HTTPS Required)

```bash
# Set in .env
HTTPS=true
HTTPS_CERT=/path/to/cert.pem
HTTPS_KEY=/path/to/key.pem

# Run
node server.js
```

## API Endpoints

### 1. Start Registration

```
POST /auth/webauthn/register/start
Content-Type: application/json

{
  "email": "alice@example.com",
  "name": "Alice Smith"
}
```

**Response (200 OK):**
```json
{
  "challenge": "F8Ys_xp7c3K5x9...",
  "rp": {
    "name": "My App",
    "id": "localhost"
  },
  "user": {
    "id": "550e8400-e29b-41d4-a716-446655440000",
    "name": "alice@example.com",
    "displayName": "Alice Smith"
  }
}
```

**Error Cases:**
- `409 Conflict`: Email already registered
- `400 Bad Request`: Missing required fields

### 2. Complete Registration

```
POST /auth/webauthn/register/complete
Content-Type: application/json

{
  "userId": "550e8400-e29b-41d4-a716-446655440000",
  "credential": {
    "id": "credential-id-from-device",
    "publicKey": "base64-encoded-public-key",
    "counter": 0
  }
}
```

**Response (201 Created):**
```json
{
  "message": "Registration successful",
  "user": {
    "id": "550e8400-e29b-41d4-a716-446655440000",
    "email": "alice@example.com",
    "name": "Alice Smith"
  }
}
```

### 3. Start Authentication

```
POST /auth/webauthn/authenticate/start
Content-Type: application/json

{
  "email": "alice@example.com"
}
```

**Response (200 OK):**
```json
{
  "challenge": "X9k3_yp7c3K5x9...",
  "timeout": 60000,
  "userVerification": "preferred"
}
```

**Error Cases:**
- `404 Not Found`: Email not registered

### 4. Complete Authentication

```
POST /auth/webauthn/authenticate/complete
Content-Type: application/json

{
  "email": "alice@example.com",
  "credentialId": "credential-id-from-device",
  "signature": "base64-encoded-signature",
  "counter": 1
}
```

**Response (200 OK):**
```json
{
  "message": "Authentication successful",
  "accessToken": "eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9...",
  "refreshToken": "eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9...",
  "user": {
    "id": "550e8400-e29b-41d4-a716-446655440000",
    "email": "alice@example.com",
    "name": "Alice Smith"
  }
}
```

**Error Cases:**
- `401 Unauthorized`: Invalid signature
- `400 Bad Request`: Counter didn't increase (possible clone)

## Test Scenarios

### Scenario 1: Successful Registration

**Goal:** Register a new user with WebAuthn

```bash
# Step 1: Get registration challenge
curl -X POST http://localhost:4004/auth/webauthn/register/start \
  -H "Content-Type: application/json" \
  -d '{
    "email": "test1@example.com",
    "name": "Test User One"
  }'

# Response:
# {
#   "challenge": "F8Ys_xp7c3K5x9...",
#   "rp": {...},
#   "user": {"id": "uuid", "name": "test1@example.com", ...}
# }

# Step 2: Simulate device registration (frontend would do this)
# In real scenario, browser WebAuthn API:
#   1. Shows biometric prompt
#   2. Generates public/private key pair
#   3. Signs challenge with private key
#   4. Returns credential

# Step 3: Complete registration
curl -X POST http://localhost:4004/auth/webauthn/register/complete \
  -H "Content-Type: application/json" \
  -d '{
    "userId": "returned-from-step-1",
    "credential": {
      "id": "mock-credential-id-1",
      "publicKey": "mock-public-key-abc123",
      "counter": 0
    }
  }'

# Expected: 201 Created with user object
```

**What it tests:**
- ✓ Email uniqueness validation
- ✓ Challenge generation
- ✓ Credential storage
- ✓ User creation

### Scenario 2: Authentication Flow

**Goal:** User authenticates with registered passkey

```bash
# Step 1: Request authentication challenge
curl -X POST http://localhost:4004/auth/webauthn/authenticate/start \
  -H "Content-Type: application/json" \
  -d '{"email": "test1@example.com"}'

# Response: {"challenge": "X9k3_yp7...", ...}

# Step 2: Device signs with private key (browser does this)

# Step 3: Submit authentication
curl -X POST http://localhost:4004/auth/webauthn/authenticate/complete \
  -H "Content-Type: application/json" \
  -d '{
    "email": "test1@example.com",
    "credentialId": "mock-credential-id-1",
    "signature": "mock-signature-xyz789",
    "counter": 1
  }'

# Expected: 200 OK with JWT tokens
```

**What it tests:**
- ✓ Challenge validation
- ✓ Signature verification
- ✓ Counter increment check
- ✓ Token generation

### Scenario 3: Duplicate Email Registration

**Goal:** Prevent duplicate email registration

```bash
curl -X POST http://localhost:4004/auth/webauthn/register/start \
  -H "Content-Type: application/json" \
  -d '{
    "email": "test1@example.com",
    "name": "Different Name"
  }'

# Expected: 409 Conflict
# {
#   "error": "User already exists"
# }
```

**What it tests:**
- ✓ Email uniqueness enforcement
- ✓ Proper error codes

### Scenario 4: Invalid Challenge

**Goal:** Reject authentication with invalid challenge

```bash
curl -X POST http://localhost:4004/auth/webauthn/authenticate/start \
  -H "Content-Type: application/json" \
  -d '{"email": "nonexistent@example.com"}'

# Expected: 404 Not Found
# {
#   "error": "User not found"
# }
```

**What it tests:**
- ✓ User existence validation
- ✓ Proper error messages

### Scenario 5: Missing Required Fields

**Goal:** Validate input schemas

```bash
# Missing email
curl -X POST http://localhost:4004/auth/webauthn/register/start \
  -H "Content-Type: application/json" \
  -d '{"name": "Test User"}'

# Expected: 400 Bad Request
# {
#   "error": "'email' is required"
# }
```

**What it tests:**
- ✓ Input validation
- ✓ Schema enforcement

### Scenario 6: Invalid Signature

**Goal:** Reject authentication with wrong signature

```bash
# First, get valid challenge
curl -X POST http://localhost:4004/auth/webauthn/authenticate/start \
  -H "Content-Type: application/json" \
  -d '{"email": "test1@example.com"}'

# Then submit with wrong signature
curl -X POST http://localhost:4004/auth/webauthn/authenticate/complete \
  -H "Content-Type: application/json" \
  -d '{
    "email": "test1@example.com",
    "credentialId": "mock-credential-id-1",
    "signature": "wrong-signature-invalid",
    "counter": 1
  }'

# Expected: 401 Unauthorized
# {
#   "error": "Authentication failed"
# }
```

**What it tests:**
- ✓ Signature validation
- ✓ Cryptographic verification

### Scenario 7: Counter Not Incremented

**Goal:** Detect possible key cloning

```bash
# Valid auth with counter = 5
curl -X POST http://localhost:4004/auth/webauthn/authenticate/complete \
  -H "Content-Type: application/json" \
  -d '{
    "email": "test1@example.com",
    "credentialId": "mock-credential-id-1",
    "signature": "valid-sig-1",
    "counter": 5
  }'

# Try same counter again (should fail)
curl -X POST http://localhost:4004/auth/webauthn/authenticate/complete \
  -H "Content-Type: application/json" \
  -d '{
    "email": "test1@example.com",
    "credentialId": "mock-credential-id-1",
    "signature": "valid-sig-2",
    "counter": 5
  }'

# Expected: 400 Bad Request
# {
#   "error": "Possible key cloning detected"
# }
```

**What it tests:**
- ✓ Counter validation
- ✓ Clone detection
- ✓ Security best practices

### Scenario 8: Protected Endpoint

**Goal:** Access protected route with JWT token

```bash
# First, authenticate to get token
TOKEN=$(curl -X POST http://localhost:4004/auth/webauthn/authenticate/complete \
  -H "Content-Type: application/json" \
  -d '...' | jq -r '.accessToken')

# Use token to access protected route
curl -X GET http://localhost:4004/api/me \
  -H "Authorization: Bearer $TOKEN"

# Expected: 200 OK
# {
#   "id": "user-uuid",
#   "email": "test1@example.com",
#   "name": "Test User One"
# }
```

**What it tests:**
- ✓ JWT validation
- ✓ Protected routes
- ✓ Authorization

## Automated Testing

Create `test.js` to automate all scenarios:

```bash
node test.js
```

**Output:**
```
✓ Scenario 1: Successful Registration
✓ Scenario 2: Authentication Flow
✓ Scenario 3: Duplicate Email Registration
✓ Scenario 4: Invalid Challenge
✓ Scenario 5: Missing Required Fields
✓ Scenario 6: Invalid Signature
✓ Scenario 7: Counter Not Incremented
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
curl http://localhost:4004/health
```

### Monitor In-Memory Storage

```bash
# Check registered users
node -e "const app = require('./server'); console.log(app.users)"
```

## Troubleshooting

| Issue | Cause | Solution |
|-------|-------|----------|
| **Port already in use** | Another service on 4004 | Change PORT in .env or `lsof -i :4004` |
| **RP_ID mismatch error** | RP_ID doesn't match domain | Set RP_ID=localhost for dev |
| **HTTPS required** | WebAuthn needs secure context | Use development server with HTTPS or localhost |
| **Challenge expired** | Took too long to authenticate | Complete within 5 minutes |
| **Signature invalid** | Counter didn't increase | Check counter increment logic |
| **User not found** | Email not registered | Register first before auth |

## Production Checklist

- [ ] Set `NODE_ENV=production`
- [ ] Enable HTTPS and provide cert/key
- [ ] Change `JWT_SECRET` to strong random value
- [ ] Set `RP_ID` to actual domain
- [ ] Set `RP_ORIGIN` to frontend URL
- [ ] Configure database for public key storage
- [ ] Implement rate limiting on registration/auth
- [ ] Add backup codes for account recovery
- [ ] Set up monitoring/alerting
- [ ] Review all security best practices
- [ ] Test with real hardware keys
- [ ] Implement account deletion endpoint
