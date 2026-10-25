# Module 10: Session Management with Redis

## Overview

**Sessions** are crucial for maintaining user state across HTTP requests. This module demonstrates how Redis provides a fast, distributed session store that solves the limitations of in-memory server sessions and is far more scalable than database-backed sessions.

## The Problem: Why Sessions Are Hard

### Traditional In-Memory Sessions
```javascript
// Problematic approach
const sessions = {};  // Stored in Node.js process memory

app.post('/login', (req, res) => {
  const userId = authenticateUser(req.body);
  sessions[generateSessionId()] = { userId, createdAt: Date.now() };
  res.json({ sessionId });
});
```

**Problems:**
- Sessions lost on server restart
- Cannot scale across multiple servers
- Memory fills up with old sessions
- No easy way to invalidate sessions
- No audit trail of sessions

### Database Sessions
```javascript
// Better but slow
app.post('/login', (req, res) => {
  const userId = authenticateUser(req.body);
  db.collection('sessions').insertOne({
    sessionId: generateSessionId(),
    userId: userId,
    createdAt: new Date()
  });
  res.json({ sessionId });
});
```

**Problems:**
- Database query on every request (50-200ms latency per request)
- Database becomes a bottleneck
- Complex queries for session cleanup
- Poor performance at scale (1M+ users)

### Redis Sessions (BEST APPROACH)
```javascript
// Fast, distributed, scalable
app.post('/login', (req, res) => {
  const userId = authenticateUser(req.body);
  const sessionId = generateSessionId();
  const sessionData = {
    userId: userId,
    createdAt: Date.now(),
    lastActivityTime: Date.now(),
    ipAddress: req.ip,
    userAgent: req.headers['user-agent']
  };
  
  // Store in Redis with automatic expiration
  await redis.setex(
    `session:${sessionId}`,
    1800,  // 30 minute TTL
    JSON.stringify(sessionData)
  );
  
  res.json({ sessionId });
});
```

**Benefits:**
- **Speed:** <5ms per lookup (1000x faster than DB)
- **Scalability:** Handles millions of concurrent sessions
- **Automatic cleanup:** Built-in TTL expires old sessions
- **Distributed:** Works across multiple servers
- **Flexible:** Store any JSON data
- **Security:** No session data in client memory
- **Auditability:** Easy to log session events

---

## Core Concepts

### 1. Session Lifecycle

```
┌─────────────┬──────────────┬──────────────┬──────────────┐
│  Session    │  Active      │  Idle        │  Expired     │
│  Created    │  Usage       │  Timeout     │  Cleanup     │
└─────────────┴──────────────┴──────────────┴──────────────┘
    T=0          T=1...N        T=N+5min       T=30+min

Time:  User logs in → Uses app → No activity → Auto-cleanup
```

### 2. Session Storage Structure

```redis
# Key: session:{sessionId}
# Value: JSON object with user data
redis> SET session:abc123xyz '{"userId":123,"role":"admin","loginTime":1700000000}' EX 1800
OK

# Related keys for tracking
redis> SET session:user:{userId}:active:{sessionId} '' EX 1800
OK

redis> INCR session:metrics:active_sessions
=> 1
```

### 3. Session Expiration Strategies

#### **Strategy 1: Absolute Timeout (Hard Limit)**
```javascript
// Session expires after N minutes regardless of activity
const TTL = 30 * 60;  // 30 minutes

async function createSession(userId) {
  const sessionId = generateId();
  await redis.setex(
    `session:${sessionId}`,
    TTL,
    JSON.stringify({ userId, createdAt: Date.now() })
  );
  return sessionId;
}

// Result: User logged out after 30 minutes
// Use Case: Banking, sensitive data, high-security apps
```

**Pros:**
- Simple, predictable security
- User cannot stay logged in indefinitely
- Good for public computers

**Cons:**
- User gets logged out during active use
- Frustrating UX for long tasks
- Cold laptop login → 5 min later → logged out

