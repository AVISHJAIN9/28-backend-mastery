# Setup Guide: Email Queuing & Async Retry

## Prerequisites

- **Node.js**: v14+ (`node --version`)
- **npm**: v6+ (`npm --version`)
- **Terminal/CLI access**

## 1. Installation

### Install Node Packages

```bash
npm install
```

This installs all dependencies:
- **express** - Web server framework
- **cors** - Cross-origin request handling
- **helmet** - Security headers
- **dotenv** - Environment variable management
- **nodemailer** - Email sending (local SMTP support)
- **jsonwebtoken** - JWT token handling
- **express-rate-limit** - Rate limiting middleware

### Verify Installation

```bash
npm list
```

You should see all packages listed without errors.

## 2. Database/Storage Setup

### Option A: In-Memory (Default - No Setup Needed)

The module uses in-memory storage by default. Perfect for learning and testing.

- **Queue**: Stored in JavaScript objects
- **Dead Letter Queue**: In-memory list of failed jobs
- **Bounce Log**: In-memory bounce records
- **⚠️ Important**: Data is lost on server restart

### Option B: Redis (Production-Ready)

For persistent storage, Redis queue is recommended but optional for this learning module.

```bash
# Install Redis if not already installed
brew install redis  # macOS
# or
apt-get install redis-server  # Linux

# Start Redis server
redis-server

# Verify Redis is running
redis-cli ping
# Should output: PONG
```

Then update `.env`:
```env
QUEUE_PROVIDER=redis
REDIS_HOST=localhost
REDIS_PORT=6379
```

## 3. Environment Variables

### Create .env file

```bash
cp .env.example .env
```

### Configure .env

```env
# ==================== Server Configuration ====================
HTTP_PORT=4002
NODE_ENV=development

# ==================== Queue Configuration ====================
# Options: memory (default), redis, bull
QUEUE_PROVIDER=memory

# Redis (if using QUEUE_PROVIDER=redis)
REDIS_HOST=localhost
REDIS_PORT=6379
REDIS_PASSWORD=
REDIS_DB=0

# ==================== Email Provider ====================
# For local testing without actual SMTP
EMAIL_PROVIDER=nodemailer
SMTP_HOST=localhost
SMTP_PORT=1025  # MailDev default port
SMTP_USER=       # Leave empty for local testing
SMTP_PASSWORD=   # Leave empty for local testing
FROM_EMAIL=noreply@app.local

# ==================== Retry Configuration ====================
DEFAULT_BACKOFF_STRATEGY=exponential
DEFAULT_MAX_ATTEMPTS=5
DEFAULT_BASE_DELAY_MS=5000
MAX_DELAY_MS=3600000

# ==================== Bounce Handling ====================
VERIFY_WEBHOOKS=false
BOUNCE_WEBHOOK_SECRET=your-webhook-secret

# ==================== Monitoring ====================
LOG_LEVEL=info
AUDIT_ENABLED=true

# ==================== Security ====================
JWT_SECRET=your-jwt-secret-key
FRONTEND_URL=http://localhost:3000
```

**Key Settings Explained:**

| Setting | Purpose | Default |
|---------|---------|---------|
| `QUEUE_PROVIDER` | Where to store queue jobs | `memory` |
| `SMTP_HOST` | Email server hostname | `localhost` |
| `SMTP_PORT` | Email server port | `1025` |
| `DEFAULT_BACKOFF_STRATEGY` | Retry delay pattern | `exponential` |
| `DEFAULT_MAX_ATTEMPTS` | Max retries per email | `5` |
| `DEFAULT_BASE_DELAY_MS` | Initial retry delay (ms) | `5000` |

## 4. Local Email Testing (Optional but Recommended)

### Install MailDev for local email testing

MailDev creates a local SMTP server and web UI to view emails.

```bash
npm install -g maildev
```

### Start MailDev

```bash
maildev
```

Output:
```
MailDev App running at http://localhost:1080
```

**Note:** This window must stay open while testing.

In another terminal, start your server (see step 5).

## 5. Start the Server

