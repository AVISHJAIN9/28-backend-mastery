# Module 05: Configuration Management - Hot-Reload Without Server Restart

## Overview

Configuration management in production requires:
- **Dynamic Updates**: Change settings without redeploying
- **Environment-Specific**: Different configs for dev/staging/production
- **Hot-Reload**: Apply changes instantly (no restart)
- **Validation**: Prevent invalid configs from breaking applications
- **Audit Trail**: Track who changed what and when
- **Rollback**: Revert to previous config if needed

This module demonstrates both vulnerable and secure approaches to configuration management.

## Vulnerable Pattern: Hardcoded Configuration

```javascript
// ❌ VULNERABLE: Config hardcoded in code
const config = {
  database_url: 'mongodb://prod.company.com/db',
  api_timeout: 5000,
  cache_ttl: 3600,
  debug: false
};

app.get('/api/config', (req, res) => {
  res.json(config);
});
```

**Problems:**
- Changes require code modification
- Requires full deployment + restart
- No audit trail of who changed what
- Different configs per environment → multiple code versions
- Can't respond to incidents (e.g., database down → no config change possible)
- Configuration drift: staging config ≠ production

## Secure Pattern: Database-Backed Configuration with Hot-Reload

```javascript
// ✅ SECURE: Config in database with hot-reload
const config = {
  development: { ... },
  staging: { ... },
  production: { ... }
};

const configEmitter = new EventEmitter();

app.get('/api/secure/config', (req, res) => {
  const environment = process.env.NODE_ENV || 'development';
  return res.json({
    environment,
    config: config[environment],
    hot_reload_enabled: true
  });
});

app.put('/api/secure/config', (req, res) => {
  const environment = process.env.NODE_ENV || 'development';
  
  // Apply update
  Object.assign(config[environment], req.body);
  
  // Emit event to listeners
  configEmitter.emit('config-changed', {
    environment,
    changes: req.body
  });
  
  return res.json({
    success: true,
    message: 'Config updated (no restart required!)'
  });
});

// Listeners can react immediately
configEmitter.on('config-changed', (data) => {
  logger.info('Applications notified of config change', data);
});
```

**Benefits:**
- Zero downtime updates
- Single config source (database)
- Instant effect across all instances
- Full audit trail
- Validation before apply
- Configuration consistency

## Real-World Examples

### 1. Netflix: Database Connection Pooling

**Scenario:** Database starts slowing down during peak traffic.

**Hardcoded approach:**
```
1. Engineer edits config file
2. Code review + merge (30 min)
3. Build + test (15 min)
4. Deploy to staging (10 min)
5. Deploy to production (20 min)
6. Database recovers naturally (5 min)
Total: 80 minutes, 30 minutes unnecessary!
```

**Hot-reload approach:**
```
1. Alert: Database connection pool saturation
2. Engineer updates config via API (2 sec)
3. All instances pick up new pool size (1 sec)
4. Database recovers
5. Scale down when recovered (2 sec)
Total: 5 seconds, zero downtime!
```

### 2. Airbnb: Feature Flag Database Connection

**Scenario:** Feature flag TTL is too short, causing 100 requests/sec to feature flag database.

**Vulnerable:** Restart all servers (1 hour downtime)
**Hot-reload:** Update config immediately, instant effect

### 3. Stripe: Rate Limiting

**Scenario:** Attack detected, need to reduce API rate limits instantly.

```javascript
// Before hot-reload:
// 1. Restart all API servers (downtime)
// 2. Attacker hits full force during restart
// 3. Cascade failure

// With hot-reload:
PUT /api/secure/config
{
  "rate_limit_requests": 100,    // Reduced from 5000
  "rate_limit_window": 60000
}
// Instant: All servers enforce new limits
// Attacker rate-limited immediately
```

## API Endpoints

### Get Configuration
```bash
GET /api/secure/config?environment=production
# or to get specific key:
GET /api/secure/config?key=api_timeout

Response:
{
  "environment": "production",
  "config": {
    "database_url": "mongodb://prod.company.com:27017/db",
    "api_timeout": 10000,
    "cache_ttl": 3600,
    ...
  },
  "hot_reload_enabled": true
}
```

### Update Configuration
```bash
PUT /api/secure/config
Content-Type: application/json

{
  "api_timeout": 8000,
  "cache_ttl": 1800,
  "rate_limit_requests": 1000
}

Response:
{
  "success": true,
  "environment": "production",
  "updated_keys": ["api_timeout", "cache_ttl", "rate_limit_requests"],
  "message": "Configuration updated (no restart required!)"
}
```

