# Log Levels: debug, info, warn, error Theory

## Understanding Log Levels

Log levels are severity classifications that help filter and manage log output. They range from TRACE (most verbose) to FATAL (least verbose).

### Standard Log Levels

```
FATAL/CRITICAL - Application cannot continue (0)
ERROR           - Error condition (1)
WARN            - Warning condition (2)
INFO            - Informational message (3)
DEBUG           - Debug-level messages (4)
TRACE/VERBOSE   - Very detailed information (5)
```

## Log Level Hierarchy

```
Production:    ERROR -> WARN -> INFO
Development:   DEBUG -> INFO -> WARN -> ERROR
Testing:       TRACE -> DEBUG -> INFO -> WARN -> ERROR

Lower numbers = Higher priority (shown first)
When you set level to WARN, ERROR messages are shown too
```

## Log Levels in Detail

### ERROR Level

```javascript
// Use ERROR when:
// - Unexpected error occurred
// - Request failed
// - Database operation failed
// - External API call failed

logger.error({
  type: 'database_error',
  message: 'Connection timeout',
  operation: 'query_users',
  duration: '5000ms',
  retryAttempt: 3,
  timestamp: new Date(),
  stack: error.stack
});

logger.error({
  type: 'payment_failure',
  orderId: '12345',
  amount: 99.99,
  errorCode: 'INSUFFICIENT_FUNDS',
  gateway: 'stripe',
  userId: 'user123'
});
```

### WARN Level

```javascript
// Use WARN when:
// - Deprecated API used
// - Performance degradation
// - Resource approaching limit
// - Retry happening
// - Unusual but recovering situation

logger.warn({
  type: 'deprecated_api',
  endpoint: '/api/v1/users',
  message: 'This endpoint will be removed in v3',
  userId: 'user123'
});

logger.warn({
  type: 'slow_query',
  query: 'SELECT * FROM users WHERE role = ?',
  duration: '2500ms',
  threshold: '1000ms',
  database: 'postgresql'
});

logger.warn({
  type: 'disk_space_low',
  available: '5GB',
  threshold: '10GB',
  mountPoint: '/var/log'
});

logger.warn({
  type: 'rate_limit_approached',
  userId: 'user456',
  requestsUsed: 950,
  limit: 1000,
  windowMs: 3600000
});
```

### INFO Level

```javascript
// Use INFO when:
// - Successful operation
// - Application startup/shutdown
// - Business event occurred
// - Configuration loaded
// - Service became available

logger.info({
  event: 'application_started',
  version: '2.1.0',
  environment: 'production',
  port: 8000,
  timestamp: new Date()
});

logger.info({
  event: 'user_registered',
  userId: 'new_user_id',
  email: 'user@example.com',
  signupMethod: 'email',
  timestamp: new Date()
});

logger.info({
  event: 'order_completed',
  orderId: '12345',
  customerId: 'customer_id',
  totalAmount: 299.99,
  itemCount: 5,
  timestamp: new Date()
});

logger.info({
  event: 'database_connected',
  host: 'db.prod.example.com',
  pool: { min: 10, max: 20 },
  connectionTime: '245ms',
  timestamp: new Date()
});
```

### DEBUG Level

```javascript
// Use DEBUG when:
// - Tracing code execution
// - Function entered/exited
// - Variable values at checkpoints
// - SQL queries generated
// - Not needed in production usually

logger.debug({
  type: 'function_enter',
  function: 'processUserPayment',
  userId: 'user123',
  orderId: 'order456',
  arguments: { amount: 99.99, currency: 'USD' }
});

logger.debug({
  type: 'sql_query',
  query: 'SELECT * FROM orders WHERE userId = ? AND status = ?',
  params: ['user123', 'pending'],
  executionTime: '45ms'
});

logger.debug({
  type: 'cache_hit',
  key: 'user:profile:user123',
  hit: true,
  source: 'redis'
});

logger.debug({
  type: 'function_exit',
  function: 'processUserPayment',
  result: { success: true, transactionId: 'txn_123' },
  executionTime: '523ms'
});
```

### TRACE/VERBOSE Level

```javascript
// Use TRACE for extreme detail
// Usually disabled in production

logger.trace({
  type: 'loop_iteration',
  iteration: 42,
  item: { id: 999, status: 'processing' },
  elapsed: '50ms'
});

logger.trace({
  type: 'variable_state',
  variables: {
    userCount: 1523,
    cache: { hits: 500, misses: 50 },
    memory: '245MB'
  }
});
```

