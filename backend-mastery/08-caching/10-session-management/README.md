# Module 10: Session Management with Redis

## Overview

Sessions are the foundation of user authentication and personalization. This module demonstrates how **Redis provides sub-millisecond session lookups**, replacing slow database-backed sessions and unreliable in-memory storage.

## Learning Objectives

By completing this module, you will:
- Understand the limitations of in-memory and database sessions
- Master three session expiration strategies (absolute, idle, rolling)
- Implement secure session creation and validation
- Learn multi-device session management
- Handle session logout across distributed systems
- Optimize for performance and security
- Implement "logout all devices" functionality

## The Problem

### Traditional In-Memory Sessions
```javascript
const sessions = {};  // Lost on server restart
// Cannot scale across multiple servers
// Memory leaks from old sessions
```

### Database Sessions
```sql
SELECT * FROM sessions WHERE id = 'abc123';
-- 50-200ms per request
-- Database becomes bottleneck at scale
-- Complex cleanup queries
```

### Redis Sessions (SOLUTION)
```javascript
const session = await redis.get(`session:${id}`);
-- <5ms per request
-- Automatic TTL cleanup
-- Works across distributed systems
```

## Three Strategies

### 1. **Absolute Timeout**
- Session expires after N minutes regardless of activity
- **Best for:** Banking, healthcare, government (high security)
- **Latency:** Predictable
- **User frustration:** High (gets logged out during work)

### 2. **Idle Timeout**
- Session expires if no activity for N minutes
- **Best for:** Social media, email, communication apps
- **Latency:** Unpredictable (extends on access)
- **User frustration:** Moderate (abandoned sessions logged out)

### 3. **Rolling Expiration** (RECOMMENDED)
- Session extends on activity, but has maximum age
- **Best for:** SaaS, dashboards, e-commerce (best UX + security)
- **Latency:** Predictable + refreshable
- **User frustration:** Low (stays logged in while active)

## Quick Start

### 1. Installation
```bash
cd 10-session-management
npm install
cp .env.example .env
```

### 2. Start Backend
```bash
npm start
# Listening on http://localhost:6416
```

### 3. Test Sessions
```bash
# Create session (rolling expiration)
curl -X POST http://localhost:6416/api/session-rolling \
  -H "Content-Type: application/json" \
  -d '{"userId":"user123","email":"user@example.com"}'

# Response includes sessionId
# {
#   "success": true,
#   "sessionId": "5f8a2c9e...",
#   "session": { "userId": "user123", ... }
# }

# Get session details
curl http://localhost:6416/api/session/5f8a2c9e...

# Refresh session (rolling only)
curl -X POST http://localhost:6416/api/session/5f8a2c9e.../refresh

# Logout
curl -X POST http://localhost:6416/api/session/5f8a2c9e.../logout
```

## API Endpoints

### Create Session
```
POST /api/session-absolute    # 30-minute hard limit
POST /api/session-idle        # Extends on activity
POST /api/session-rolling     # Extends on activity, max 8 hours
```

### Manage Session
```
GET  /api/session/{id}        # Get session details
POST /api/session/{id}/refresh    # Refresh (rolling only)
POST /api/session/{id}/logout     # Logout single session
```

### Multi-Device Management
```
GET  /api/user/{userId}/sessions       # List all active sessions
POST /api/user/{userId}/logout-all     # Logout all devices
```

### Statistics
```
GET  /api/stats/sessions      # Active session count
POST /api/sessions/clear-all  # Clear all sessions (testing)
```

## Real-World Implementation

```javascript
// Express middleware for session validation
const requireSession = async (req, res, next) => {
  const sessionId = req.cookies.sessionId;
  const session = await redis.get(`session:${sessionId}`);
  
  if (!session) {
    return res.status(401).json({ error: 'Unauthorized' });
  }
  
  // Refresh session TTL (rolling)
  await redis.expire(`session:${sessionId}`, 900);
  
  req.session = JSON.parse(session);
  next();
};

// Protected route
app.get('/api/user/profile', requireSession, (req, res) => {
  res.json({ userId: req.session.userId });
});
```

## Performance Benchmarks

| Operation | Latency | Database (for comparison) |
|-----------|---------|---------------------------|
| Session create | 2-5ms | 50-100ms |
| Session read | 1-3ms | 30-80ms |
| Session refresh | 2-4ms | 50-100ms |
| 100K concurrent | <10ms | Timeout |

## Security Best Practices

