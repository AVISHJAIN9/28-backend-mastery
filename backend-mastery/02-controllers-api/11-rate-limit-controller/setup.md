# Setup Guide - Rate Limiting

## Installation

```bash
npm install express-rate-limit redis helmet dotenv
```

## Environment Variables

```env
HTTP_PORT=5011
NODE_ENV=development
REDIS_URL=redis://localhost:6379
RATE_LIMIT_WINDOW_MS=900000
RATE_LIMIT_MAX_REQUESTS=100
```

## Running

```bash
# Start Redis first (if using Redis backend)
redis-server

# Start API server
npm start
```

## Testing

**Exceed Rate Limit**:
```bash
# Send 101 requests rapidly
for i in {1..101}; do
  curl http://localhost:5011/api/posts
done

# 101st request returns 429
```

## Middleware Configuration

```javascript
const rateLimit = require('express-rate-limit');

// Global limit: 100 requests per 15 minutes
const limiter = rateLimit({
  windowMs: 15 * 60 * 1000,
  max: 100,
  message: 'Too many requests',
  standardHeaders: true,
  legacyHeaders: false
});

app.use(limiter);

// Strict limit on login: 5 attempts per 15 minutes
const loginLimiter = rateLimit({
  windowMs: 15 * 60 * 1000,
  max: 5,
  skipSuccessfulRequests: true  // Only count failed attempts
});

app.post('/api/login', loginLimiter, loginHandler);
```
