# Error Tracking with Sentry Theory

## What is Sentry?

Sentry is an error tracking and performance monitoring platform that automatically captures exceptions, errors, and performance issues in production applications. It provides real-time alerts and detailed error analysis.

### Error Tracking Without Sentry

```
Production Error Occurs
↓
User reports issue via email/chat
↓
Developer checks logs manually
↓
Hard to find exact error
↓
Takes hours/days to fix
```

### Error Tracking With Sentry

```
Production Error Occurs
↓
Sentry instantly captures
↓
Automatic alert to Slack/Email
↓
Full stack trace + context visible
↓
Fixed in minutes
```

## Setting Up Sentry

### Installation

```bash
npm install @sentry/node @sentry/tracing
```

### Basic Configuration

```javascript
const Sentry = require('@sentry/node');

Sentry.init({
  dsn: process.env.SENTRY_DSN,  // From Sentry.io
  environment: process.env.NODE_ENV,
  tracesSampleRate: 1.0,  // Send all traces
  attachStacktrace: true,
  maxBreadcrumbs: 50
});

app.use(Sentry.Handlers.requestHandler());
app.use(Sentry.Handlers.errorHandler());
```

## Automatic Error Capture

### Uncaught Exceptions

```javascript
// Sentry automatically captures
const handler = (req, res) => {
  throw new Error('Something went wrong!');
};

// Sentry captures this automatically
process.on('unhandledRejection', (reason, promise) => {
  Sentry.captureException(reason);
});
```

### Global Error Handler

```javascript
app.use((error, req, res, next) => {
  // Sentry captures automatically before this
  Sentry.captureException(error);
  
  res.status(error.status || 500).json({
    error: error.message
  });
});
```

## Manual Error Reporting

### Basic Error Capture

```javascript
try {
  const result = await riskyOperation();
} catch (error) {
  Sentry.captureException(error);
}
```

### With Extra Context

```javascript
try {
  await processPayment(orderId, amount);
} catch (error) {
  Sentry.captureException(error, {
    tags: {
      component: 'payment',
      orderId,
      paymentGateway: 'stripe'
    },
    extra: {
      amount,
      currency: 'USD',
      customerEmail: customer.email,
      retryAttempt: 3
    }
  });
}
```

### Message Capture (Non-Error)

```javascript
// Capture informational message
Sentry.captureMessage('Payment processing started', 'info', {
  tags: {
    orderId: '12345'
  }
});

// Capture warning (unusual but not error)
Sentry.captureMessage('Database response time > 2s', 'warning');
```

## Breadcrumbs

Breadcrumbs are the trail of events leading up to an error. They show what happened before the crash.

### Automatic Breadcrumbs

```javascript
// Sentry automatically captures:
// - HTTP requests
// - Console logs
// - Database queries
// - User interactions (frontend)

app.get('/api/users/:id', (req, res) => {
  // HTTP request - breadcrumb add automatically
  
  logger.warn('Slow query detected');  // breadcrumb added
  
  db.query('SELECT * FROM users');    // breadcrumb added
  
  throw new Error('Oops!');           // Sentry captures with all breadcrumbs!
});
```

### Manual Breadcrumbs

```javascript
// Explicitly add breadcrumbs
Sentry.addBreadcrumb({
  message: 'User initiated checkout',
  level: 'info',
  category: 'user_action',
  data: {
    cartTotal: 299.99,
    itemCount: 5
  }
});

Sentry.addBreadcrumb({
  message: 'Payment API called',
  level: 'debug',
  category: 'api',
  data: {
    endpoint: 'https://api.stripe.com/v1/charges',
    method: 'POST'
  }
});

// Later when error occurs, these breadcrumbs are included
try {
  const charge = await stripe.charges.create({
    amount: 29999,
    currency: 'usd'
  });
} catch (error) {
  Sentry.captureException(error);
  // Error report now includes both breadcrumbs!
}
```

## User Context

Identify who the error affected.

```javascript
app.use((req, res, next) => {
  if (req.user) {
    Sentry.setUser({
      id: req.user.id,
      email: req.user.email,
      username: req.user.username
    });
  }
  next();
});

// When error occurs, Sentry knows which user was affected
try {
  await deleteUserAccount(req.user.id);
} catch (error) {
  Sentry.captureException(error);
  // Error report shows: "Affected user: user@example.com"
}
```

### Clear User Context

```javascript
app.post('/api/logout', (req, res) => {
  Sentry.setUser(null);  // Clear user from context
  res.json({ success: true });
});
```

## Tags vs Extra Data

### Tags (Searchable)

```javascript
Sentry.captureException(error, {
  tags: {
    // Use tags for values you'll filter/search by
    environment: 'production',
    service: 'payment-service',
    version: '2.1.0',
    database: 'postgresql'
  }
});

// In Sentry UI: Filter by tags easily
// "service: payment-service" → See all payment errors
// "environment: production" → See production-only issues
```

### Extra Data (Detailed Info)

```javascript
Sentry.captureException(error, {
  extra: {
    // Use extra for detailed context
    query: 'SELECT * FROM users WHERE id = ?',
    queryParams: [123],
    executionTime: '2345ms',
    rowsReturned: 1,
    dbConnectionPool: {
      active: 15,
      idle: 5,
      queued: 2
    }
  }
});
```

## Real-World Scenario: E-commerce Checkout

