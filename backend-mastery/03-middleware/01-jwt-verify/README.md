# JWT Verify Middleware

## What is this?
JWT (JSON Web Token) verification middleware handles token-based authentication. It generates, validates, and refreshes JWT tokens containing user claims for secure stateless authentication.

## Why does it matter?
- **Stateless Authentication**: No server-side session storage needed
- **Scalability**: Works across multiple servers without session sync
- **Security**: Cryptographically signed tokens can't be forged
- **Flexibility**: Can include custom claims (userId, role, permissions)
- **Mobile-Friendly**: Perfect for mobile apps and SPAs

## How it works (step by step)
1. User logs in with credentials
2. Server generates JWT with claims and signs with secret key
3. Client stores token (localStorage/memory)
4. Client sends token in Authorization header
5. Middleware decodes token using secret key
6. Signature validated - ensures token wasn't tampered
7. Expiration checked - ensures token still valid
8. Claims extracted and attached to req.user
9. Route handler accesses user info from req.user
10. On expiration, client uses refresh token to get new token

## Key concepts
- **JWT Structure**: Header.Payload.Signature
- **Claims**: Data encoded in token (userId, email, role)
- **Signature**: HMAC/RSA hash proving token authenticity
- **Expiration**: Prevents indefinite token validity
- **Refresh Token**: Long-lived token used to get new access token
- **Authorization Header**: "Bearer {token}" format

## Common mistakes
- Using weak secret keys
- Not validating token expiration
- Storing tokens insecurely (localStorage XSS risk)
- Not implementing refresh token rotation
- Exposing secret key in code
- Not using HTTPS in production

## Real world usage
```javascript
// Generate token on login
POST /auth/login
Body: { email: 'user@example.com', password: 'password' }
Response: { token: 'eyJhb...', expiresIn: '24h' }

// Use token on protected routes
GET /api/profile
Headers: { Authorization: 'Bearer eyJhb...' }
Response: { user: { id: '123', email: 'user@example.com' } }

// Refresh expired token
POST /auth/refresh
Body: { refreshToken: 'refresh_token_value' }
Response: { token: 'new_token' }
```
