# Socket.io Authentication & JWT Theory

## Why Authentication Matters

WebSocket connections bypass normal HTTP request cycle, so they need explicit authentication:

```
Traditional HTTP
GET /api/data HTTP/1.1
Authorization: Bearer JWT_TOKEN
→ Middleware validates token
→ Route handler checks auth
→ Response sent

WebSocket
socket.connect()
→ No Authorization header in handshake
→ Must validate in Socket.io middleware
→ Connection proceeds or denies
```

## JWT (JSON Web Tokens)

### Structure
```
Header.Payload.Signature

header: { "alg": "HS256", "typ": "JWT" }
payload: { "userId": "123", "iat": 1234567890, "exp": 1234571490 }
signature: HMACSHA256(header + payload, secret)
```

### Token Lifecycle
```
1. User logs in with credentials
                ↓
2. Server generates JWT with expiry
                ↓
3. Client stores JWT (localStorage/sessionStorage)
                ↓
4. Client sends JWT in Socket.io auth header
                ↓
5. Server verifies signature and expiry
                ↓
6. Socket connection allowed or denied
                ↓
7. JWT expires after time limit
                ↓
8. Client requests new token (refresh token)
```

## Socket.io Authentication Flow

### Handshake Process
```javascript
// Client
const socket = io('http://server.com', {
  auth: {
    token: 'eyJhbGc...'
  }
});

// Server
io.use((socket, next) => {
  const token = socket.handshake.auth.token;
  
  if (!token) {
    return next(new Error('Auth required'));
  }
  
  try {
    const decoded = jwt.verify(token, secret);
    socket.userId = decoded.userId;
    next(); // Allow connection
  } catch(error) {
    next(new Error('Invalid token')); // Deny connection
  }
});

io.on('connection', (socket) => {
  console.log('User connected:', socket.userId);
});
```

## Token Refresh Strategy

### Problem
JWT tokens expire. After expiry, connection remains active but becomes unauthorized.

### Solution 1: Expire Everything
```
Expiry: 1 hour
Client: Reconnect every 50 minutes with new token
Pros: Simple
Cons: Frequent reconnections, session loss
```

### Solution 2: Refresh Token
```
Access Token: 15 minutes (short-lived)
Refresh Token: 7 days (long-lived)

Flow:
1. Access token sent in auth header
2. On expiry, client requests new access token using refresh token
3. Refresh token stored securely (HttpOnly cookie)
4. Updated access token sent, continues connection
```

### Implementation
```javascript
// Server
socket.on('token:refresh', (oldToken, callback) => {
  try {
    const decoded = jwt.decode(oldToken);
    const newToken = jwt.sign(
      { userId: decoded.userId },
      secret,
      { expiresIn: '15m' }
    );
    callback({ token: newToken });
  } catch(error) {
    callback({ error: 'Invalid token' });
  }
});

// Client
setInterval(() => {
  socket.emit('token:refresh', currentToken, (response) => {
    if (response.token) {
      currentToken = response.token;
    } else {
      // Redirect to login
      window.location.href = '/login';
    }
  });
}, 10 * 60 * 1000); // Every 10 minutes
```

## Security Considerations

### 1. Token Storage
```
❌ localStorage - XSS vulnerability
❌ sessionStorage - XSS vulnerability
✅ HttpOnly Cookie - Cannot access via JS (XSS safe)
✅ Memory - Lost on page refresh
✅ Encrypted localStorage - Better than plain
```

### 2. Token Transmission
```
❌ Query parameter: socket.io('?token=xyz')
❌ Custom header (HTTP): Limited support
✅ Auth object: socket.io({auth: {token}})
✅ HttpOnly cookie: Most secure
```

### 3. CSRF Prevention
```javascript
// Include CSRF token in JWT payload
jwt.sign({
  userId: user.id,
  csrfToken: generateToken()
}, secret);

// Verify on Socket.io connection
socket.handshake.auth.csrfToken === socket.handshake.headers['x-csrf-token']
```

### 4. Token Expiry
```
Too short (5 min): Frequent reconnections, bad UX
Too long (1 year): Compromised token remains valid
Optimal: 15-60 minutes for access token
```

## Multi-Device Scenarios

### Problem
Same user on multiple devices (phone, laptop, tablet) = multiple tokens
Logging out on one device shouldn't affect others

### Solution 1: Device ID in Token
```javascript
jwt.sign({
  userId: '123',
  deviceId: 'device_abc123'
}, secret);
```

### Solution 2: Token Blacklist
```javascript
// When user logs out
const tokenBlacklist = new Set();
tokenBlacklist.add(token);

// On connection
io.use((socket, next) => {
  if (tokenBlacklist.has(socket.handshake.auth.token)) {
    return next(new Error('Token revoked'));
  }
  next();
});
```

## OAuth2 Integration

### With OAuth2 Providers (Google, GitHub)
```
1. User logs in via OAuth on website
2. Server generates JWT based on OAuth profile
3. JWT sent to client
4. Client uses JWT for WebSocket auth
5. Socket connection established
```

## Common Pitfalls

❌ **Storing token in query string** - Visible in logs
❌ **No HTTPS/WSS** - Token intercepted in transit
❌ **No token expiry** - Stale tokens remain valid
❌ **Validating only on connect** - Should validate each critical action
❌ **Not handling token refresh** - Connection hangs on expiry
❌ **Same token for all devices** - Security risk
❌ **No rate limiting** - Brute force JWT attacks
❌ **Weak signing key** - Easy to forge tokens

## Best Practices

✅ Use HTTPS/WSS always (never WS)
✅ Keep signing key secret and strong
✅ Short token expiry (15-60 minutes)
✅ Use refresh tokens for long sessions
✅ Store tokens in HttpOnly cookies when possible
✅ Validate token on critical operations
✅ Implement token blacklist for logout
✅ Use strong cryptographic algorithms (HS256+)
✅ Include user constraints in token (deviceId, etc)
✅ Log authentication failures for security monitoring