### 1. Session ID Generation
```javascript
// ✅ Secure: Cryptographically random
const sessionId = crypto.randomBytes(32).toString('hex');

// ❌ Vulnerable: Predictable
const sessionId = `${Date.now()}-${Math.random()}`;
```

### 2. HTTPS Only
```javascript
res.cookie('sessionId', id, {
  httpOnly: true,      // ✅ Prevent XSS
  secure: true,        // ✅ HTTPS only
  sameSite: 'strict'   // ✅ CSRF protection
});
```

### 3. Never Store Sensitive Data
```javascript
// ❌ NEVER:
{ userId: 123, passwordHash: '...' }

// ✅ Instead:
{ userId: 123, authenticated: true, roles: ['admin'] }
```

### 4. Session Fixation Prevention
```javascript
// 1. Generate new session after login
const newSessionId = crypto.randomBytes(32).toString('hex');

// 2. Invalidate old session
await redis.del(`session:${oldSessionId}`);

// 3. Set new cookie
res.cookie('sessionId', newSessionId);
```

## Advanced: Multi-Device Management

```javascript
// Track all sessions by user
await redis.sAdd(`user:${userId}:sessions`, sessionId);

// Logout all devices
const allSessions = await redis.sMembers(`user:${userId}:sessions`);
for (const id of allSessions) {
  await redis.del(`session:${id}`);
}

// Password changed? Logout everywhere
await logoutAllSessions(userId);
```

## Module Structure

```
10-session-management/
├── theory.md              # Comprehensive guide (2K+ words)
├── server.js              # Express backend (3 strategies)
├── App.jsx                # React UI for testing
├── index.js               # React entry point
├── App.css                # Styling
├── package.json           # Dependencies
├── .env.example           # Environment template
├── index.html             # HTML entry point
├── README.md              # This file
├── setup.md               # Installation instructions
└── checklist.md           # Learning objectives
```

## Environment Variables

```bash
# Server
NODE_ENV=development
HTTP_PORT=6416

# Redis
REDIS_HOST=localhost
REDIS_PORT=6379

# Sessions
SESSION_TTL=1800          # Absolute timeout: 30 minutes
IDLE_TIMEOUT=900          # Idle timeout: 15 minutes
MAX_SESSION_AGE=28800     # Rolling max: 8 hours
```

## Testing Workflows

### Test 1: Absolute Timeout
```
1. Create session (absolute)
2. Get session (should work)
3. Wait 31 minutes
4. Get session (should fail - expired)
```

### Test 2: Idle Timeout
```
1. Create session (idle, 15-min timeout)
2. Get session (works)
3. Wait 16 minutes without activity
4. Get session (should fail - idle timeout)
```

### Test 3: Rolling Expiration (RECOMMENDED)
```
1. Create session (rolling)
2. Refresh every 10 minutes
3. Session extends each time
4. After 8 hours total → forced logout
```

### Test 4: Multi-Device
```
1. Create session 1 (user@device1)
2. Create session 2 (user@device2)
3. Get all sessions → Shows both
4. Logout all → Both sessions deleted
```

## Common Issues

| Issue | Solution |
|-------|----------|
| Sessions expire too quickly | Increase SESSION_TTL or IDLE_TIMEOUT |
| Sessions don't expire | Check Redis is running, TTL value |
| CORS errors | Verify backend port (6416) |
| Connection refused | Start Redis: `redis-server` |

## Next Steps

1. **Read theory.md** completely
2. **Test each strategy** using the React UI
3. **Implement refreshCredentials** in your app
4. **Add logout-all functionality** for security
5. **Monitor session count** in production
6. **Set up session analytics** (login trends, device types)

## Production Checklist

- [ ] Session IDs: Cryptographically random (32+ bytes)
- [ ] Cookies: httpOnly, Secure, sameSite=strict
- [ ] Backend: Validate session on every request
- [ ] Monitoring: Alert on unusual session patterns
- [ ] Cleanup: TTL expires old sessions automatically
- [ ] Backup: Redis persistence enabled
- [ ] Failover: Redis Sentinel or Cluster configured
- [ ] Compliance: GDPR session deletion on account closure

## References

- RFC 6265 (HTTP State Management)
- OWASP Session Management Cheat Sheet
- Redis Persistence Guide

---

**Author:** Backend Mastery  
**Level:** Intermediate  
**Time to Complete:** 2-3 hours  
**Last Updated:** 2024
