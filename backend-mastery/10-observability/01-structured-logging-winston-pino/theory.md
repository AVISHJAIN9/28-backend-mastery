# Structured Logging with Winston & Pino Theory

## What is Structured Logging?

Structured logging captures log data in a consistent, machine-readable format (typically JSON) with key-value pairs instead of unstructured strings.

### Unstructured vs Structured

```javascript
// UNSTRUCTURED (Bad)
console.log('User athenticated successfully at 2026-03-29T10:30:45Z');
console.log('Payment processed $99.99 for order #123');

// STRUCTURED (Good)
logger.info({
  event: 'user_authenticated',
  userId: '456',
  timestamp: '2026-03-29T10:30:45Z',
  ip: '192.168.1.1',
  method: 'oauth'
});

logger.info({
  event: 'payment_processed',
  orderId: '123',
  amount: 99.99,
  currency: 'USD',
  status: 'success',
  timestamp: '2026-03-29T10:31:12Z'
});
```

## Why Structured Logging?

1. **Searchable** - Query logs by field values
2. **Parseable** - Automatically parse without regex
3. **Alertable** - Set alerts on specific fields
4. **Traceable** - Follow requests through systems
5. **Scalable** - Aggregate across microservices
6. **Analyzable** - Data science on logs

## Winston Overview

### Winston Features
```
- Multiple transports (console, file, HTTP)
- Log levels (error, warn, info, http, debug, verbose, silly)
- Formatters and colorization
- Child loggers with context
- Meta data and stack traces
```

### Winston Setup

```javascript
const winston = require('winston');

const logger = winston.createLogger({
  level: 'info',
  format: winston.format.json(),
  defaultMeta: { service: 'user-service' },
  transports: [
    new winston.transports.File({ filename: 'error.log', level: 'error' }),
    new winston.transports.File({ filename: 'combined.log' })
  ]
});

if (process.env.NODE_ENV !== 'production') {
  logger.add(new winston.transports.Console({
    format: winston.format.simple()
  }));
}
```

### Winston Log Format

```javascript
// Combine multiple formatters
const logFormat = winston.format.combine(
  winston.format.timestamp({ format: 'YYYY-MM-DD HH:mm:ss' }),
  winston.format.errors({ stack: true }),
  winston.format.json()
);

logger.format = logFormat;

// Output
{
  "level": "info",
  "message": "User logged in",
  "timestamp": "2026-03-29 10:30:45",
  "service": "user-service",
  "userId": "123",
  "ip": "192.168.1.1"
}
```

## Pino Overview

### Pino Features
```
- Ultra-fast JSON logging (faster than Winston)
- Child loggers with context
- Redact sensitive data
- Pretty printing for development
- Stream-based output
```

### Pino Setup

```javascript
const pino = require('pino');

const logger = pino({
  level: process.env.LOG_LEVEL || 'info',
  transport: {
    target: 'pino-pretty',
    options: {
      colorize: true,
      translateTime: 'SYS:standard',
      ignore: 'pid,hostname'
    }
  }
});

logger.info({ userId: 123 }, 'User logged in');
```

### Pino vs Winston

| Feature | Winston | Pino |
|---------|---------|------|
| Speed | Good | Excellent |
| Ecosystem | Large | Growing |
| Callbacks | Yes | No (streams) |
| Child Contexts | Yes | Yes |
| Pretty Print | Plugin | Built-in |
| Learning Curve | Moderate | Easy |

## Log Levels

```javascript
// Standard levels (highest to lowest priority)
logger.error('Critical error');      // 0
logger.warn('Warning message');      // 1
logger.info('Information');          // 2
logger.http('HTTP request');         // 3
logger.debug('Debug info');          // 4
logger.verbose('Verbose data');      // 5
logger.silly('Silly message');       // 6
```

## Common Logging Patterns

### Pattern 1: Request Logging

