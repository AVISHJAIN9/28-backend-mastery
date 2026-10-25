# Module 07: PKCE OAuth for Single Page Applications

## 🎯 What You'll Learn

- **PKCE Flow**: Proof Key for Code Exchange (RFC 7636)
- **Authorization Code Exchange**: Secure token generation
- **SPA Security**: Protecting public clients without secrets
- **Token Management**: JWT tokens with refresh
- **Real-world OAuth**: Modern SPA authentication patterns

## 📋 Prerequisites

- Node.js & npm
- Basic OAuth 2.0 knowledge
- Understanding of JWT tokens
- React (for frontend)

## 🚀 Quick Start

### 1. Install Dependencies
```bash
npm install
```

### 2. Setup Environment
```bash
cp .env.example .env
# Edit .env with your configuration
```

### 3. Start Server
```bash
npm start
# Server runs on http://localhost:4007
```

### 4. View Interactive Demo
Open `preview.html` in browser or start React frontend on port 5173

## 📚 Module Structure

| File | Purpose |
|------|---------|
| `server.js` | Express server with PKCE endpoints |
| `routes.js` | Route definitions (authorize, token, me, logout) |
| `controller.js` | Authentication logic & PKCE validation |
| `middleware.js` | JWT verification & request validation |
| `schema.js` | Joi validation schemas |
| `App.jsx` | React UI for testing PKCE flow |
| `package.json` | Dependencies |
| `.env.example` | Environment template |

## 🔐 API Endpoints

### POST /auth/authorize
Request authorization code
```bash
curl -X POST http://localhost:4007/auth/authorize \
  -H "Content-Type: application/json" \
  -d '{
    "code_challenge": "E9Mrozoa36-ZUbVxWNZ-76dxq1xJJp1wbZsVMNJPW38",
    "redirect_uri": "http://localhost:3000"
  }'
```

### POST /auth/token
Exchange code + verifier for tokens
```bash
curl -X POST http://localhost:4007/auth/token \
  -H "Content-Type: application/json" \
  -d '{
    "code": "code_abc123",
    "code_verifier": "long-random-string-128-chars",
    "redirect_uri": "http://localhost:3000"
  }'
```

### GET /auth/me
Get current user (requires token)
```bash
curl -H "Authorization: Bearer TOKEN" \
  http://localhost:4007/auth/me
```

### POST /auth/logout
Logout & blacklist token
```bash
curl -X POST -H "Authorization: Bearer TOKEN" \
  http://localhost:4007/auth/logout
```

## 🔑 PKCE Flow Breakdown

### What is PKCE?
PKCE (Proof Key for Code Exchange) adds an extra security layer to OAuth 2.0's Authorization Code flow, making it safe for public clients (SPAs, mobile apps) that can't securely store client secrets.

### Why PKCE?

| Problem | Solution |
|---------|----------|
| Authorization code can be intercepted | Only original client has code_verifier |
| No way to prove who initiated request | code_challenge proves the requester |
| Client secrets vulnerable in SPA code | PKCE eliminates need for secrets |
| Authorization code substitution attacks | Verifier-challenge link prevents substitution |

### The Flow (6 Steps)

```
User's Browser
     │
     ├─► Step 1: Generate code_verifier (random 128 chars)
     │          & code_challenge (SHA256 of verifier)
     │
     ├─► Step 2: Request auth code with code_challenge
     │          GET /auth/authorize?code_challenge=...
     │
     ├─► Step 3: Server stores code + challenge
     │
     ├─► Step 4: Exchange code + code_verifier
     │          POST /auth/token with code & verifier
     │
     ├─► Step 5: Server validates:
     │          SHA256(verifier) == challenge ✓
     │
     └─► Step 6: Receive access token + user info
                Verifier never sent to server in plaintext!
```

## 🛡️ Security Highlights

### Why This Protects SPAs

1. **No Client Secret**: SPAs can't store secrets in client-side code
2. **Code Verifier Path**: Verifier never transmitted in plain (only challenge sent in authorize step)
3. **Proof of Request**: Only client with matching verifier can exchange code
4. **Authorization Code Binding**: Code is bound to specific verifier via challenge
5. **Protection Against MITM**: Even if authorization code is intercepted, verifier is needed

### Attack Prevention

| Attack | How PKCE Protects |
|--------|-------------------|
| Authorization Code Interception | Attacker lacks code_verifier (SHA256 only known to original client) |
| Code Substitution | Challenge-verifier pair is unique to request |
| MITM Attack | code_verifier never in plaintext during transmission |
| Malicious App Injection | Only client that sent challenge can use verifier |

## 📊 Code Challenge Calculation

