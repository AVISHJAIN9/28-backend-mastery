# OAuth 2.0 & OpenID Connect - Deep Technical Dive

## OAuth 2.0 Protocol Flow

### Authorization Code Flow (Most Common)

```
┌─────────────────────────────────────────────────────────────┐
│ Client (Your App)                                           │
│ ┌──────────────────────────────────────────────────────┐   │
│ │ Step 1: User clicks "Login with Google"              │   │
│ └──────────────────────────────────────────────────────┘   │
└──────────────────────┬──────────────────────────────────────┘
                       │
                       │ Step 2: Redirect to Google Authorization Server
                       │ https://accounts.google.com/o/oauth2/v2/auth
                       │ ?client_id=...&redirect_uri=...&state=...
                       ▼
┌─────────────────────────────────────────────────────────────┐
│ Google Authorization Server                                  │
│ ┌──────────────────────────────────────────────────────┐   │
│ │ Step 3: User logs in and grants permission           │   │
│ └──────────────────────────────────────────────────────┘   │
└──────────────────────┬──────────────────────────────────────┘
                       │
                       │ Step 4: Redirect back to callback
                       │ YOUR_CALLBACK?code=AUTH_CODE&state=...
                       ▼
┌─────────────────────────────────────────────────────────────┐
│ Your Backend Server                                          │
│ ┌──────────────────────────────────────────────────────┐   │
│ │ Step 5: Exchange code for token (server-to-server)   │   │
│ │ Use client_secret (NEVER exposed to client)          │   │
│ └──────────────────────────────────────────────────────┘   │
└──────────────────────┬──────────────────────────────────────┘
                       │
                       │ Step 6: Receive ID Token (JWT)
                       ▼
                  ┌─────────────────┐
                  │ Create/Update   │
                  │ User in DB      │
                  │ Issue JWT Tokens│
                  └────────┬────────┘
                           │
                           ▼
            Redirect Client to App with Tokens
```

## CSRF Protection with State

```
Client Application:
1. Generate random state token: state = randomBytes(32).toString('hex')
2. Store state in session/localStorage
3. Redirect to Google with state in URL
4. Google redirects back with same state
5. Verify state matches stored value
6. If mismatch -> CSRF attack -> reject

Example:
- Request: https://accounts.google.com/...&state=abc123xyz
- Response: YOUR_CALLBACK?code=AUTH_CODE&state=abc123xyz
- Verify: localStorage.state === abc123xyz ✓
```

## ID Token Structure (JWT)

```
Header:
{
  "alg": "RS256",
  "kid": "abc123"
}

Payload:
{
  "iss": "https://accounts.google.com",
  "azp": "CLIENT_ID.apps.googleusercontent.com",
  "aud": "CLIENT_ID.apps.googleusercontent.com",
  "sub": "110169179..."  // Google User ID
  "email": "user@example.com",
  "email_verified": true,
  "iat": 1516239022,
  "exp": 1516242622,
  "nonce": "...",  // For OIDC
  "picture": "https://..."
}

Signature:
RS256(base64urlEncode(header) + "." + base64urlEncode(payload), public_key)
```

## Account Linking Strategy

### Option 1: Email-based Linking
```
User A logs in with Google (email: jane@example.com)
-> Create account

Later, user tries to login with GitHub (email: jane@example.com)
-> Check if account with this email exists
-> If exists, ask user to confirm linking
-> Link GitHub ID to same account
```

### Option 2: Explicit Linking
```
User logs in with Google
User goes to Settings -> Link Accounts
User clicks "Link GitHub"
-> Performs GitHub OAuth flow
-> Links GitHub ID to existing account
```

### Option 3: Post-Login Linking
```
User logs in with Google for first time
-> Ask "Want to link other accounts?"
-> Provide options to link GitHub, Facebook, etc.
```

## Multi-Provider User Model

```javascript
{
  id: "user-123",
  email: "jane@example.com",
  name: "Jane Doe",
  picture: "...",
  
  // OAuth Provider IDs
  googleId: "110169179...",
  githubId: "12345678",
  facebookId: "...",
  
  // Metadata
  primaryProvider: "google",  // First login
  linkedProviders: ["google", "github"],
  createdAt: "2024-01-01",
  lastLogin: "2024-01-15"
}
```

## Security Considerations

### HS256 vs RS256 for ID Tokens

**RS256 (Google uses this)**
- Public key for verification (can be cached)
- Private key kept secret (only at Google)
- Suitable for third-party verification

**HS256**
- Symmetric key (less suitable for OAuth)
- Both parties need same secret
- Not ideal when verifying tokens from external provider

### PKCE (Proof Key for Code Exchange)

For public clients (SPAs, mobile apps):
```
1. Generate code_verifier = random(128 bytes)
2. Create code_challenge = base64url(sha256(code_verifier))
3. Send authorization request with code_challenge
4. Google returns auth code
5. Exchange code with code_verifier
6. Google verifies: sha256(code_verifier) == code_challenge
```

### Token Binding

To prevent authorization code interception:
```
1. Generate unique binding token
2. Store in browser/app
3. Include in token exchange
4. Server verifies binding token
5. Prevents code reuse from other devices
```

## Refresh Token Handling

```javascript
// Google doesn't always return refresh tokens
// Only returns if:
1. access_type=offline in auth request
2. User authorizes offline access
3. First-time authorization

// If you need offline access:
POST https://oauth2.googleapis.com/token?
  code=AUTH_CODE&
  client_id=...&
  client_secret=...&
  redirect_uri=...&
  access_type=offline&
  prompt=consent  // Force consent dialog
```

## Common Attack Vectors

### Authorization Code Interception
- Attacker intercepts auth code from redirect
- Mitigation: Use HTTPS, short code expiry, code_challenge (PKCE)

### State Parameter Forgery
- Attacker forges state parameter
- Mitigation: Validate state cryptographically

### Token Leakage
- Tokens exposed in URLs/logs
- Mitigation: Use POST, secure storage, HTTPS

### Provider Impersonation
- Attacker creates fake OAuth provider
- Mitigation: Validate provider certificates

## Compliance & Security

- **GDPR**: Request only necessary scopes (privacy by design)
- **SOC 2**: Audit logging for OAuth events
- **PCI-DSS**: Never store raw tokens (if handling financial data)
- **OAuth 2.1**: Updated standard addressing security issues