```javascript
app.post('/api/checkout', async (req, res) => {
  Sentry.addBreadcrumb({
    message: 'Checkout initiated',
    category: 'user_action',
    data: { cartId: req.body.cartId }
  });
  
  try {
    // Validate cart
    const cart = await validateCart(req.body.cartId);
    
    Sentry.addBreadcrumb({
      message: 'Cart validated',
      level: 'debug',
      data: { itemCount: cart.items.length, total: cart.total }
    });
    
    // Process payment
    const payment = await stripe.charges.create({
      amount: cart.total * 100,
      currency: 'usd'
    });
    
    Sentry.addBreadcrumb({
      message: 'Payment processed',
      data: { transactionId: payment.id, status: payment.status }
    });
    
    res.json({ success: true, orderId: payment.id });
    
  } catch (error) {
    Sentry.captureException(error, {
      tags: {
        component: 'checkout',
        stage: error.stage || 'unknown'
      },
      extra: {
        cartId: req.body.cartId,
        userId: req.user.id
      }
    });
    
    // Sentry report includes:
    // 1. Full stack trace
    // 2. All breadcrumbs showing what happened
    // 3. User context
    // 4. Tags for filtering
    // 5. Extra data for debugging
    
    res.status(500).json({ error: 'Checkout failed' });
  }
});
```

## Performance Monitoring

### Transaction Tracing

```javascript
const transaction = Sentry.startTransaction({
  op: 'http.server',
  name: 'POST /api/checkout'
});

try {
  // Code being measured
  await processPayment();
  
  transaction.finish();
} catch (error) {
  transaction.setStatus('internal_error');
  Sentry.captureException(error);
}
```

### Custom Spans (Sub-operations)

```javascript
const transaction = Sentry.startTransaction({
  op: 'order_processing',
  name: 'Complete Order'
});

try {
  // Span 1: Validate
  const validateSpan = transaction.startChild({ op: 'validate_order' });
  await validateOrder(orderId);
  validateSpan.finish();
  
  // Span 2: Payment
  const paymentSpan = transaction.startChild({ op: 'process_payment' });
  await processPayment(amount);
  paymentSpan.finish();
  
  // Span 3: Notification
  const notifSpan = transaction.startChild({ op: 'send_notification' });
  await sendEmailConfirmation(email);
  notifSpan.finish();
  
  transaction.finish();
} catch (error) {
  Sentry.captureException(error);
}
```

## Release Tracking

Track which version of code caused errors.

```javascript
Sentry.init({
  dsn: process.env.SENTRY_DSN,
  release: `backend@${require('./package.json').version}`,
  environment: process.env.NODE_ENV
});

// When error occurs, Sentry shows:
// "This error started appearing in version 2.1.5"
// "This is a regression - fixed in 2.1.4, broke again in 2.1.5"
```

## Integration with Development Workflow

### Slack Integration

```
Sentry → Slack Channel
["Error Alert"]
🔴 Payment Processing Failed
Service: payment-service | Environment: production
User: user@example.com
Release: backend@2.1.5
[View on Sentry] [Assign] [Ignore]
```

### GitHub Integration

```javascript
// Create GitHub issues automatically
Sentry.init({
  integrations: [
    new Sentry.Integrations.GitHub({
      organization: 'mycompany',
      repository: 'backend'
    })
  ]
});

// First occurrence of error → Auto-create GitHub issue
// Issue tags with version and links to Sentry
```

## Sampling and Privacy

### Reduce Noise (Sample Errors)

```javascript
Sentry.init({
  // Only send 10% of errors (reduces quota usage)
  sampleRate: 0.1,
  
  // Only send errors with certain tags
  beforeSend(event) {
    if (event.tags.environment === 'development') {
      return null;  // Don't send dev errors
    }
    return event;
  }
});
```

### Redact Sensitive Data

```javascript
Sentry.init({
  beforeSend(event) {
    const breadcrumbs = event.breadcrumbs || [];
    
    breadcrumbs.forEach(crumb => {
      if (crumb.data) {
        // Redact passwords, tokens
        if (crumb.data.password) {
          crumb.data.password = '[REDACTED]';
        }
        if (crumb.data.token) {
          crumb.data.token = '[REDACTED]';
        }
      }
    });
    
    return event;
  }
});
```

## Common Patterns

### Pattern 1: Async Error Wrapper

```javascript
const asyncHandler = (fn) => (req, res, next) => {
  Promise.resolve(fn(req, res, next)).catch((error) => {
    Sentry.captureException(error, {
      tags: { endpoint: req.path }
    });
    next(error);
  });
};

app.get('/api/users/:id', asyncHandler(async (req, res) => {
  const user = await db.getUser(req.params.id);
  res.json(user);
}));
```

### Pattern 2: Error Classification

```javascript
const classifyError = (error) => {
  if (error.code === 'ECONNREFUSED') {
    return 'infrastructure';
  }
  if (error.message.includes('Validation')) {
    return 'validation';
  }
  if (error.message.includes('Unauthorized')) {
    return 'authentication';
  }
  return 'application';
};

try {
  await operation();
} catch (error) {
  Sentry.captureException(error, {
    tags: {
      errorType: classifyError(error)
    }
  });
}
```

## Best Practices

1. **Capture all unhandled errors** - Set up global handlers
2. **Add context** - Include user, tags, extra data
3. **Use breadcrumbs** - Track events leading to error
4. **Monitor releases** - Tag errors with version
5. **Integrate with Slack** - Alert team immediately
6. **Redact sensitive data** - No passwords or tokens
7. **Set appropriate sample rate** - Balance data vs cost
8. **Group related errors** - Use fingerprinting