#### **Strategy 2: Idle Timeout (Activity-Based)**
```javascript
// Session expires if no activity for N minutes
const IDLE_TIMEOUT = 15 * 60;  // 15 minutes inactivity

async function refreshSessionIfActive(sessionId) {
  const session = await redis.get(`session:${sessionId}`);
  
  if (session) {
    // Reset TTL - extends session by 15 more minutes
    await redis.expire(`session:${sessionId}`, IDLE_TIMEOUT);
    return JSON.parse(session);
  }
  
  throw new Error('Session expired');
}

// Result: Session extends while user is active
// Use Case: Most web applications (Gmail, Twitter)
```

**Pros:**
- User stays logged in while active
- Natural logout on abandonment
- Good UX for normal usage

**Cons:**
- User might think they're logged out (stale page)
- Potential vulnerability if device left unattended

#### **Strategy 3: Rolling Expiration (Best UX)**
```javascript
// Extend session on every request, up to max age
const IDLE_TIMEOUT = 15 * 60;      // 15 min no activity
const MAX_SESSION_AGE = 8 * 60 * 60;  // 8 hour max

async function refreshSessionRolling(sessionId) {
  const sessionKey = `session:${sessionId}`;
  const session = await redis.get(sessionKey);
  
  if (!session) throw new Error('Session expired');
  
  const data = JSON.parse(session);
  const sessionAge = Date.now() - data.createdAt;
  
  // If beyond max age, force logout
  if (sessionAge > MAX_SESSION_AGE) {
    await redis.del(sessionKey);
    throw new Error('Session expired (max age exceeded)');
  }
  
  // Reset TTL to extend by idle timeout
  await redis.expire(sessionKey, IDLE_TIMEOUT);
  
  return data;
}

// Result: User stays logged in while active, max 8 hours
// Use Case: SaaS applications, dashboards, collaborative tools
```

**Pros:**
- Best UX (user never surprised by logout)
- Security-aware (max age prevents indefinite login)
- Works with long-running operations
- Standard for modern web apps

**Cons:**
- Slightly more complex logic
- Two time parameters to tune

---

## Advanced: Distributed Sessions

### Issue: Multi-Server Sessions
```
┌─────────────┐      ┌─────────────┐
│  Server 1   │      │  Server 2   │
│ Memory: {}  │      │ Memory: {}  │
└─────────────┘      └─────────────┘
      ↑                    ↑
      └────────┬───────────┘
             Router
```

**Problem:** If Session A is created on Server 1, and request comes to Server 2, session is not found!

### Solution: Shared Redis
```
┌─────────────┐      ┌─────────────┐
│  Server 1   │      │  Server 2   │
└─────────────┘      └─────────────┘
      ↑                    ↑
      └────────┬───────────┘
               ↓
          ┌────────────┐
          │   Redis    │
          │  Sessions  │
          └────────────┘
```

**Implementation:**
```javascript
// Server 1: Create session
const sessionId = 'abc123';
await redis.setex(`session:${sessionId}`, 1800, 
  JSON.stringify({ userId: 42 }));

// Server 2: Read same session immediately
const session = await redis.get(`session:${sessionId}`);
// Result: { userId: 42 } ✅
```

---

## Security Considerations

### 1. Session ID Generation
```javascript
// VULNERABLE: Predictable IDs
const sessionId = `${Date.now()}-${Math.random()}`;

// SECURE: Cryptographically random
const crypto = require('crypto');
const sessionId = crypto.randomBytes(32).toString('hex');
// Produces: "5f8a2c9e1d4b7a3f6e2c9b4d1a7f3e5a"
```

### 2. Sensitive Data in Sessions
```javascript
// VULNERABLE: Store passwords/credit cards
redis.setex(`session:abc123`, 1800, JSON.stringify({
  userId: 123,
  password: 'secret123',  // ❌ NEVER!
  creditCard: '4111-1111-1111-1111'  // ❌ NEVER!
}));

// SECURE: Store only references
redis.setex(`session:abc123`, 1800, JSON.stringify({
  userId: 123,
  authenticated: true,
  roles: ['admin', 'editor'],
  loginTime: Date.now()
}));
```

### 3. Session Fixation Attack Prevention
```javascript
// VULNERABLE: Same session ID across login
const session = { userId: null, ipAddress: req.ip };
const sessionId = req.cookies.sessionId;  // Use client's session
// Attacker sets user's session ID → user logs in → attacker uses same ID

// SECURE: Generate new session after login
const oldSessionId = req.cookies.sessionId;
if (oldSessionId) {
  await redis.del(`session:${oldSessionId}`);  // Invalidate old
}

const newSessionId = crypto.randomBytes(32).toString('hex');
await redis.setex(`session:${newSessionId}`, 1800, 
  JSON.stringify({ userId: authenticatedUserId, loginTime: Date.now() }));

res.cookie('sessionId', newSessionId);
```

