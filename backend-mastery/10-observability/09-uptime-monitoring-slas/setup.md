# Setup Guide - Uptime Monitoring & SLAs

## Quick Start (5 minutes)

### 1. Install Dependencies

```bash
npm install
```

This installs:
- `express` - Web server
- `winston` - Logging
- `cors` - Cross-origin requests
- `helmet` - Security headers
- `dotenv` - Environment variables

### 2. Configure Environment

Copy the example environment file:

```bash
cp .env.example .env
```

Default settings (.env):
```
HTTP_PORT=4009
NODE_ENV=development
LOG_LEVEL=info
HEALTH_CHECK_INTERVAL=60000
SLO_TARGET=99.9
```

### 3. Start the Server

Development mode (with auto-reload):
```bash
npm run dev
```

Production mode:
```bash
npm start
```

Expected output:
```
✓ 09 Uptime Monitoring & SLAs running on http://localhost:4009
✓ Health check: http://localhost:4009/health
✓ API: http://localhost:4009/api
```

### 4. Test the API

Open browser and visit:

**Health Check:**
```
http://localhost:4009/health
```

**Root Endpoint:**
```
http://localhost:4009/
```

**Metrics:**
```
http://localhost:4009/api/metrics
```

**Status Page:**
```
http://localhost:4009/api/status
```

## Full Setup (with React UI)

### 1. Terminal 1 - Start Backend

```bash
cd 09-uptime-monitoring-slas
npm run dev
```

Wait for "Server running" message.

### 2. Terminal 2 - Build React

In the workspace root:

```bash
# Option A: If you have Node.js for React
npm run build

# Option B: Open preview.html in browser
open 09-uptime-monitoring-slas/preview.html
```

Then visit the URL shown (typically http://localhost:3000 or http://localhost:5173)

### 3. Test in React App

The React app at `/App.jsx` provides testing interface:

- **View Metrics** - See real-time SLI
- **Trigger Incident** - Simulate downtime
- **Check Status** - View status page
- **Calculate SLA** - Monthly SLA metrics
- **View History** - Historical incidents

## Project Structure

```
09-uptime-monitoring-slas/
├── server.js              # Express server
├── controller.js          # Business logic & calculations
├── routes.js              # API routes
├── middleware.js          # Request tracking
├── schema.js              # Data validation
├── package.json           # Dependencies
├── .env.example           # Environment template
├── App.jsx                # React testing UI
├── preview.html           # Standalone HTML preview
├── theory.md              # Detailed theory
├── README.md              # This file
├── setup.md               # Setup instructions
└── checklist.md           # Learning checklist
```

## API Endpoints

### Metrics & Monitoring

```bash
# Get real-time metrics
GET /api/metrics

# Get status page
GET /api/status

# Get uptime for time period (hours)
GET /api/uptime?period=24

# Get incidents
GET /api/incidents

# Get SLA status
GET /api/sla-status
```

### Health & Diagnostics

```bash
# System health check
GET /health

# Get API info
GET /

# Trigger test incident
POST /api/test-incident
```

## Common Issues & Fixes

### Issue: "EADDRINUSE: port 4009 already in use"

**Fix:**
```bash
# Kill the process using port 4009
lsof -i :4009
kill -9 <PID>

# Or use different port
HTTP_PORT=4010 npm start
```

### Issue: "Module not found: cors"

**Fix:**
```bash
npm install
```

### Issue: "Cannot GET /api/metrics"

**Fix:** Server might not have started. Check console for errors.

Actually running? Visit http://localhost:4009/health first.

### Issue: React app doesn't connect to backend

**Fix:** Check CORS is enabled. Backend should be running on http://localhost:4009.

## Environment Variables Explained

```bash
# Server Port
HTTP_PORT=4009

# Environment (development or production)
NODE_ENV=development

# Logging Level (error, warn, info, debug)
LOG_LEVEL=info

# SLO Target (0.99 = 99%, 0.9999 = 99.99%)
SLO_TARGET=0.999

# Health check frequency (every N milliseconds)
HEALTH_CHECK_INTERVAL=60000     # 60 seconds

# Maximum minutes of downtime allowed per month
SLO_DOWNTIME_BUDGET=43          # 99.9% = 43 min/month

# Alert thresholds
ALERT_ERROR_RATE=0.05           # Alert if error rate > 5%
ALERT_P95_LATENCY=5000          # Alert if P95 > 5 seconds
```

## Development Workflow

### 1. Understand the Theory

Read `theory.md` to understand SLOs, SLAs, SLIs.

### 2. Run the Server

```bash
npm run dev
```

### 3. Test Endpoints

```bash
# Check it's running
curl http://localhost:4009/health

# Get metrics
curl http://localhost:4009/api/metrics

# View status
curl http://localhost:4009/api/status
```

### 4. Use React UI (Optional)

Access `preview.html` to test interactively.

### 5. Modify Code

Edit files and see changes instantly with `nodemon`.

## Production Deployment

### Before Going Live

✅ Verify SLO targets are realistic
✅ Set up status page (StatusPage.io)
✅ Configure alerting (PagerDuty, Slack)
✅ Have incident response runbook
✅ Test failover and recovery
✅ Document SLA for customers
✅ Set up monitoring dashboard (Grafana)

### Deployment Steps

```bash
# 1. Set environment to production
NODE_ENV=production

# 2. Build/minify if needed (skip for Node)

# 3. Run with process manager
pm2 start server
# or
docker run -e HTTP_PORT=4009 my-app

# 4. Verify health check
curl https://api.example.com/health
```

### Monitoring in Production

```bash
# Monitor logs
tail -f debug.log

# Monitor errors
tail -f error.log

# Check metrics endpoint
curl https://api.example.com/api/metrics

# View status page
https://status.example.com/
```

## Next Steps

After this module, you're ready for:
1. **Distributed Tracing** (08-distributed-tracing)
2. **APM Tools** (DataDog, New Relic)
3. **Chaos Engineering** (test failure scenarios)
4. **Disaster Recovery** (backup/restore procedures)