```javascript
app.use((req, res, next) => {
  const startTime = Date.now();
  
  res.on('finish', () => {
    const duration = Date.now() - startTime;
    
    logger.http({
      method: req.method,
      path: req.path,
      statusCode: res.statusCode,
      duration: `${duration}ms`,
      timestamp: new Date().toISOString()
    });
  });
  
  next();
});
```

### Pattern 2: Error Logging

```javascript
process.on('uncaughtException', (error) => {
  logger.error({
    message: error.message,
    stack: error.stack,
    type: 'uncaughtException',
    timestamp: new Date()
  });
});

app.use((error, req, res, next) => {
  logger.error({
    error: error.message,
    stack: error.stack,
    path: req.path,
    method: req.method,
    userId: req.user?.id,
    timestamp: new Date()
  });
  
  res.status(500).json({ error: 'Internal server error' });
});
```

### Pattern 3: Business Logic Logging

```javascript
async function processPayment(orderId, amount) {
  logger.info({
    event: 'payment_start',
    orderId,
    amount,
    timestamp: new Date()
  });
  
  try {
    const result = await chargeCard(amount);
    
    logger.info({
      event: 'payment_success',
      orderId,
      amount,
      transactionId: result.id,
      timestamp: new Date()
    });
    
    return result;
  } catch (error) {
    logger.error({
      event: 'payment_failed',
      orderId,
      amount,
      error: error.message,
      code: error.code,
      timestamp: new Date()
    });
    
    throw error;
  }
}
```

## Sensitive Data Redaction

### Winston with Redaction

```javascript
const format = winston.format.combine(
  winston.format.json(),
  winston.format((info) => {
    // Redact passwords
    if (info.password) {
      info.password = '***REDACTED***';
    }
    if (info.creditCard) {
      info.creditCard = `****-****-****-${info.creditCard.slice(-4)}`;
    }
    return info;
  })()
);
```

### Pino with Redaction

```javascript
const logger = pino({
  redact: {
    paths: [
      'password',
      'creditCard',
      'token',
      'apiKey',
      'req.headers.authorization'
    ],
    remove: true  // Remove instead of redact with [Redacted]
  }
});

logger.info({
  userId: 123,
  password: 'secret123',  // Will be [Redacted]
  creditCard: '4111111111111111'
});
```

## Child Logger Context

### Winston Child Loggers

```javascript
const childLogger = logger.child({
  requestId: req.id,
  userId: req.user.id,
  service: 'payment'
});

childLogger.info('Processing payment');
// Output includes requestId, userId, service automatically
```

### Pino Child Loggers

```javascript
const childLogger = logger.child({
  requestId: req.id,
  orderId: orderId
});

childLogger.info('Order processing started');
```

## Performance Considerations

### Winston Performance
```javascript
// Batch writes for better performance
new winston.transports.File({
  filename: 'app.log',
  maxsize: 5242880,  // 5MB
  maxFiles: 5,
  tailable: true     // Circle logs
});
```

### Pino Performance
```javascript
// Pino is naturally fast - outputs to streams
const fs = require('fs');
const logStream = fs.createWriteStream('app.log');

const logger = pino(logStream);
// Lightning fast - minimal overhead
```

## Log Aggregation

### Log Shipping Pattern

```javascript
const { ElasticsearchTransport } = require('winston-elasticsearch');

logger.add(new ElasticsearchTransport({
  level: 'info',
  clientOpts: { node: 'http://localhost:9200' },
  index: 'logs'
}));

// All logs go to Elasticsearch for centralized analysis
```

## Best Practices

1. **Use structured format** - Always JSON in production
2. **Include context** - userId, requestId, service name
3. **Redact sensitive data** - Passwords, tokens, cards
4. **Use appropriate levels** - Don't log everything as INFO
5. **Include timestamps** - Essential for debugging
6. **Add stack traces** - Capture full error context
7. **Monitor log volume** - Logs can grow quickly
8. **Rotate log files** - Prevent disk space issues