### 4. CSRF Protection with Sessions
```javascript
// Generate CSRF token per session
const csrfToken = crypto.randomBytes(32).toString('hex');
await redis.setex(`csrf:${sessionId}`, 1800, csrfToken);

// Validate on state-changing requests
app.post('/api/transfer', (req, res) => {
  const sessionId = req.cookies.sessionId;
  const storedToken = await redis.get(`csrf:${sessionId}`);
  const providedToken = req.body.csrfToken;
  
  if (storedToken !== providedToken) {
    return res.status(403).json({ error: 'CSRF token invalid' });
  }
  
  // Process transfer...
});
```

---

## Implementation Patterns

### Pattern 1: Simple Session Store
```javascript
import redis from 'redis';

const redisClient = redis.createClient();

const getSession = async (sessionId) => {
  const session = await redisClient.get(`session:${sessionId}`);
  return session ? JSON.parse(session) : null;
};

const setSession = async (sessionId, data, ttl = 1800) => {
  await redisClient.setEx(
    `session:${sessionId}`,
    ttl,
    JSON.stringify(data)
  );
};

const deleteSession = async (sessionId) => {
  await redisClient.del(`session:${sessionId}`);
};

export default { getSession, setSession, deleteSession };
```

### Pattern 2: Session with Activity Tracking
```javascript
const createSessionWithTracking = async (userId, req) => {
  const sessionId = crypto.randomBytes(32).toString('hex');
  
  const sessionData = {
    userId,
    createdAt: Date.now(),
    lastActivityTime: Date.now(),
    ip: req.ip,
    userAgent: req.headers['user-agent'],
    device: parseDeviceInfo(req.headers['user-agent'])
  };
  
  // Store session
  await redisClient.setEx(`session:${sessionId}`, 1800, 
    JSON.stringify(sessionData));
  
  // Track user's active sessions
  await redisClient.sAdd(`user:${userId}:sessions`, sessionId);
  
  // Track active sessions count
  await redisClient.incr('stats:active_sessions');
  
  return sessionId;
};
```

### Pattern 3: Session with Device Limiting
```javascript
// Limit user to N concurrent sessions
const MAX_SESSIONS_PER_USER = 3;

const createSessionWithLimit = async (userId, req) => {
  const sessionId = crypto.randomBytes(32).toString('hex');
  
  // Get user's active sessions
  const activeSessions = await redisClient.sMembers(
    `user:${userId}:sessions`
  );
  
  // If at limit, remove oldest
  if (activeSessions.length >= MAX_SESSIONS_PER_USER) {
    const oldestSessionId = activeSessions[0];
    await redisClient.del(`session:${oldestSessionId}`);
    await redisClient.sRem(`user:${userId}:sessions`, oldestSessionId);
  }
  
  // Create new session
  const sessionData = {
    userId,
    createdAt: Date.now(),
    device: parseDeviceInfo(req.headers['user-agent'])
  };
  
  await redisClient.setEx(`session:${sessionId}`, 1800,
    JSON.stringify(sessionData));
  await redisClient.sAdd(`user:${userId}:sessions`, sessionId);
  
  return sessionId;
};
```

### Pattern 4: Distributed Session Synchronization
```javascript
// When user logs out, invalidate all their sessions
const logoutAllDevices = async (userId) => {
  const activeSessions = await redisClient.sMembers(
    `user:${userId}:sessions`
  );
  
  for (const sessionId of activeSessions) {
    await redisClient.del(`session:${sessionId}`);
  }
  
  await redisClient.del(`user:${userId}:sessions`);
};

// When password changed, invalidate all sessions
const invalidateAllSessions = async (userId) => {
  await logoutAllDevices(userId);
};
```

---

## Real-World Example: E-Commerce Session Management

