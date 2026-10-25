# JWT Access/Refresh Tokens - Deep Technical Dive

## JWT Structure

A JWT consists of three parts separated by dots:

```
eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJzdWIiOiIxMjM0NTY3ODkwIiwibmFtZSI6IkpvaG4gRG9lIiwiaWF0IjoxNTE2MjM5MDIyfQ.SflKxwRJSMeKKF2QT4fwpMeJf36POk6yJV_adQssw5c
```

### Part 1: Header
```json
{
  "alg": "HS256",
  "typ": "JWT"
}
```

### Part 2: Payload
```json
{
  "userId": "user-123",
  "email": "user@example.com",
  "type": "access",
  "iat": 1516239022,
  "exp": 1516242622
}
```

### Part 3: Signature
```
HMACSHA256(
  base64UrlEncode(header) + "." +
  base64UrlEncode(payload),
  secret
)
```

## Authentication Flow

### Registration to Protected API Call

```
1. User Registration → Get access + refresh tokens
2. Store tokens locally (refresh in httpOnly cookie, access in memory)
3. Make API request with "Authorization: Bearer <access_token>"
4. Server validates token signature and expiration
5. If expired, use refresh token to get new access token
6. Request succeeds with new token
```

## Security Strategies

### HS256 vs RS256

**HS256 (HMAC SHA256)**
- Same key for signing and verifying
- Simpler, faster
- Suitable for monolithic applications

**RS256 (RSA)**
- Different keys for signing (private) and verifying (public)
- Better for distributed systems
- Public key can be shared with third parties

### Token Expiry Strategy

- **Access Token**: 15 minutes (balances security and UX)
- **Refresh Token**: 7 days (reduces re-login frequency)
- **Token Rotation**: Optionally issue new refresh token on each refresh

## Pros and Cons

### Advantages
✅ Stateless - no server-side session storage
✅ Scalable - works across microservices
✅ Mobile-friendly - standard in modern APIs
✅ CORS-friendly - no cookie restrictions
✅ Self-contained - all info in token

### Disadvantages
❌ Token revocation requires server-side store
❌ Large payload increases bandwidth
❌ Cannot change permissions until new token issued
❌ Requires HTTPS for security
❌ Token theft possible (XSS via XSS attacks)

## Best Practices Checklist

1. Always use HTTPS (tokens are bearer tokens)
2. Keep access token short-lived (15-30 mins)
3. Keep refresh token longer-lived (7-90 days)
4. Validate signature on every request
5. Use strong secrets (>32 characters)
6. Store refresh token securely (HttpOnly cookie)
7. Implement rate limiting on auth endpoints
8. Log failed token validation attempts
9. Monitor for suspicious token usage patterns
10. Rotate secrets periodically
11. Use algorithm explicitly (avoid ES256 confusion)
12. Never include sensitive data (passwords, SSNs) in token
13. Implement JTI (JWT ID) for revocation if needed
14. Set proper header values (iat, exp, nbf)

