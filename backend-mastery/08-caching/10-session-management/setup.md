# Module 10: Session Management - Setup Guide

## Prerequisites

### System Requirements
- **Node.js:** 16.0.0 or higher
- **npm:** 8.0.0 or higher
- **Redis:** 6.0 or higher
- **RAM:** Minimum 2GB
- **Disk Space:** 200MB

### Verify Installation
```bash
node --version    # v16+ required
npm --version     # 8.0+ required
redis-cli ping    # Should return PONG
```

---

## Installation

### Step 1: Install Dependencies
```bash
cd 10-session-management
npm install
```

### Step 2: Configure Environment
```bash
cp .env.example .env
# Edit .env with your settings
```

### Step 3: Start Redis
```bash
# Option 1: System Redis
redis-server

# Option 2: Docker
docker run -d -p 6379:6379 redis:latest
```

### Step 4: Start Backend
```bash
npm start
# Expected: Server running on http://localhost:6416
```

---

## Quick Test

```bash
# Create session
curl -X POST http://localhost:6416/api/session-rolling \
  -H "Content-Type: application/json" \
  -d '{"userId":"user1","email":"user@test.com"}'

# Response:
# {
#   "success": true,
#   "sessionId": "...",
#   "session": { "userId": "user1", "email": "user@test.com" }
# }
```

---

## API Reference

### Create Session
```bash
# Absolute Timeout (30 min)
POST /api/session-absolute
Body: {"userId":"user1","email":"user@test.com"}

# Idle Timeout (15 min)
POST /api/session-idle
Body: {"userId":"user1","email":"user@test.com"}

# Rolling Expiration (15 min + max 8 hours)
POST /api/session-rolling
Body: {"userId":"user1","email":"user@test.com"}
```

### Manage Session
```bash
# Get session
GET /api/session/{sessionId}

# Refresh (rolling only)
POST /api/session/{sessionId}/refresh

# Logout
POST /api/session/{sessionId}/logout
```

### Multi-Device
```bash
# Get all sessions for user
GET /api/user/{userId}/sessions

# Logout all sessions
POST /api/user/{userId}/logout-all
```

---

## Port Configuration

**Default:** 6416

**Change port:**
```bash
HTTP_PORT=6417 npm start
```

---

## Environment Variables

```bash
# Session timeouts
SESSION_TTL=1800              # Absolute: 30 min
IDLE_TIMEOUT=900              # Idle: 15 min
MAX_SESSION_AGE=28800         # Rolling: 8 hours

# Redis
REDIS_HOST=localhost
REDIS_PORT=6379
```

---

## Troubleshooting

### Connection Refused
```bash
# Start Redis
redis-server

# Or check if running
redis-cli ping
```

### Port 6416 Already in Use
```bash
# Kill process
lsof -i :6416 | awk 'NR!=1 {print $2}' | xargs kill -9

# Or use different port
HTTP_PORT=6417 npm start
```

### Sessions Not Expiring
```bash
# Check Redis TTL
redis-cli TTL session:abc123

# Clear and restart
redis-cli FLUSHDB
npm start
```

---

## Testing Workflows

### Test Absolute Timeout
```bash
# Create session
sessionId=$(curl -s -X POST http://localhost:6416/api/session-absolute \
  -H "Content-Type: application/json" \
  -d '{"userId":"user1","email":"test@example.com"}' | jq -r '.sessionId')

# Check immediately (should exist)
curl http://localhost:6416/api/session/$sessionId

# Wait 31 minutes
sleep 1860

# Check again (should fail)
curl http://localhost:6416/api/session/$sessionId
```

### Test Rolling Expiration (Recommended)
```bash
# Create session
sessionId=$(curl -s -X POST http://localhost:6416/api/session-rolling \
  -H "Content-Type: application/json" \
  -d '{"userId":"user1","email":"test@example.com"}' | jq -r '.sessionId')

# Refresh periodically
curl -s -X POST http://localhost:6416/api/session/$sessionId/refresh

# Each refresh extends TTL by 15 minutes
# Max age is 8 hours regardless of refreshes
```

