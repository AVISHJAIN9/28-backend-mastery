# Correlation ID Per Request Theory

## What is a Correlation ID?

A Correlation ID (also called Request ID, Trace ID) is a unique identifier assigned to each request that flows across an entire distributed system. It connects all logs and events related to a single user action.

### Without Correlation ID (Hard to Debug)

```
User Request: Login attempt
─────────────────────────────────────────────────────

[Auth Service]
2026-03-29T10:30:45Z | User login attempted
2026-03-29T10:30:46Z | Token generated

[Database Service]
2026-03-29T10:30:46Z | User record fetched
2026-03-29T10:30:47Z | Login timestamp updated

[Audit Service]
2026-03-29T10:30:47Z | Login event logged

Problem: Can't connect which login belongs to which user!
```

### With Correlation ID (EZ to Debug)

```
User Request: Login attempt
correlationId: "req_82f4c9a1-e723-4f2e-9d3c-2f8e7a6b4c1d"
─────────────────────────────────────────────────────

[Auth Service]
2026-03-29T10:30:45Z | correlationId: req_82f4c9a1... | User login attempted
2026-03-29T10:30:46Z | correlationId: req_82f4c9a1... | Token generated

[Database Service]
2026-03-29T10:30:46Z | correlationId: req_82f4c9a1... | User record fetched
2026-03-29T10:30:47Z | correlationId: req_82f4c9a1... | Login timestamp updated

[Audit Service]
2026-03-29T10:30:47Z | correlationId: req_82f4c9a1... | Login event logged

Solution: Filter all logs by correlationId to see entire request flow!
```

## Generating Correlation IDs

### Method 1: UUID v4

```javascript
const { v4: uuidv4 } = require('uuid');

const correlationId = uuidv4();
// "82f4c9a1-e723-4f2e-9d3c-2f8e7a6b4c1d"
```

### Method 2: Timestamp + Random

```javascript
const generateCorrelationId = () => {
  const timestamp = Date.now().toString(36);
  const random = Math.random().toString(36).substring(2, 8);
  return `req_${timestamp}_${random}`;
};

// "req_z0mfv9n_k2p4xq"
```

### Method 3: Prefixed UUID

```javascript
const { v4: uuidv4 } = require('uuid');

const generateCorrelationId = (service) => {
  return `${service}-${uuidv4()}`;
};

// "auth-82f4c9a1-e723-4f2e-9d3c-2f8e7a6b4c1d"
// "db-f5c8e2a9-d4b1-4e7c-9a3f-1c6e8b2f5a7d"
```

## Express Middleware for Correlation IDs

### Basic Implementation

```javascript
const { v4: uuidv4 } = require('uuid');

app.use((req, res, next) => {
  // Check if client sent correlationId, otherwise generate
  const correlationId = req.headers['x-correlation-id'] || uuidv4();
  
  // Attach to request object
  req.correlationId = correlationId;
  
  // Pass to response headers
  res.setHeader('X-Correlation-ID', correlationId);
  
  next();
});

// Usage in routes
app.get('/api/users/:id', (req, res) => {
  logger.info({
    correlationId: req.correlationId,
    event: 'user_fetch',
    userId: req.params.id
  });
  
  res.json({ id: req.params.id });
});
```

### With Winston Logger Integration

```javascript
const { v4: uuidv4 } = require('uuid');
const winston = require('winston');

// Middleware adds correlationId to request
app.use((req, res, next) => {
  req.correlationId = req.headers['x-correlation-id'] || uuidv4();
  res.setHeader('X-Correlation-ID', req.correlationId);
  next();
});

// Child logger with correlationId context
const createChildLogger = (correlationId) => {
  return logger.child({ correlationId });
};

app.get('/api/users/:id', (req, res) => {
  const log = createChildLogger(req.correlationId);
  
  log.info({
    event: 'user_fetch_started',
    userId: req.params.id
  });
  
  // All logs automatically include correlationId
  const user = db.getUser(req.params.id);
  
  log.info({
    event: 'user_fetch_success',
    user
  });
  
  res.json(user);
});

// Log output:
// {
//   "correlationId": "req_82f4c9a1...",
//   "event": "user_fetch_started",
//   "userId": "123"
// }
```

### With Async Local Storage (NodeJS Best Practice)

```javascript
const { AsyncLocalStorage } = require('async_hooks');
const { v4: uuidv4 } = require('uuid');

const correlationIdStorage = new AsyncLocalStorage();

// Middleware
app.use((req, res, next) => {
  const correlationId = req.headers['x-correlation-id'] || uuidv4();
  
  correlationIdStorage.run(correlationId, () => {
    res.setHeader('X-Correlation-ID', correlationId);
    next();
  });
});

// Logger wrapper
const logger = {
  info: (data) => {
    const correlationId = correlationIdStorage.getStore();
    console.log(JSON.stringify({
      ...data,
      correlationId,
      timestamp: new Date()
    }));
  }
};

// Any function can access correlationId without passing it
async function getUserDetails(userId) {
  const correlationId = correlationIdStorage.getStore();
  
  logger.info({
    event: 'fetching_user',
    userId
    // correlationId: automatically added
  });
  
  const user = await db.getUser(userId);
  return user;
}

app.get('/api/users/:id', async (req, res) => {
  const user = await getUserDetails(req.params.id);
  res.json(user);
});
```

## Correlation IDs Across Services

