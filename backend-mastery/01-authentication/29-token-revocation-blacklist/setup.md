# Token Revocation Setup

## Installation

```bash
cd 29-token-revocation-blacklist
npm install express jsonwebtoken joi uuid crypto
```

## API Endpoints

### Revoke Token
```bash
curl -X POST http://localhost:3000/revoke \
  -H "Content-Type: application/json" \
  -d '{"token": "jwt_here", "reason": "logout"}'
```

### Logout
```bash
curl -X POST http://localhost:3000/logout \
  -H "Authorization: Bearer jwt_here"
```

### Get Revocation List
```bash
curl http://localhost:3000/revocation-list
```

### Cleanup Expired Tokens
```bash
curl -X POST http://localhost:3000/cleanup
```

## Middleware Integration

```javascript
app.use((req, res, next) => {
  const token = req.headers.authorization?.split(' ')[1];
  if (token && controller.isTokenBlacklisted(token)) {
    return res.status(401).json({ error: 'Token revoked' });
  }
  next();
});
```

## Production Setup

- Use Redis for large-scale systems
- Implement async revocation checks
- Set TTL on blacklist entries
- Monitor revocation rate
- Alert on suspicious patterns
