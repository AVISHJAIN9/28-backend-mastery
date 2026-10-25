# JWT Key Rotation Deep Dive

## JWT Structure with Key ID

```
Header: { alg: "RS256", typ: "JWT", kid: "key_id_123" }
Payload: { userId: "123", email: "user@example.com", iat: 1234567890 }
Signature: RSASHA256(header + payload)
```

## Rotation Strategy

### Timeline-Based Rotation
```
Day 0:  New key generated → Active
Day 90: Grace period starts
Day 91: Key marked deprecated
Day 97: Key removed
```

### Key Versioning
```javascript
Key 1: Created Day 0, deprecated Day 90, retired Day 97
Key 2: Created Day 90, active, expires Day 180
Key 3: Created Day 180, active, expires Day 270
```

## Client-Side Validation

```javascript
// Client caches public keys with kid
const keyCache = {
  'kid_123': publicKey,
  'kid_124': publicKey
};

// Validate token
function validateToken(token) {
  const header = decodeHeader(token);
  const key = keyCache[header.kid];
  return jwt.verify(token, key);
}

// Update cache periodically
setInterval(() => {
  fetch('/keys/public').then(res => {
    keyCache = res.keys;
  });
}, 3600000); // every hour
```

## JWKS (JSON Web Key Set) Endpoint

```json
{
  "keys": [
    {
      "kid": "key_id_123",
      "kty": "RSA",
      "alg": "RS256",
      "use": "sig",
      "status": "active",
      "n": "base64-encoded-modulus",
      "e": "AQAB"
    }
  ]
}
```

## Security Considerations

1. **Key Storage**: Store private keys securely (not in source code)
2. **Key Generation**: Use crypto-grade random number generation
3. **Key Lifespan**: Balance between security and compatibility
4. **Grace Period**: Allow time for clients to update caches
5. **Monitoring**: Alert on failed rotations
6. **Backup**: Maintain previous keys for grace period

## Troubleshooting

- **"Invalid Signature"**: Client using old key cache, needs refresh
- **"Key Not Found"**: Grace period expired, keys cleaned up too early
- **Token Validation Failures**: Verify key timestamp matches token issue time
