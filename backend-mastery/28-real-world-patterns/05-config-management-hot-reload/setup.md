# Setup Guide: Configuration Management & Hot-Reload

## Installation & Setup

### Prerequisites
- Node.js 16+
- npm 8+
- MongoDB (or use in-memory mock)
- Basic understanding of configuration management

### Step 1: Install Dependencies

```bash
cd 05-config-management-hot-reload

npm install
```

### Step 2: Configure Environment

```bash
# Copy example environment file
cp .env.example .env

# Update .env for your setup
nano .env
```

**Environment variables:**
```env
NODE_ENV=development
HTTP_PORT=4005
DATABASE_URL=mongodb://localhost/config_demo
LOG_LEVEL=debug
```

### Step 3: Start the Server

```bash
# Start backend server (port 4005)
npm start

# Server output:
# ✓ Server running on http://localhost:4005
# ✓ Configuration management module initialized
```

### Step 4: Access the UI

**Option A: React UI (Recommended)**
```bash
# In another terminal, start React development server
npm run dev

# Opens: http://localhost:3000
```

**Option B: Direct API Testing**
```bash
# Test configuration endpoint
curl http://localhost:4005/api/secure/config

# Response:
# {
#   "api_timeout": 5000,
#   "cache_ttl": 600,
#   "log_level": "debug",
#   "database_url": "mongodb://localhost/config_demo"
# }
```

---

## Test Scenarios

### Scenario 1: Basic Configuration Retrieval

**Objective:** Compare hardcoded vs secure configuration endpoints

#### Step 1A: Vulnerable Endpoint
```bash
curl http://localhost:4005/api/vulnerable/config

# Response shows hardcoded values:
# {
#   "api_timeout": 5000,
#   "cache_ttl": 300,
#   "log_level": "info",
#   "database_url": "hardcoded_url",
#   "api_key": "exposed_secret_key"  ← SECURITY ISSUE!
# }

# Problems:
# ✗ API key hardcoded and exposed
# ✗ Cannot change without code edit
# ✗ Must redeploy to modify
# ✗ All environments use same config
```

#### Step 1B: Secure Endpoint
```bash
curl http://localhost:4005/api/secure/config

# Response shows environment-specific config:
# {
#   "environment": "development",
#   "api_timeout": 5000,
#   "cache_ttl": 600,
#   "log_level": "debug",
#   "database_url": "mongodb://localhost/config_demo",
#   "updated_at": "2024-01-15T10:30:00Z"
# }

# Benefits:
# ✓ Secure (no exposed secrets)
# ✓ Database-backed (hot-reloadable)
# ✓ Environment-specific
# ✓ Change without redeploy
# ✓ Audit trail available
```

**Success Criteria:**
- ✓ Vulnerable endpoint shows hardcoded config
- ✓ Secure endpoint shows database config
- ✓ No exposed secrets in secure endpoint

---

### Scenario 2: Hot-Reload Without Restart

**Objective:** Verify configuration changes apply instantly without server restart

#### Step 2A: Check Current Config
```bash
curl http://localhost:4005/api/secure/config

# Note current values:
# {
#   "api_timeout": 5000,
#   "cache_ttl": 600,
#   "log_level": "debug"
# }
```

#### Step 2B: Update Configuration
```bash
# Change cache_ttl from 600 to 3600 (1 hour)
curl -X PUT http://localhost:4005/api/secure/config \
  -H "Content-Type: application/json" \
  -d '{"cache_ttl": 3600}'

# Response:
# {
#   "success": true,
#   "message": "Configuration updated (no restart required!)",
#   "updated": {"cache_ttl": 3600}
# }

# Server logged:
# [INFO] Configuration changed: cache_ttl = 3600
# [INFO] 3 EventEmitter listeners notified
```

#### Step 2C: Verify Change (No Restart!)
```bash
# Check config immediately - should show new value
curl http://localhost:4005/api/secure/config

# Response:
# {
#   "environment": "development",
#   "api_timeout": 5000,
#   "cache_ttl": 3600,    ← CHANGED! (without restart)
#   "log_level": "debug"
# }
```

