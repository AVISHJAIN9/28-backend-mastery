# Module 01: Structured Logging with Winston & Pino

Learn professional logging practices using Winston and Pino. Understand structured logging, log levels, correlation IDs, and how to aggregate logs across services.

## What You'll Learn

- **Structured Logging** - JSON-formatted logs vs unstructured text
- **Winston Framework** - Multi-transport logging setup
- **Log Levels** - When to use error, warn, info, and debug
- **Correlation IDs** - Track requests across services
- **Child Loggers** - Add context to logs automatically
- **File Rotation** - Manage logs efficiently
- **Performance Logging** - Track slow queries and operations

## Quick Start

### 1. Install Dependencies

```bash
npm install
```

### 2. Setup Environment

```bash
cp .env.example .env
```

### 3. Start Server

```bash
npm run dev
```

Server runs on: `http://localhost:4001`

## API Endpoints

### View & Filter Logs

```bash
# Get all logs
curl http://localhost:4001/api/logs

# Filter by event
curl http://localhost:4001/api/logs/filter?event=checkout_started

# Filter by level
curl http://localhost:4001/api/logs/filter?level=error
```

### Create Log Events

```bash
# Create an info log
curl -X POST http://localhost:4001/api/logs/create \
  -H "Content-Type: application/json" \
  -d '{
    "event": "user_signup",
    "level": "info",
    "data": {
      "userId": "123",
      "email": "user@example.com"
    }
  }'
```

### Get Logger Configuration

```bash
curl http://localhost:4001/api/logger/info
```

### Get Log Statistics

```bash
curl http://localhost:4001/api/logs/statistics
```

### Simulate Checkout

```bash
curl -X POST http://localhost:4001/api/checkout \
  -H "Content-Type: application/json" \
  -d '{"userId": "1", "amount": 99.99}'
```

## Key Concepts

### 1. Structured Logging

JSON-formatted logs with consistent schema:

```json
{
  "event": "authentication",
  "userId": "alice",
  "method": "password",
  "success": true,
  "timestamp": "2026-03-29T10:30:45Z",
  "ip": "192.168.1.1"
}
```

**Benefits:**
- Searchable and filterable
- Aggregate across services
- Easy alerting
- Data analysis

### 2. Log Levels

- **ERROR** - Critical failures
- **WARN** - Warnings, retryable errors
- **INFO** - Business events
- **DEBUG** - Development tracing

### 3. Correlation IDs

Track requests through your entire system:

```
POST /api/checkout
X-Correlation-ID: req_82f4c9a1

[Order Service] → Order created
[Payment Service] → Payment authorized
[Email Service] → Confirmation sent

All logs have same correlation ID!
```

### 4. Winston Configuration

Multiple transports (File, Console, HTTP):

```javascript
const logger = winston.createLogger({
  level: 'info',
  format: winston.format.json(),
  transports: [
    new winston.transports.File({ filename: 'error.log', level: 'error' }),
    new winston.transports.File({ filename: 'combined.log' }),
    new winston.transports.Console()
  ]
});
```

### 5. Child Loggers

Add context automatically:

```javascript
const log = logger.child({
  requestId: req.id,
  userId: req.user.id
});

log.info('Processing payment');
// Automatically includes requestId and userId
```

## Real-World Example

```javascript
app.post('/api/checkout', async (req, res) => {
  const log = logger.child({ correlationId: req.correlationId });
  
  try {
    log.info({ event: 'checkout_started', cartId: req.body.cartId });
    
    const cart = await validateCart(req.body.cartId);
    log.debug({ event: 'cart_validated', itemCount: cart.items.length });
    
    const payment = await processPayment(cart);
    log.info({ event: 'payment_processed', transactionId: payment.id });
    
    res.json({ success: true });
  } catch (error) {
    log.error({ event: 'checkout_failed', error: error.message });
    res.status(500).json({ error: 'Checkout failed' });
  }
});
```

## Common Mistakes

❌ **Logging sensitive data**
```javascript
// Bad
logger.info({ user: user.email, password: user.password });

// Good
logger.info({ user: user.email });
```

❌ **Not using correlation IDs**
```javascript
// Can't trace request through services
logger.info('Order created');

// Good - includes correlation ID
logger.info({ event: 'order_created', correlationId });
```

❌ **Unstructured logs**
```javascript
// Bad
console.log('User logged in at ' + new Date());

// Good
logger.info({ event: 'user_login', timestamp: new Date() });
```

## Log File Rotation

Automatically manages log file sizes:

```javascript
new winston.transports.File({
  filename: 'app.log',
  maxsize: 5242880,    // 5MB before rotation
  maxFiles: 5,         // Keep 5 files
  tailable: true
});
```

## Performance Tips

### Production Settings

```javascript
// Use async transport (doesn't block)
// Configure appropriate log level
// Batch writes to reduce I/O
// Rotate large log files
```

## Testing Checklist

- [ ] View all logs via GET /api/logs
- [ ] Filter logs by event and level
- [ ] Create logs at different levels
- [ ] Check correlation IDs preserved
- [ ] Verify log files created
- [ ] Test error handling

## Further Learning

1. **Theory** - Read theory.md for comprehensive concepts
2. **Module 02** - Learn log levels in depth
3. **Module 03** - Implement correlation IDs
4. **Module 04** - Error tracking with Sentry
5. **Modules 05-09** - Additional observability tools

---

**Port:** 4001  
**Module:** 01-structured-logging-winston-pino  
**Section:** 10-observability