## Using Log Levels in Express

### Setting Global Level

```javascript
const logger = winston.createLogger({
  level: process.env.LOG_LEVEL || 'info'
});

// In .env:
// Development: LOG_LEVEL=debug
// Staging: LOG_LEVEL=info
// Production: LOG_LEVEL=warn
```

### Per-Transport Level

```javascript
const logger = winston.createLogger({
  level: 'debug',
  transports: [
    new winston.transports.Console({
      level: 'info'  // Only INFO and above to console
    }),
    new winston.transports.File({
      filename: 'error.log',
      level: 'error'  // Only ERROR and FATAL to file
    })
  ]
});
```

## Conditional Logging Based on Level

```javascript
// Manual level checking
if (logger.isInfoEnabled()) {
  // Expensive operation to log
  const detailedInfo = expensiveCalculation();
  logger.info({ details: detailedInfo });
}

// More efficient - avoid expensive calls
logger.debug({ data: expensiveData() });  // Won't execute if level is WARN
```

## Log Level Strategy for Microservices

### Local Development
```
LOG_LEVEL=debug
- See everything locally
- Trace function calls
- SQL queries
- Cache operations
```

### Staging
```
LOG_LEVEL=info
- Application events
- Successful operations
- Service connections
- No debug noise
```

### Production
```
LOG_LEVEL=warn
- Problems only
- Exceptional situations
- Degradation warnings
- Reduced I/O overhead
```

### Emergency Production Debugging
```javascript
// Temporarily increase level via environment variable
// without changing code
process.env.LOG_LEVEL = 'debug';

logger.level = process.env.LOG_LEVEL;

logger.debug('Now showing debug logs');
```

## Real-World Logging Scenarios

### Scenario 1: E-commerce Checkout

```javascript
app.post('/api/checkout', async (req, res) => {
  const { cartId, paymentMethod } = req.body;
  
  try {
    logger.info({
      event: 'checkout_started',
      cartId,
      paymentMethod,
      userId: req.user.id
    });
    
    // Validate cart
    const cart = await validateCart(cartId);
    logger.debug({
      event: 'cart_validated',
      cartId,
      itemCount: cart.items.length,
      total: cart.total
    });
    
    // Process payment
    const payment = await processPayment(paymentMethod, cart.total);
    logger.info({
      event: 'payment_processed',
      cartId,
      transactionId: payment.id,
      amount: payment.amount
    });
    
    res.json({ success: true });
  } catch (error) {
    logger.error({
      event: 'checkout_failed',
      cartId,
      errorType: error.constructor.name,
      errorMessage: error.message,
      userId: req.user?.id
    });
    res.status(500).json({ error: 'Checkout failed' });
  }
});
```

### Scenario 2: API Rate Limiting

```javascript
const rateLimit = (req, res, next) => {
  const key = `rate:${req.user.id}`;
  const count = redis.incr(key);
  const limit = 100;
  const window = 3600;
  
  if (count === 1) {
    redis.expire(key, window);
  }
  
  logger.debug({
    event: 'rate_check',
    userId: req.user.id,
    count,
    limit
  });
  
  if (count > limit) {
    logger.warn({
      event: 'rate_limit_exceeded',
      userId: req.user.id,
      count,
      limit,
      ip: req.ip
    });
    
    return res.status(429).json({
      error: 'Too many requests'
    });
  }
  
  next();
};
```

## Log Level Anti-Patterns

### ❌ Everything at ERROR Level

```javascript
// BAD - Can't distinguish problems from operations
logger.error('User logged in');
logger.error('Payment processed');
logger.error('Database connected');
```

### ❌ No Logging at Production

```javascript
// BAD - Can't troubleshoot when issues arise
if (process.env.NODE_ENV === 'development') {
  logger.info('Order created');
}
```

### ❌ Logging Sensitive Data at INFO Level

```javascript
// BAD - Logs contain passwords, tokens
logger.info({
  user: 'john@example.com',
  password: 'mySecretPassword123',
  apiToken: 'sk_live_xxxxxx'
});
```

## Best Practices

1. **Set appropriate level per environment**
2. **ERROR for failures and exceptions**
3. **WARN for unusual situations that recover**
4. **INFO for important business events**
5. **DEBUG for development tracing only**
6. **Never log sensitive data**
7. **Group related logs with event names**
8. **Include context (userId, requestId, etc.)**