### Validate Configuration
```bash
POST /api/secure/config/validate
Content-Type: application/json

{
  "key": "api_timeout",
  "value": 12000
}

Response:
{
  "key": "api_timeout",
  "value": 12000,
  "valid": true,
  "message": "Config valid"
}
```

### Get Configuration History
```bash
GET /api/secure/config/history?limit=50&offset=0&environment=production

Response:
{
  "changes": [
    {
      "timestamp": "2026-03-29T14:30:22Z",
      "environment": "production",
      "changes": { "cache_ttl": 1800 },
      "previous": { "cache_ttl": 3600 }
    },
    ...
  ],
  "total": 45,
  "limit": 50,
  "offset": 0
}
```

### Compare Environments
```bash
GET /api/secure/config/diff?from=development&to=production

Response:
{
  "from": "development",
  "to": "production",
  "differences": {
    "api_timeout": { "development": 5000, "production": 10000 },
    "cache_ttl": { "development": 300, "production": 3600 },
    "log_level": { "development": "debug", "production": "warn" }
  },
  "diff_count": 3
}
```

### Subscribe to Changes (Server-Sent Events)
```bash
GET /api/secure/config/subscribe

# Connection opens, receives updates in real-time:
data: {"environment":"production","changes":{"api_timeout":8000},"timestamp":"2026-03-29T..."}
data: {"environment":"staging","changes":{"cache_ttl":1800},"timestamp":"2026-03-29T..."}
```

## Technical Implementation

### 1. Environment-Specific Configuration

```javascript
const config = {
  development: {
    database_url: 'mongodb://localhost:27017/dev',
    api_timeout: 5000,
    cache_ttl: 300,      // 5 min cache in dev
    log_level: 'debug'
  },
  staging: {
    database_url: 'mongodb://staging.company.com:27017/db',
    api_timeout: 8000,
    cache_ttl: 600,      // 10 min cache in staging
    log_level: 'info'
  },
  production: {
    database_url: 'mongodb://prod.company.com:27017/db',
    api_timeout: 10000,
    cache_ttl: 3600,     // 1 hour cache in prod
    log_level: 'warn'
  }
};

// Application picks environment at startup
const environment = process.env.NODE_ENV || 'development';
const appConfig = config[environment];
```

### 2. Hot-Reload with Event Emitter

```javascript
const EventEmitter = require('events');
const configEmitter = new EventEmitter();

// Update config
app.put('/api/secure/config', (req, res) => {
  Object.assign(config[environment], req.body);
  
  // Notify all listeners
  configEmitter.emit('config-changed', {
    environment,
    changes: req.body
  });
});

// Cache layer listens for changes
configEmitter.on('config-changed', (data) => {
  cache.setTTL(data.changes.cache_ttl);
  logger.debug('Cache TTL updated', data.changes.cache_ttl);
});

// Rate limiter listens for changes
configEmitter.on('config-changed', (data) => {
  if (data.changes.rate_limit_requests) {
    rateLimiter.setMaxRequests(data.changes.rate_limit_requests);
  }
});
```

### 3. Configuration Validation

```javascript
const validators = {
  api_timeout: (v) => typeof v === 'number' && v > 0 && v < 60000,
  cache_ttl: (v) => typeof v === 'number' && v >= 0,
  database_url: (v) => /^mongodb:\/\//.test(v),
  log_level: (v) => ['debug', 'info', 'warn', 'error'].includes(v),
  rate_limit_requests: (v) => typeof v === 'number' && v > 0
};

app.post('/api/secure/config/validate', (req, res) => {
  const { key, value } = req.body;
  const isValid = validators[key]?.(value) ?? false;
  
  return res.json({
    key,
    value,
    valid: isValid,
    message: isValid ? 'Valid' : `Invalid value for '${key}'`
  });
});
```

### 4. Configuration History & Audit

```javascript
const configChangeLog = [];

app.put('/api/secure/config', (req, res) => {
  const oldConfig = { ...config[environment] };
  Object.assign(config[environment], req.body);
  
  // Log change for audit trail
  configChangeLog.push({
    timestamp: new Date(),
    environment,
    changes: req.body,
    previous: oldConfig,
    changed_by: req.user?.id,  // If auth enabled
    changed_at_ip: req.ip
  });
});
```

## Best Practices

### ✅ DO:

1. **Validate Before Apply**
   ```javascript
   // Check value is valid type/range
   if (!validators[key](value)) {
     return res.status(400).json({ error: 'Invalid value' });
   }
   ```

