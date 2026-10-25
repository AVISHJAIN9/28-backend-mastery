# APM: Application Performance Monitoring with Datadog & New Relic Theory

## What is APM?

APM (Application Performance Monitoring) tools automatically track application performance, identify bottlenecks, and correlate performance with business metrics. They go beyond simple metrics to show full request traces and code-level insights.

### Without APM

```
Dashboard: "Checkout taking 5 seconds"
Questions:
- Which part is slow? (Payment? Database? External API?)
- Which users affected? (Random or pattern?)
- Is it always slow or sporadic?
- When did it start?
→ Hours of debugging
```

### With APM (Datadog/New Relic)

```
Dashboard: "Checkout taking 5 seconds"
Click to see breakdown:
├─ Database Query: 2000ms (Slow join on users table)
├─ Payment API: 1500ms (Stripe response time increased)
├─ Cache Fetch: 200ms (Normal)
├─ Email Queue: 300ms (Normal)

Correlation:
- Started when queries/min increased 2x
- Affected 15% of US-East users only
- Pattern: Every checkout with >10 items

→ Immediate diagnosis and fix
```

## Key APM Concepts

### Transactions (Traces)

A transaction is the entire request flow from entry to exit.

```javascript
// Example transaction:
POST /api/checkout
├─ Validate Cart (200ms)
├─ Check Inventory (400ms)
├─ Process Payment (1500ms)
│  ├─ Authorize Card (300ms)
│  ├─ Capture Charge (400ms)
│  └─ Update Balance (800ms)
├─ Create Order (300ms)
├─ Send Confirmation Email (200ms)
└─ Log Audit Event (100ms)

Total: 2700ms
```

### Spans

Spans are individual operations within a transaction.

```javascript
// Each span tracks:
- Operation name
- Duration
- Start/end time
- Tags/attributes
- Errors (if any)
- Child spans
```

### Apdex Score

Index showing what % of transactions are satisfactory.

```
Satisfactory (<1.5s): Happy users
Tolerable (1.5s - 4.5s): Users can continue
Frustrating (>4.5s): Users abandon

Apdex = (Satisfactory + Tolerable/2) / Total

Score 0.95 = 95% user satisfaction
```

## New Relic Integration

### Installation

```bash
npm install newrelic
```

### Configuration

```javascript
// index.js - MUST be first require
require('newrelic');

const express = require('express');
const app = express();

// New Relic automatically tracks:
// - HTTP requests
// - Database queries
// - External API calls
// - Errors and exceptions
```

### New Relic Config File

```javascript
// newrelic.js
module.exports = {
  app_name: ['Backend API'],
  license_key: process.env.NEW_RELIC_LICENSE_KEY,
  logging: {
    level: 'info'
  },
  // Sample 100% of transactions in dev
  // 5% in production (to reduce overhead)
  transaction_tracer: {
    sample_rate: process.env.NODE_ENV === 'production' ? 0.05 : 1.0
  }
};
```

## Datadog Integration

### Installation

```bash
npm install dd-trace
```

### Configuration

```javascript
// Initialize FIRST, before other requires
const tracer = require('dd-trace').init();

const express = require('express');
const app = express();

// Datadog automatically tracks
// Express, HTTP, Database, External APIs
```

### Environment Variables

```bash
export DD_SERVICE=backend-api
export DD_ENV=production
export DD_VERSION=1.2.0
export DD_TRACE_SAMPLE_RATE=0.1
```

## Custom Instrumentation

### Manual Spans (New Relic)

```javascript
const newrelic = require('newrelic');

app.post('/api/checkout', async (req, res) => {
  const transaction = newrelic.getTransaction();
  
  // Create named span
  const validateSpan = transaction.createSegment(
    'validate_cart',
    false,
    () => {
      return validateCart(req.body.cartId);
    }
  );
  
  const paymentSpan = transaction.createSegment(
    'process_payment',
    false,
    async () => {
      return await processPayment(validateSpan.cart);
    }
  );
  
  res.json({ orderId: paymentSpan.orderId });
});
```

### Manual Spans (Datadog)

```javascript
const tracer = require('dd-trace');

app.post('/api/checkout', async (req, res) => {
  // Automatically creates parent span
  
  // Create child spans
  const validateSpan = tracer.startSpan('validate_cart', {
    childOf: tracer.extract('http_headers', req.headers)
  });
  
  try {
    const cart = await validateCart(req.body.cartId);
    validateSpan.setTag('cart.items', cart.items.length);
  } finally {
    validateSpan.finish();
  }
  
  const paymentSpan = tracer.startSpan('process_payment');
  try {
    const payment = await processPayment(cart);
    paymentSpan.setTag('payment.amount', payment.amount);
  } finally {
    paymentSpan.finish();
  }
  
  res.json({ orderId: payment.id });
});
```

## Database Performance Monitoring

### Slow Query Detection

APM tools automatically flag slow database queries:

```
Query: SELECT * FROM orders WHERE user_id = ? AND created_at > ?
Duration: 2.5s (SLOW!)
Frequency: 47 times/min
Recommendation: Add index on (user_id, created_at)
Affected transactions: checkout (40%), user-profile (7%)
```

## Error Tracking in APM

APM captures all errors with context:

