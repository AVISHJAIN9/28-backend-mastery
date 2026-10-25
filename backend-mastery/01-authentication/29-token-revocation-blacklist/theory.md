# Token Revocation Strategy

## Blacklist vs Whitelist

### Blacklist Approach (Revocation)
- Start: All tokens valid
- On revocation: Add token to blacklist
- Check: Is token in blacklist?
- Pros: Scales well, efficient for few revocations
- Cons: Requires checking on every request

### Whitelist Approach  
- Start: No tokens valid
- On issue: Add token to whitelist
- Check: Is token in whitelist?
- Pros: Explicit control
- Cons: Doesn't scale for many tokens

## Implementation Patterns

### In-Memory Blacklist (Demo)
```javascript
const blacklist = new Set();

function revokeToken(token) {
  blacklist.add(token);
}

function isRevoked(token) {
  return blacklist.has(token);
}
```

### Redis Blacklist (Production)
```javascript
async function revokeToken(token, ttl) {
  const hash = crypto.createHash('sha256').update(token).digest('hex');
  await redis.setex(`blacklist:${hash}`, ttl, true);
}

async function isRevoked(token) {
  const hash = crypto.createHash('sha256').update(token).digest('hex');
  return await redis.exists(`blacklist:${hash}`);
}
```

### Database Blacklist
```sql
CREATE TABLE token_blacklist (
  token_hash VARCHAR(64) PRIMARY KEY,
  revoked_at TIMESTAMP,
  expires_at TIMESTAMP,
  reason VARCHAR(50)
);

CREATE INDEX idx_expires ON token_blacklist(expires_at);
```

## Revocation Reasons

- **logout**: User requested logout
- **compromised**: Token suspected compromised
- **permission_change**: User permissions changed
- **force_reauth**: Force re-authentication needed
- **admin_action**: Administrator revoked
- **session_timeout**: Session timed out
- **device_logout**: Device-specific logout

## Cleanup Strategies

### TTL-Based
Automatically remove tokens after TTL expires

### Scheduled Cleanup
```javascript
setInterval(() => {
  removeExpiredTokens();
}, 3600000); // hourly
```

### LRU Eviction
Remove oldest entries when limit reached

## Performance Considerations

- Hash tokens to save memory
- Use Redis for distributed systems
- Implement async revocation checks
- Monitor blacklist size
- Clean up regularly
