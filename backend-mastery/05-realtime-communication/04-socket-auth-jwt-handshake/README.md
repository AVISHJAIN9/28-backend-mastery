# Socket Authentication & JWT

## Secure WebSocket Connections

Implement JWT-based authentication for Socket.io connections.

### Features
- Token validation on connect
- Token refresh mechanism
- User context propagation
- Secure handshake

### Best Practices
- Use HTTPS/WSS only
- Short token expiry
- Rotate refresh tokens
- Store securely on client