```javascript
try {
  await processPayment(amount);
} catch (error) {
  // APM automatically captures:
  // - Error type/message
  // - Stack trace
  // - Request context (user, URL, IP)
  // - Database queries leading to error
  // - External API calls
  // - Performance metrics
  
  throw error;
}

// Error analysis in APM:
// "Payment errors increased 300% at 14:23 UTC"
// "Correlation: Stripe API response time degradation"
// "Affected users: Primarily US-East and Europe regions"
// "Impact: $50K in failed transactions"
```

## Real-World Monitoring Scenario

### Checkout Performance Degradation

```javascript
// Week 1: Normal performance
GET /api/checkout → 800ms average
Payment Service: 200ms
Database: 300ms
Email: 200ms
Apdex: 0.98 (Excellent!)

// Week 2: Performance degrades
GET /api/checkout → 2.5s average
Payment Service: 2000ms (!!!!)
Database: 300ms
Email: 200ms
Apdex: 0.42 (Poor!)

APM Alert: "Checkout Apdex dropped 56%"
Investigation:
1. Click on affected transaction
2. See breakdown: Payment Service slow
3. Drill into Payment Service traces
4. Discover: Stripe API response time degraded
5. Check Stripe status page: "API Rate Limit Increased"
6. Solution: Implement request batching for Stripe calls
```

## Key APM Dashboards

### 1. Golden Signals

```
Latency:  0.95s (95th percentile)
Traffic:  5,200 requests/min
Errors:   0.8% (42 errors/min)
Saturation: 65% CPU, 72% Memory
```

### 2. Service Map

Visualize how services communicate:

```
Frontend
    ↓
API Gateway
    ↓
├─ Auth Service
├─ Order Service
│  ├─ Payment Service
│  │  └─ Stripe API
│  └─ Database
├─ Email Service
└─ Notifications Service
```

### 3. Error Rate Trends

```
Orders Processed: 50,000/day
Payment Errors: 250/day (0.5%)

By Error Type:
- Insufficient Funds: 40%
- Card Declined: 35%
- Rate Limited: 15%
- Timeout: 10%

Correlation: Rate limited errors spike
when system load >80%
```

## Performance Optimization with APM

### 1. Identify Slow Endpoints

APM shows slowest endpoints:

```
1. POST /api/orders - 2.3s
2. GET /api/users/:id - 1.8s
3. PUT /api/inventory - 1.6s
```

### 2. Find Slow Queries

APM highlights slow database calls:

```
SELECT * FROM orders o
JOIN order_items oi ON o.id = oi.order_id
JOIN products p ON oi.product_id = p.id
WHERE o.user_id = ?

Duration: 450ms (Slow!)
Count: 150/min

Fix: Add index on orders.user_id
After: 45ms (10x faster!)
```

### 3. Monitor External Services

APM shows which external services impact performance:

```
Stripe API calls: 200ms average
Twilio SMS: 800ms average (Slow!)
SendGrid Email: 300ms average

Solution: Queue Twilio calls async
```

## Sampling Strategy

### Development

```javascript
// Capture 100% of transactions in development
transaction_tracer.sample_rate = 1.0
```

### Production

```javascript
// Only sample 5% to reduce overhead
transaction_tracer.sample_rate = 0.05

// But capture 100% of errors
error_tracer.sample_rate = 1.0
// And 100% of transactions with status != 200
```

## Common Patterns

### Pattern: Identify N+1 Queries

```
Transaction: GET /api/orders/:id
Expected queries: 2 (order + items)
Actual queries: 52 (order + 50 N+1 item queries!)

APM shows:
SELECT * FROM orders WHERE id = ? (1.5ms)
SELECT * FROM order_items WHERE order_id = ? (5ms)
SELECT * FROM products WHERE id = ? (3ms) x 50 times!

Fix: Use JOIN or batch query instead
After: 2 queries, 12ms total
```

### Pattern: Cache Effectiveness

```
APM shows:
Cache hit rate: 23% (Low!)
Average request: 300ms
Without cache: Would be 1200ms

Recommendations:
- Increase TTL from 1hr to 4hrs
- Pre-warm cache on startup
- Cache entire result sets vs individual items

After optimization: 89% hit rate, 50ms requests
```

## Best Practices

1. **Sample appropriately** - Balance visibility vs. overhead
2. **Set realistic thresholds** - For Apdex targets
3. **Monitor continuously** - Not just during problems
4. **Create alerts** - For regression detection
5. **Correlate metrics** - Understand root causes
6. **Track business metrics** - Orders, revenue, not just technical metrics
7. **Regular reviews** - Weekly APM analysis
8. **Benchmark changes** - Before/after performance comparison

## Anti-Patterns

### ❌ Excessive Instrumentation

```javascript
// BAD - Tracking every variable
tracer.startSpan('loop_iteration', { item: element });
```

### ❌ High Sampling Rate in Production

```javascript
// BAD - 100% sampling causes overhead
sample_rate: 1.0  // in production
```

### ❌ Ignoring Performance Trends

```javascript
// BAD - Not investigating slow growth
// Week 1: 500ms average
// Week 2: 600ms average
// Week 3: 700ms average
// Week 4: 800ms average
// Month later: 2000ms average, user complaints!
```

