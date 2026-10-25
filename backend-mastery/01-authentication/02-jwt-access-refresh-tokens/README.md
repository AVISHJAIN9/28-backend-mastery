# JWT Access/Refresh Tokens Authentication

## What is this?

JWT (JSON Web Token) Access/Refresh Token pattern is a stateless authentication mechanism where:
- **Access Token**: Short-lived token (15m) used to authenticate API requests
- **Refresh Token**: Long-lived token (7d) stored securely to obtain new access tokens without re-entering credentials

The pattern solves the problem of balancing security (short-lived tokens) with user experience (not requiring constant re-authentication).

## Why does it matter?

1. **Security**: Access tokens are short-lived, limiting damage if compromised
2. **Stateless**: No server-side session storage required
3. **Scalability**: Works perfectly with microservices and distributed systems
4. **Token Rotation**: Can implement token rotation for enhanced security
5. **Multiple Devices**: Users can be logged in on multiple devices independently
6. **Logout Control**: Refresh tokens can be invalidated for immediate logout

## How it works (step by step)

1. **Registration/Login**: User provides credentials → Server validates → Returns both access and refresh tokens
2. **API Requests**: Client includes access token in Authorization header → Server validates token expiry
3. **Token Expiry**: When access token expires (15m), client doesn't need to re-login
4. **Token Refresh**: Client sends refresh token → Server validates → Returns new access token
5. **Logout**: Server invalidates the refresh token → Cannot get new access tokens
6. **Security**: If only access token is stolen, attacker has limited time (15m) to use it

## Key concepts

- **JWT Structure**: Header.Payload.Signature (encoded in Base64)
- **Signature Verification**: Ensures token hasn't been tampered with
- **Token Claims**: Embedded data (userId, email, type, expiration)
- **Stateless**: No session database needed
- **Token Rotation**: Issue new refresh token on each refresh for security
- **CORS**: Properly handle preflight requests for token endpoints

## Common mistakes

1. **Long-lived Access Tokens**: Should be 15-30 minutes, not hours
2. **Not Validating Signature**: Always verify token signature
3. **Storing Tokens in URLs**: Use headers, not URL parameters
4. **No Refresh Token Validation**: Store refresh tokens server-side for revocation
5. **Sending Sensitive Data in Token**: Don't include passwords or credit cards
6. **Not Using HTTPS**: Tokens can be intercepted in transit
7. **HttpOnly Cookies Misunderstanding**: Consider using with cookies for better security
8. **Same Refresh Token Forever**: Implement token rotation on refresh

## Real world usage

- **Single Page Applications (SPAs)**: Perfect for React, Vue, Angular apps
- **Mobile Applications**: Native iOS/Android apps use JWT extensively
- **Microservices**: Each service can validate tokens independently
- **Third-party Integrations**: OAuth 2.0 uses similar patterns
- **API Authentication**: Standard for REST APIs
- **Multi-tenant Applications**: Include tenant info in token claims

## Implementation Details

### Token Storage Recommendations

**For SPAs:**
- Access Token: Memory or sessionStorage (automatic cleanup on refresh)
- Refresh Token: HttpOnly Cookie (protected from XSS)

**For Mobile:**
- Both tokens in Secure/Keychain storage

### Token Refresh Flow

```
1. Client makes API request with access token
2. Server returns 401 (token expired)
3. Client automatically sends refresh token to /auth/refresh
4. Server validates refresh token and issues new access token
5. Client retries original request with new token
```

### Logout from All Devices

```
1. Server maintains list of valid refresh tokens per user
2. On logout-all, invalidate all refresh tokens for user
3. All other devices can't refresh → automatic logout
```

## Security Best Practices

1. Use HTTPS always - tokens are bearer tokens
2. Keep access token expiry short (15-30 minutes)
3. Keep refresh token expiry longer (7-30 days)
4. Validate token signature on every request
5. Use strong secrets for signing
6. Rotate refresh tokens on each use (optional)
7. Store refresh tokens securely (HttpOnly cookies)
8. Implement rate limiting on token endpoints
9. Monitor token usage for suspicious patterns
10. Consider JWT algorithm carefully (HS256 vs RS256)

