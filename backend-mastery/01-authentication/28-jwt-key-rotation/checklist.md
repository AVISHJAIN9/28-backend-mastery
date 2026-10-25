# JWT Key Rotation Checklist

## Implementation

- [ ] Generate RSA key pairs (2048-bit minimum)
- [ ] Store private keys securely
- [ ] Create JWKS endpoint for public keys
- [ ] Add kid (key ID) to JWT header
- [ ] Implement key verification with kid
- [ ] Create key rotation logic
- [ ] Implement grace period for deprecated keys
- [ ] Add automatic key cleanup

## API Endpoints

- [ ] POST /keys/register - Register user
- [ ] POST /keys/verify - Verify token
- [ ] GET /keys/public - Get public keys
- [ ] GET /keys/active - Get active key info
- [ ] POST /keys/rotate - Rotate keys
- [ ] GET /keys/history - Rotation history
- [ ] GET /keys/audit - Validation audit log

## Testing

- [ ] Test token signing with current key
- [ ] Test token verification with deprecated key
- [ ] Test expired key rejection
- [ ] Test rotation workflow
- [ ] Test concurrent token validation
- [ ] Test grace period enforcement
- [ ] Test audit logging

## Security

- [ ] Never hardcode private keys
- [ ] Use environment variables for secrets
- [ ] Implement rate limiting on /keys/rotate
- [ ] Add admin authentication for rotation
- [ ] Log all key operations
- [ ] Monitor for unusual validation patterns
- [ ] Test key compromise scenarios
- [ ] Validate kid header before lookup

## Documentation

- [ ] API documentation with examples
- [ ] Key rotation procedure documentation
- [ ] Client integration guide
- [ ] Troubleshooting guide