### Test Multi-Device
```bash
# Create session 1
curl -X POST http://localhost:6416/api/session-rolling \
  -H "Content-Type: application/json" \
  -d '{"userId":"user1","email":"device1@test.com"}'

# Create session 2 (same user)
curl -X POST http://localhost:6416/api/session-rolling \
  -H "Content-Type: application/json" \
  -d '{"userId":"user1","email":"device2@test.com"}'

# View both
curl http://localhost:6416/api/user/user1/sessions

# Logout all
curl -X POST http://localhost:6416/api/user/user1/logout-all
```

---

## Performance Tuning

### High Load (1000+ req/sec)
```bash
# Reduce TTL to decrease memory usage
SESSION_TTL=600           # 10 minutes
IDLE_TIMEOUT=300          # 5 minutes
MAX_SESSION_AGE=14400     # 4 hours
```

### Long Sessions (Finance, Healthcare)
```bash
# Extend timeouts
SESSION_TTL=3600          # 60 minutes
IDLE_TIMEOUT=1800         # 30 minutes
MAX_SESSION_AGE=86400     # 24 hours
```

### Standard Web App
```bash
# Default settings (already optimized)
SESSION_TTL=1800          # 30 minutes
IDLE_TIMEOUT=900          # 15 minutes
MAX_SESSION_AGE=28800     # 8 hours
```

---

## Redis Memory Monitoring

```bash
# Check Redis memory
redis-cli INFO memory

# See largest keys
redis-cli --bigkeys

# Monitor commands in real-time
redis-cli MONITOR
```

---

## Production Deployment

### Environment Variables
```bash
NODE_ENV=production
REDIS_HOST=redis.production.internal
REDIS_PASSWORD=secure_password_here
SESSION_TTL=3600
IDLE_TIMEOUT=1800
```

### Docker
```dockerfile
FROM node:18-alpine
WORKDIR /app
COPY package*.json ./
RUN npm ci --only=production
COPY . .
EXPOSE 6416
CMD ["node", "server.js"]
```

### Kubernetes
```yaml
apiVersion: apps/v1
kind: Deployment
metadata:
  name: session-service
spec:
  replicas: 3
  template:
    spec:
      containers:
      - name: session
        image: session-manager:latest
        ports:
        - containerPort: 6416
        env:
        - name: REDIS_HOST
          value: redis-service
```

---

## Monitoring & Alerts

### Key Metrics
- **Active sessions:** GET /api/stats/sessions
- **Session creation rate:** Custom instrumentation needed
- **Logout rate:** Custom instrumentation needed
- **Session timeout rate:** Track 401 responses

### Alert Triggers
- Session count > 1M (memory pressure)
- Average session lifetime < 5 min (timeout issues)
- Logout all rate > 100/min (security incident?)

---

## Common Scenarios

### Logout on Password Change
```javascript
const changePassword = async (userId) => {
  // Change password...
  
  // Logout all sessions
  await fetch(`/api/user/${userId}/logout-all`, { method: 'POST' });
};
```

### "Remember Me" Functionality
```javascript
// Extended TTL for persistent login
if (rememberMe) {
  SESSION_TTL = 30 * 24 * 60 * 60;  // 30 days
} else {
  SESSION_TTL = 1800;  // 30 minutes
}
```

### Device-Specific Limits
```javascript
// Limit user to 5 concurrent sessions
const MAX_SESSIONS = 5;

if (userSessions.length >= MAX_SESSIONS) {
  // Remove oldest session
  await removeOldestSession(userId);
}
```

---

## Verification Checklist

- [ ] Node.js 16+ installed
- [ ] npm 8+ installed
- [ ] Redis running
- [ ] Dependencies installed
- [ ] .env file created
- [ ] Backend starts without errors
- [ ] Health endpoint responds
- [ ] Can create session
- [ ] Can retrieve session
- [ ] Can refresh session
- [ ] Can logout session
- [ ] Can view all user sessions
- [ ] Sessions expire on time

---

## Next Steps

1. Read theory.md completely
2. Test each strategy with curl/Postman
3. Review React UI implementation
4. Test session refresh workflow
5. Implement in your application
6. Monitor metrics in production

---

**Module:** Session Management (10)  
**Difficulty:** Intermediate  
**Time:** 2-3 hours  
**Last Updated:** 2024