### Development Mode (with auto-reload)

```bash
npm run dev
```

You should see:
```
=====================================
Module 02: Email Queuing & Async Retry
=====================================
Server running on port 4002
Health check: http://localhost:4002/health
API base: http://localhost:4002/api
=====================================
```

### Production Mode

```bash
npm start
```

### Verify Server is Running

```bash
curl http://localhost:4002/health
```

Expected response:
```json
{
  "status": "ok",
  "module": "02 Email Queuing & Async Retry (Redis/Bull)",
  "category": "26 Notifications Communication",
  "port": 4002,
  "features": ["queue-management", "exponential-backoff", "deadletter-queue", "bounce-handling"],
  "timestamp": "2024-12-01T10:30:45.123Z"
}
```

## 6. Frontend Testing

### Using React UI

```bash
cd .. && npm run dev
# Frontend runs on http://localhost:3000
# Navigate to http://localhost:3000 → Module 02 tab
```

### Using cURL

**Queue an Email:**
```bash
curl -X POST http://localhost:4002/api/queue/add \
  -H "Content-Type: application/json" \
  -d '{
    "recipientEmail": "test@example.com",
    "subject": "Test Email",
    "body": "<h1>Hello</h1><p>This is a test</p>",
    "priority": 5,
    "maxAttempts": 5,
    "backoffStrategy": "exponential"
  }'
```

**Process Queue:**
```bash
curl -X POST http://localhost:4002/api/queue/process \
  -H "Content-Type: application/json" \
  -d '{"maxJobs": 10}'
```

**Get Queue Stats:**
```bash
curl http://localhost:4002/api/queue/stats
```

**Get Jobs:**
```bash
curl 'http://localhost:4002/api/queue/jobs?status=queued&limit=10'
```

## 7. Troubleshooting

| Problem | Solution |
|---------|----------|
| Port 4002 already in use | Change `HTTP_PORT` in .env or kill process: `lsof -ti:4002 \| xargs kill` |
| Cannot connect to SMTP | Ensure MailDev is running (`maildev` in another terminal) |
| Emails not being sent | Check `SMTP_HOST` and `SMTP_PORT` in .env match MailDev settings |
| Rate limit errors | Reduce request frequency or increase `LIMIT` in middleware.js |
| Database errors | Stop server, delete queue data, restart |

## 8. Testing Checklist

- [ ] Server starts without errors (`npm run dev`)
- [ ] Health check works (`curl http://localhost:4002/health`)
- [ ] Can queue an email via API (`POST /api/queue/add`)
- [ ] Can process queue (`POST /api/queue/process`)
- [ ] Can view jobs (`GET /api/queue/stats`)
- [ ] Can trigger bounce webhook (`POST /api/bounces/webhook`)
- [ ] React UI loads at http://localhost:3000
- [ ] All tabs work (Queue, DLQ, Bounces, Monitor)

## 9. Common Issues & Solutions

### Issue: "Cannot find module 'express'"

**Solution:**
```bash
rm -rf node_modules package-lock.json
npm install
```

### Issue: EADDRINUSE error

**Solution:**
```bash
# macOS/Linux
lsof -ti:4002 | xargs kill -9

# Windows
netstat -ano | findstr :4002
taskkill /PID <PID> /F
```

Then restart server.

### Issue: Emails not visible in MailDev

**Solutions:**
1. Verify MailDev is running on port 1025
2. Check `.env` has `SMTP_PORT=1025`
3. Verify email is actually being sent via API
4. Check MailDev web UI: http://localhost:1080

### Issue: Queue jobs stuck in "processing"

**Solution:**
1. Check server logs for errors
2. Restart server
3. Jobs will reset to 'queued' state
4. Try processing again

## Next Steps

1. ✅ Complete all tests in checklist.md
2. ✅ Understand queue concepts from theory.md
3. ✅ Try all API endpoints manually
4. ✅ Test retry logic with intentional failures
5. ✅ Test dead letter queue recovery
6. ✅ Test bounce handling integration
7. ✅ Move to Module 03 (Push Notifications)