#### Step 2D: Monitor React UI
In the React UI (http://localhost:3000):
1. Open "View Config" tab
2. Observe current cache_ttl value
3. In another tab/terminal, run Step 2B
4. Watch React UI update in real-time (SSE)
5. Confirm no server restart occurred

**Success Criteria:**
- ✓ Configuration changes immediately
- ✓ No server restart required
- ✓ React UI updates in real-time
- ✓ Subsequent requests use new config

---

### Scenario 3: Environment-Specific Configurations

**Objective:** Demonstrate different configs per environment

#### Step 3A: View Development Config
```bash
curl http://localhost:4005/api/secure/environments/development

# Response:
# {
#   "environment": "development",
#   "api_timeout": 5000,
#   "cache_ttl": 60,          // Short cache for fast feedback
#   "log_level": "debug",     // Verbose logs
#   "db_pool_size": 5,        // Small pool for laptop
#   "rate_limit": 100
# }
```

#### Step 3B: View Production Config
```bash
curl http://localhost:4005/api/secure/environments/production

# Response:
# {
#   "environment": "production",
#   "api_timeout": 10000,
#   "cache_ttl": 3600,        // Long cache for performance
#   "log_level": "error",     // Only errors logged
#   "db_pool_size": 200,      // Heavy traffic expected
#   "rate_limit": 5000
# }
```

#### Step 3C: View All Environments
```bash
curl http://localhost:4005/api/secure/environments

# Response: Array of all environment configs
# [
#   { environment: "development", ... },
#   { environment: "staging", ... },
#   { environment: "production", ... }
# ]
```

**Success Criteria:**
- ✓ Each environment has specific config
- ✓ Can switch between environments
- ✓ Config differences make sense (prod = high-perf)

---

### Scenario 4: Configuration Validation Before Apply

**Objective:** Prevent invalid configurations from being applied

#### Step 4A: Valid Configuration Update
```bash
# Valid: api_timeout between 100-60000
curl -X PUT http://localhost:4005/api/secure/config \
  -H "Content-Type: application/json" \
  -d '{"api_timeout": 8000}'

# Response: Success
# {
#   "success": true,
#   "message": "Configuration updated (no restart required!)"
# }
```

#### Step 4B: Invalid Configuration Update
```bash
# Invalid: api_timeout too large (999999 > 60000)
curl -X PUT http://localhost:4005/api/secure/config \
  -H "Content-Type: application/json" \
  -d '{"api_timeout": 999999}'

# Response: Error (config not updated!)
# {
#   "success": false,
#   "error": "Validation failed: api_timeout must be between 100 and 60000"
# }

# Server log:
# [WARN] Invalid config update rejected: api_timeout=999999
```

#### Step 4C: Validate Configuration Before Apply
```bash
# Use /validate endpoint to test config without applying
curl -X POST http://localhost:4005/api/secure/config/validate \
  -H "Content-Type: application/json" \
  -d '{"cache_ttl": "not_a_number"}'

# Response: Validation failed (but config not changed!)
# {
#   "valid": false,
#   "error": "cache_ttl must be a number"
# }

# Then test valid config
curl -X POST http://localhost:4005/api/secure/config/validate \
  -H "Content-Type: application/json" \
  -d '{"cache_ttl": 3600}'

# Response: Success
# {
#   "valid": true,
#   "message": "Configuration is valid"
# }
```

**Success Criteria:**
- ✓ Valid configs are applied
- ✓ Invalid configs are rejected
- ✓ Validation prevents bad values
- ✓ /validate endpoint works without modifying config

---

### Scenario 5: Configuration History & Audit Trail

**Objective:** Track all configuration changes with timestamps

#### Step 5A: View Configuration History
```bash
curl http://localhost:4005/api/secure/config/history

# Response: All changes with timestamps
# {
#   "history": [
#     {
#       "timestamp": "2024-01-15T10:20:00Z",
#       "changes": { "cache_ttl": 600 },
#       "changed_by": "admin",
#       "reason": "Performance tuning"
#     },
#     {
#       "timestamp": "2024-01-15T10:25:00Z",
#       "changes": { "api_timeout": 8000 },
#       "changed_by": "engineer",
#       "reason": "Database slow"
#     },
#     {
#       "timestamp": "2024-01-15T10:30:00Z",
#       "changes": { "log_level": "debug" },
#       "changed_by": "engineer", 
#       "reason": "Debugging incident"
#     }
#   ],
#   "total": 3
# }
```

#### Step 5B: Compare Environments
```bash
# See what changed between dev and production
curl http://localhost:4005/api/secure/config/diff \
  -H "Content-Type: application/json" \
  -d '{"env1": "development", "env2": "production"}'

# Response: Differences highlighted
# {
#   "env1": "development",
#   "env2": "production",
#   "differences": [
#     {
#       "key": "cache_ttl",
#       "development": 60,
#       "production": 3600,
#       "reason": "Performance: prod needs more caching"
#     },
#     {
#       "key": "api_timeout",
#       "development": 5000,
#       "production": 10000,
#       "reason": "Production is more tolerant of slow DB"
#     },
#     {
#       "key": "log_level",
#       "development": "debug",
#       "production": "error",
#       "reason": "Production minimizes logging overhead"
#     }
#   ]
# }
```

**Success Criteria:**
- ✓ History shows all changes with timestamps
- ✓ Each change records what was modified
- ✓ Diff shows differences between environments
- ✓ Can track when config drifted

---

### Scenario 6: Real-Time Subscriptions (Server-Sent Events)

**Objective:** Receive real-time notifications of config changes

#### Step 6A: Subscribe to Config Changes
```bash
# Terminal 1: Subscribe to SSE stream
curl http://localhost:4005/api/secure/config/subscribe

# Output (waiting for changes):
# data: {"mode":"connected","message":"Listening for config changes"}
```

#### Step 6B: Make Config Change (Different Terminal)
```bash
# Terminal 2: Update configuration
curl -X PUT http://localhost:4005/api/secure/config \
  -H "Content-Type: application/json" \
  -d '{"rate_limit": 2000}'

# Response: Success
# { "success": true, ... }
```

#### Step 6C: Observe Real-Time Update
```bash
# Terminal 1 (SSE subscriber):
# data: {"event":"config-changed","data":{...}}
# data: {"mode":"updated","timestamp":"2024-01-15T10:35:00Z","changes":{"rate_limit":2000}}

# Server Log:
# [INFO] SSE: 1 subscriber notified of config change
```

#### Step 6D: React UI Auto-Update
In React UI (http://localhost:3000):
1. Open "History" tab
2. Subscribe to changes (green "Subscribe" button)
3. In another tab/terminal, update config (Step 6B)
4. Watch history tab auto-update with new change
5. No page refresh needed!

**Success Criteria:**
- ✓ SSE connection established
- ✓ Real-time notifications received
- ✓ React UI updates automatically
- ✓ Multiple subscribers get updates

---

## Integration Tests

### Test Suite Execution

```bash
# Run all integration tests
npm run test

# Test output:
# ✓ Configuration retrieval (hardcoded vs secure)
# ✓ Hot-reload without restart
# ✓ Environment-specific configs
# ✓ Configuration validation
# ✓ History tracking
# ✓ Real-time subscriptions
#
# Tests: 6 passed, 0 failed
# Coverage: 92%
```

---

## Performance Monitoring

### Startup Performance

```bash
# Check startup time
time npm start

# Expected:
# real    0m2.340s (milliseconds)
# user    0m1.800s
# sys     0m0.400s
```

### Runtime Performance

**Memory Usage:**
```
Before config changes: ~45 MB
After 100 config changes: ~45 MB
(No memory leaks from hot-reload)
```

**Response Times:**
```
GET /api/secure/config:        5ms (in-memory)
PUT /api/secure/config:       10ms (update + notify)
GET /api/config/subscribe:  [streaming] (SSE)
SSE notification delivery:   < 50ms average
```

---

## Troubleshooting

### Issue: Port 4005 Already in Use

```bash
# Find process using port
lsof -i :4005

# Kill process
kill -9 <PID>

# Or use different port
HTTP_PORT=4006 npm start
```

### Issue: Server Not Hot-Reloading

```bash
# Check EventEmitter listeners are active
curl http://localhost:4005/api/health

# Verify config in server logs
tail -f logs/app.log | grep "config-changed"

# Restart server
npm stop
npm start
```

### Issue: React UI Not Updating

```bash
# Check if SSE connection is active
# In browser DevTools → Network → filter "subscribe"
# Should show "pending" (active connection)

# If closed, reconnect:
# Click "Subscribe" button in React UI

# Check server logs for SSE errors
tail -f logs/app.log | grep "SSE"
```

### Issue: Configuration Changes Not Persisting

```bash
# Verify database is running (if using external DB)
mongo admin --eval "db.version()"

# Check in-memory storage is enabled
curl http://localhost:4005/api/secure/config/history

# If history empty, restart server and retry
npm stop
npm start
```

---

## Production Deployment Checklist

Before deploying to production:

- [ ] All 6 test scenarios pass
- [ ] Configuration validation enabled
- [ ] Audit logging configured
- [ ] EventEmitter listeners attached
- [ ] SSE error handling implemented
- [ ] Config history cleanup enabled
- [ ] Rate limiting configured
- [ ] Secrets NOT in config endpoint
- [ ] CORS properly restricted
- [ ] Environment variables set correctly
- [ ] Database connection pooling tuned
- [ ] Monitoring alerts configured
- [ ] Rollback procedure documented
- [ ] Team trained on hot-reload
- [ ] Change log maintained

---

## Additional Resources

- **Configuration Patterns:** See `/theory.md` for deep dive
- **API Documentation:** See `/README.md` for endpoint details
- **Real-World Examples:** Netflix, Uber, Stripe cases in theory.md
- **Source Code:** See `controller.js`, `routes.js`, `middleware.js`