```javascript
// Client side
const verifier = generateRandomString(128); // alphanumeric + - _ ~
const challenge = base64url(sha256(verifier));

// Server side verification
const computed = base64url(sha256(receivedVerifier));
if (computed === storedChallenge) {
  // ✓ Valid - issue tokens
}
```

## 🔄 Token Lifecycle

1. **Authorization Code**: 10 minutes (can use once)
2. **Access Token**: 1 hour (use for API calls)
3. **Refresh Token**: 7 days (renew access token)
4. **Logout**: Token blacklisted (can't reuse)

## 🚨 Common Mistakes

### ❌ Transmitting Verifier Plaintext
```javascript
// WRONG - verifier exposed
const code_challenge = verifier; // No, this defeats purpose!
```

### ❌ Weak Verifier
```javascript
// WRONG - not random enough
const verifier = '1234567890123456'; // Too predictable
```

### ❌ Wrong Challenge Method
```javascript
// WRONG - must use SHA256 for SPAs
const challenge = btoa(verifier); // This is plain, not sha256!
```

### ✓ Correct Implementation
```javascript
const verifier = generateRandomString(128);
const hashBuffer = await crypto.subtle.digest('SHA-256', encoder.encode(verifier));
const challenge = base64url(hashBuffer);
```

## 🧪 Testing Scenarios

### Scenario 1: Valid PKCE Flow
1. Generate verifier + challenge
2. Request auth code with challenge
3. Exchange code + verifier → Gets tokens ✓

### Scenario 2: Missing Code Verifier
1. Get authorization code
2. Try to exchange WITHOUT verifier → Fails ✗

### Scenario 3: Wrong Code Verifier
1. Generate verifier A, get code with challenge A
2. Try to exchange with verifier B → Fails ✗

### Scenario 4: Code Reuse
1. Exchange code + verifier → Get tokens
2. Reuse same code + verifier → Fails ✗

### Scenario 5: Expired Code
1. Get authorization code
2. Wait > 10 minutes
3. Try to exchange → Fails ✗

## 📈 Real-World Applications

### Google OAuth for SPAs
Google requires PKCE for all SPA applications. Callback doesn't include code directly anymore.

### GitHub OAuth
Recommended for apps without backend (PKCE-compatible).

### Multi-Provider Auth
Okta, Auth0, Microsoft Entra - all use PKCE for SPAs.

## 🔍 Key Differences from Basic OAuth

| Feature | Basic OAuth | PKCE OAuth |
|---------|-------------|-----------|
| Client Secret | Required | Not needed |
| Suitable for SPAs | No | Yes ✓ |
| Code Verifier | No | Yes ✓ |
| Code Challenge | No | Yes ✓ |
| Authorization Code Binding | Weak | Strong ✓ |
| Can be attacked by malware | Yes | No ✓ |

## 📚 RFC References

- **RFC 7636**: OAuth 2.0 Proof Key for Code Exchange (PKCE)
- **RFC 6234**: US Secure Hash and HMAC Algorithms
- **RFC 4648**: The Base16, Base32, and Base64 Data Encodings

## ✅ Checklist

- [ ] Understand PKCE vs standard OAuth
- [ ] Generate code_verifier correctly (128 chars)
- [ ] Calculate code_challenge using SHA256
- [ ] Request authorization code with challenge
- [ ] Exchange code + verifier for tokens
- [ ] Validate challenge-verifier pair on server
- [ ] Handle code expiration (10 min)
- [ ] Prevent code reuse
- [ ] Blacklist tokens on logout
- [ ] Test all attack scenarios

## 🐛 Troubleshooting

### "Invalid code_verifier"
- Ensure using exact same verifier that generated challenge
- Check SHA256 hashing is correct
- Verify base64url encoding (- _ instead of + /)

### "Authorization code expired"
- Code lasts 10 minutes
- If testing, ensure exchange within timeframe

### "Code already used"
- Authorization code can only be used once
- Generate new code if previous exchange failed

### "Invalid redirect_uri"
- redirect_uri in authorize must match token endpoint
- No trailing slashes


## 🎓 Learning Goals

By end of this module, you should understand:
1. Why PKCE is needed for SPAs
2. How code_verifier → code_challenge works
3. Complete authorization code flow
4. Server-side PKCE validation
5. Real-world attack prevention
6. When to use PKCE vs other patterns

## 📖 Further Resources

- [RFC 7636 - PKCE](https://tools.ietf.org/html/rfc7636)
- [OAuth 2.0 Security Best Practices](https://datatracker.ietf.org/doc/html/draft-ietf-oauth-security-topics)
- [Google OAuth 2.0 PKCE Implementation](https://developers.google.com/identity/protocols/oauth2/web-server)
- [Auth0 PKCE Guide](https://auth0.com/docs/get-started/authentication-and-authorization-flow/authorization-code-flow-with-proof-key-for-code-exchange-pkce)