```javascript
const handleLogin = async (email, password, req, res) => {
  // Authenticate
  const user = await db.users.findOne({ email });
  if (!user || !verifyPassword(password, user.passwordHash)) {
    return res.status(401).json({ error: 'Invalid credentials' });
  }
  
  // Create session
  const sessionId = crypto.randomBytes(32).toString('hex');
  const sessionData = {
    userId: user.id,
    email: user.email,
    role: user.role,
    loginTime: Date.now(),
    ipAddress: req.ip,
    device: req.device,
    cartId: generateId(),  // Persist shopping cart
    preferences: user.preferences
  };
  
  await redis.setex(
    `session:${sessionId}`,
    8 * 60 * 60,  // 8 hour rolling expiration
    JSON.stringify(sessionData)
  );
  
  // Track active sessions
  await redis.sAdd(`user:${user.id}:sessions`, sessionId);
  await redis.incr('stats:active_users');
  
  // Set secure cookie
  res.cookie('sessionId', sessionId, {
    httpOnly: true,
    secure: process.env.NODE_ENV === 'production',
    sameSite: 'strict',
    maxAge: 8 * 60 * 60 * 1000  // 8 hours
  });
  
  res.json({ success: true, userId: user.id });
};

const verifySession = async (sessionId, req, res, next) => {
  const sessionData = await redis.get(`session:${sessionId}`);
  
  if (!sessionData) {
    return res.status(401).json({ error: 'Session expired' });
  }
  
  const session = JSON.parse(sessionData);
  
  // Refresh session TTL (rolling window)
  await redis.expire(`session:${sessionId}`, 8 * 60 * 60);
  
  // Attach session to request
  req.session = session;
  
  next();
};
```

---

## Performance Metrics

### Benchmarks

| Operation | Latency | DB Equivalent |
|-----------|---------|---------------|
| Session create | 2-5ms | 50-100ms |
| Session read | 1-3ms | 30-80ms |
| Session update | 2-4ms | 50-100ms |
| Session delete | 1-2ms | 20-50ms |
| **1M concurrent** | <100ms p99 | Database timeout |

### Scaling: Sessions Across Nodes

```
Single Redis:    100K concurrent sessions
Redis Cluster:   1M+ concurrent sessions
Redis Sentinel:  HA with automatic failover
```

---

## Monitoring Sessions

```javascript
// Count active sessions
const activeCount = await redis.sCard('stats:active_sessions');

// Get user's active sessions
const userSessions = await redis.sMembers(`user:${userId}:sessions`);

// Session creation rate (last hour)
const createdLastHour = await redis.get('stats:sessions_created_1h');

// Most active time of day
const peakHour = await redis.hGetAll('stats:sessions_by_hour');

// Session distribution by device
const byDevice = await redis.hGetAll('stats:sessions_by_device');
```

---

## Comparison: Session Storage Options

| Storage | Speed | Distributed | Persistence | Cost | Scalability |
|---------|-------|-------------|-------------|------|-------------|
| **In-Memory** | ⚡⚡⚡ | ❌ | ❌ | $$ | Limited |
| **Database** | ⚡ | ✅ | ✅ | $ | Limited |
| **Redis** | ⚡⚡⚡ | ✅ | Partial | $$ | Excellent |
| **Redis Cluster** | ⚡⚡ | ✅ | Partial | $$$ | Unlimited |

**Winner for Web Apps:** Redis or Redis Cluster

---

## Summary

- **Redis Sessions** replace database session overhead with <5ms lookups
- **Multiple strategies** (absolute, idle, rolling) for different security needs
- **Distributed** by nature - works across server farms
- **Simple to implement** - just store/retrieve JSON
- **Highly secure** when properly configured
- **Audit trail** - track logins, devices, activity
- **Automatic cleanup** - TTL expires stale sessions

Use Redis for:
✅ Production web applications  
✅ Multi-server deployments  
✅ High-traffic sites (1000+ req/s)  
✅ Session-heavy features (real-time, personalization)  
✅ Sensitive data access (banking, healthcare)  

---

## References

- RFC 6265 (HTTP State Management)
- OWASP Session Management Cheat Sheet
- Redis Persistence Guide
- Redis Cluster Specification

---

**Author:** Backend Mastery  
**Level:** Intermediate  
**Time to Complete:** 2-3 hours  
**Last Updated:** 2024