2. **Maintain Audit Trail**
   ```javascript
   // Log all changes with context
   configChangeLog.push({
     timestamp: new Date(),
     key,
     old_value: config[key],
     new_value: value,
     requested_by: req.user?.email
   });
   ```

3. **Use Environment-Specific Defaults**
   ```javascript
   const defaults = {
     development: { api_timeout: 5000, debug: true },
     production: { api_timeout: 10000, debug: false }
   };
   ```

4. **Implement Gradual Rollout**
   ```javascript
   // Don't apply change everywhere at once
   config.canary_percentage = 5;  // Start with 5% of users
   // Monitor for 1 hour
   config.canary_percentage = 50; // Increase to 50%
   // If stable, apply to all
   ```

5. **Provide Rollback Capability**
   ```javascript
   // Keep config history
   app.post('/api/secure/config/rollback/:timestamp', (req, res) => {
     const previous = configChangeLog.find(
       entry => entry.timestamp === req.params.timestamp
     );
     if (previous) {
       config[environment] = previous.config;
       configEmitter.emit('config-changed', ...);
     }
   });
   ```

### ❌ DON'T:

1. **Apply Without Validation**
   ```javascript
   // ❌ BAD: No validation
   app.put('/api/config', (req, res) => {
     Object.assign(config, req.body);  // Blindly apply!
     res.json({ success: true });
   });
   ```

2. **Hardcode Configs**
   ```javascript
   // ❌ BAD: Hardcoded values
   const API_TIMEOUT = 5000;
   const CACHE_TTL = 3600;
   ```

3. **No Audit**
   ```javascript
   // ❌ BAD: Can't track who changed what
   ```

4. **Block on Config Changes**
   ```javascript
   // ❌ BAD: Blocks request on config change
   app.get('/api/data', async (req, res) => {
     const config = await db.config.findOne();  // Wait for DB
     // Long latency if DB slow!
   });
   
   // ✅ GOOD: Cache config, async refresh
   let cachedConfig = {};
   configEmitter.on('config-changed', (data) => {
     cachedConfig = data;
   });
   ```

5. **Different Configs by Accident**
   ```javascript
   // ❌ BAD: Inconsistent environment configs
   const dev = { api_timeout: 5000 };
   const prod = { api_timeout: 5000 };  // Same! Should differ
   
   // ✅ GOOD: Explicit environment differences
   const defaults = {
     development: { api_timeout: 5000, debug: true },
     production: { api_timeout: 10000, debug: false }
   };
   ```

## Setup & Testing

### Installation

```bash
npm install express cors body-parser joi winston dotenv
```

### Environment Variables (.env)

```bash
HTTP_PORT=4005
NODE_ENV=development
```

### Running the Server

```bash
node server.js
```

### React UI Testing

1. Start React dev server: `npm start` (port 3000)
2. Navigate to http://localhost:3000
3. Test each tab:
   - **View Config**: Switch vulnerable/secure, see hardcoded vs dynamic
   - **Update Config**: Change timeout, see instant effect
   - **Validate**: Test config values against validators
   - **History**: View all configuration changes

### cURL Testing

```bash
# Get current config
curl http://localhost:4005/api/secure/config

# Update config
curl -X PUT http://localhost:4005/api/secure/config \
  -H "Content-Type: application/json" \
  -d '{ "api_timeout": 8000 }'

# Validate config value
curl -X POST http://localhost:4005/api/secure/config/validate \
  -H "Content-Type: application/json" \
  -d '{ "key": "api_timeout", "value": 8000 }'

# Get config history
curl http://localhost:4005/api/secure/config/history?limit=10&offset=0

# Compare environments
curl 'http://localhost:4005/api/secure/config/diff?from=development&to=production'
```

## Common Issues & Solutions

| Issue | Cause | Fix |
|-------|-------|-----|
| Changes not reflected | Need to refresh cache | Restart app or wait for cache TTL |
| Invalid config accepted | No validation | Add validators before apply |
| EADDRINUSE on 4005 | Port in use | `lsof -i :4005` then kill process |
| Different values per instance | Config not synced | Use shared database, not in-memory |
| Can't rollback | No history kept | Store all changes in log |

## Production Checklist

- [ ] Config stored in database (not code)
- [ ] Environment-specific defaults
- [ ] Validation before applying
- [ ] Audit trail for all changes
- [ ] Hot-reload without restart
- [ ] Event-driven config listeners
- [ ] Configuration history & searchable
- [ ] Rollback capability
- [ ] Monitoring: config change latency
- [ ] Testing: validate all config types

## What is this?

## Why does it matter?

## How it works

## Key concepts

## Common mistakes