### Service-to-Service Communication

```javascript
// Service A: Auth Service
app.post('/api/login', async (req, res) => {
  const correlationId = req.correlationId;
  
  logger.info({
    correlationId,
    event: 'login_started'
  });
  
  // Call User Service
  const response = await fetch('http://user-service/api/validate', {
    method: 'POST',
    headers: {
      'X-Correlation-ID': correlationId,  // Forward correlation ID!
      'Content-Type': 'application/json'
    },
    body: JSON.stringify({ email: req.body.email })
  });
  
  const user = await response.json();
  
  logger.info({
    correlationId,
    event: 'login_success',
    userId: user.id
  });
  
  res.json({ token: 'jwt_token' });
});

// Service B: User Service (receives correlation ID)
app.post('/api/validate', (req, res) => {
  const correlationId = req.headers['x-correlation-id'];
  
  logger.info({
    correlationId,  // Same correlation ID as Service A!
    event: 'validating_user',
    email: req.body.email
  });
  
  const user = db.findUser(req.body.email);
  
  logger.info({
    correlationId,
    event: 'user_validation_complete',
    found: !!user
  });
  
  res.json(user || { error: 'User not found' });
});
```

## Correlation IDs in Frontend Requests

### Client Tracks Requests

```javascript
// frontend/api.js
class APIClient {
  constructor() {
    this.correlationId = null;
  }
  
  async request(endpoint, options = {}) {
    // Generate or reuse correlationId
    this.correlationId = this.correlationId || this.generateId();
    
    const response = await fetch(endpoint, {
      ...options,
      headers: {
        ...options.headers,
        'X-Correlation-ID': this.correlationId
      }
    });
    
    return response.json();
  }
  
  generateId() {
    return `client-${Date.now()}-${Math.random().toString(36).substring(7)}`;
  }
}

const api = new APIClient();

// All requests within a session share same correlationId
await api.request('/api/login', { method: 'POST', body: JSON.stringify(...) });
await api.request('/api/user/profile');  // Same correlationId!
await api.request('/api/orders');         // Same correlationId!
```

## Querying Logs by Correlation ID

### Elasticsearch Query

```javascript
// Find all logs for a specific correlation ID
POST /logs-*/_search
{
  "query": {
    "match": {
      "correlationId": "req_82f4c9a1-e723-4f2e-9d3c-2f8e7a6b4c1d"
    }
  },
  "sort": {
    "timestamp": { "order": "asc" }
  }
}
```

### CloudWatch Logs Query

```plaintext
fields @timestamp, @message, correlationId
| filter correlationId = "req_82f4c9a1-e723-4f2e-9d3c-2f8e7a6b4c1d"
| sort @timestamp asc
```

### Grafana Loki Query

```
{correlationId="req_82f4c9a1-e723-4f2e-9d3c-2f8e7a6b4c1d"}
```

## Real-World Scenario: E-commerce Order

```
User clicks "Place Order"
correlationId: "req_xyz123"

[Frontend]
2026-03-29T10:30:45.123Z | req_xyz123 | POST /api/orders with cart data

[API Gateway]
2026-03-29T10:30:45.245Z | req_xyz123 | Request received

[Order Service]
2026-03-29T10:30:45.367Z | req_xyz123 | Order validation started
2026-03-29T10:30:45.412Z | req_xyz123 | Order validated successfully
2026-03-29T10:30:45.434Z | req_xyz123 | Creating order in database
2026-03-29T10:30:45.589Z | req_xyz123 | Order created: order_id=ORD_12345

[Payment Service]
2026-03-29T10:30:45.612Z | req_xyz123 | Processing payment
2026-03-29T10:30:46.234Z | req_xyz123 | Payment authorized: txn_id=TXN_67890

[Email Service]
2026-03-29T10:30:46.467Z | req_xyz123 | Sending order confirmation

[Notif Service]
2026-03-29T10:30:46.589Z | req_xyz123 | Adding to notification queue

[Order Service]
2026-03-29T10:30:46.623Z | req_xyz123 | Order complete

[Frontend]
2026-03-29T10:30:46.789Z | req_xyz123 | Order confirmation received

Search logs with correlationId=req_xyz123 → See entire flow!
```

## Best Practices

1. **Generate on entry** - Create in API gateway/load balancer
2. **Pass to all services** - Include in all HTTP headers
3. **Store in logs** - Always include in log context
4. **Use in distributed tracing** - Link to APM tools
5. **Respect client-provided IDs** - Allow override for client-side tracking
6. **Include in responses** - Help clients debug their requests
7. **Rotate format periodically** - For security
8. **Monitor correlation ID propagation** - Ensure 100% coverage

## Common Anti-Patterns

### ❌ Not Forwarding Between Services

```javascript
// BAD - Loses correlation ID
const response = await fetch('http://internal-service/api/endpoint', {
  method: 'POST',
  body: JSON.stringify(data)
  // Missing X-Correlation-ID header!
});
```

### ❌ Regenerating on Each Call

```javascript
// BAD - Different ID for each log
app.use((req, res, next) => {
  req.correlationId = uuidv4();  // New ID every request! Wrong!
  next();
});
```

### ❌ Not Including in Async Operations

```javascript
// BAD - Loses correlation ID in async
setTimeout(async () => {
  logger.info({
    event: 'async_operation'
    // No correlationId - can't track!
  });
}, 1000);
```

