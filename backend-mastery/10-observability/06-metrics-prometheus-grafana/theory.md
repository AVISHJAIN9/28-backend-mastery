# Metrics: Prometheus & Grafana Theory

## What are Metrics?

Metrics are numerical measurements of system behavior captured over time. They show what's happening with your application: requests, errors, latency, memory usage, database connections.

### Metrics vs Logs

```
LOGS - What happened (events, errors)
"User john@email.com logged in at 10:30:45"

METRICS - Aggregated measurements (time series)
"1000 users logged in this hour"
```

## Types of Metrics

### 1. Counter

Monotonically increasing value. Goes up, never down.

```javascript
const requestCounter = new Counter({
  name: 'http_requests_total',
  help: 'Total HTTP requests',
  labelNames: ['method', 'status']
});

app.get('/api/users', (req, res) => {
  res.json(users);
  requestCounter.inc({ method: 'GET', status: 200 });
});

// Metric over time:
// 10:00 → 523 total requests
// 10:01 → 531 total requests (531 - 523 = 8 new requests)
```

### 2. Gauge

Can go up or down. Current value at a moment in time.

```javascript
const memoryUsage = new Gauge({
  name: 'process_memory_bytes',
  help: 'Process memory usage in bytes'
});

setInterval(() => {
  const used = process.memoryUsage().heapUsed;
  memoryUsage.set(used);
}, 1000);

// Metric over time:
// 10:00 → 245 MB
// 10:01 → 412 MB (went up)
// 10:02 → 389 MB (went down after GC)
```

### 3. Histogram

Measures distribution of values (latency, request size).

```javascript
const requestDuration = new Histogram({
  name: 'http_request_duration_seconds',
  help: 'HTTP request duration',
  buckets: [0.1, 0.5, 1, 2, 5],
  labelNames: ['method']
});

app.get('/api/users', (req, res, next) => {
  const timer = requestDuration.startTimer({ method: 'GET' });
  
  res.json(users);
  
  timer();  // Stop timer, record latency
});

// Metric output:
// http_request_duration_seconds_bucket{le="0.1"} 250  (250 under 100ms)
// http_request_duration_seconds_bucket{le="0.5"} 800  (800 under 500ms)
// http_request_duration_seconds_bucket{le="1"} 950    (950 under 1s)
```

### 4. Summary

Similar to histogram, different quantiles.

```javascript
const requestSize = new Summary({
  name: 'http_request_size_bytes',
  help: 'Request body size',
  percentiles: [0.5, 0.9, 0.99]
});

app.post('/api/users', (req, res) => {
  requestSize.observe(JSON.stringify(req.body).length);
  res.json({ id: 123 });
});
```

## Prometheus Setup

### Installation

```bash
npm install prom-client
```

### Basic Setup

```javascript
const prometheus = require('prom-client');

// Create metrics
const httpRequests = new prometheus.Counter({
  name: 'http_requests_total',
  help: 'Total HTTP requests',
  labelNames: ['method', 'route', 'status']
});

const httpRequestDuration = new prometheus.Histogram({
  name: 'http_request_duration_seconds',
  help: 'HTTP request duration',
  buckets: [0.1, 0.5, 1, 2, 5],
  labelNames: ['method', 'route']
});

const dbConnections = new prometheus.Gauge({
  name: 'database_connections',
  help: 'Active database connections',
  labelNames: ['pool']
});

// Middleware to track metrics
app.use((req, res, next) => {
  const timer = httpRequestDuration.startTimer({
    method: req.method,
    route: req.route?.path || req.path
  });
  
  res.on('finish', () => {
    httpRequests.inc({
      method: req.method,
      route: req.route?.path || req.path,
      status: res.statusCode
    });
    timer();
  });
  
  next();
});

// Expose metrics endpoint
const register = prometheus.register;

app.get('/metrics', (req, res) => {
  res.set('Content-Type', register.contentType);
  res.end(register.metrics());
});
```

### Starting Prometheus Server

```bash
# Install Prometheus
brew install prometheus

# prometheus.yml config
cat > prometheus.yml << 'EOF'
global:
  scrape_interval: 15s

scrape_configs:
  - job_name: 'nodejs-app'
    static_configs:
      - targets: ['localhost:3000']
EOF

# Start Prometheus
prometheus --config.file=prometheus.yml
```

## Common Metrics to Track

### Request Metrics

```javascript
const requestMetrics = {
  total: new prometheus.Counter({
    name: 'http_requests_total',
    labelNames: ['method', 'status']
  }),
  duration: new prometheus.Histogram({
    name: 'http_request_duration_seconds',
    buckets: [0.01, 0.05, 0.1, 0.5, 1, 2, 5],
    labelNames: ['method']
  }),
  size: new prometheus.Summary({
    name: 'http_request_size_bytes',
    labelNames: ['method']
  })
};

app.use((req, res, next) => {
  const timer = requestMetrics.duration.startTimer();
  
  res.on('finish', () => {
    requestMetrics.total.inc({
      method: req.method,
      status: res.statusCode
    });
    requestMetrics.size.observe(
      JSON.stringify(req.body).length
    );
    timer();
  });
  
  next();
});
```

### Business Metrics

```javascript
const businessMetrics = {
  ordersCreated: new prometheus.Counter({
    name: 'orders_created_total',
    help: 'Total orders created',
    labelNames: ['region', 'currency']
  }),
  orderValue: new prometheus.Histogram({
    name: 'order_value_dollars',
    help: 'Order value distribution',
    buckets: [10, 50, 100, 500, 1000]
  }),
  usersActive: new prometheus.Gauge({
    name: 'users_active',
    help: 'Currently active users'
  })
};

app.post('/api/orders', (req, res) => {
  const order = createOrder(req.body);
  
  businessMetrics.ordersCreated.inc({
    region: req.user.region,
    currency: order.currency
  });
  
  businessMetrics.orderValue.observe(order.total);
  
  res.json(order);
});

app.get('/api/users/active', (req, res) => {
  const count = getActiveUserCount();
  businessMetrics.usersActive.set(count);
  res.json({ active: count });
});
```

### Database Metrics

```javascript
const dbMetrics = {
  queryDuration: new prometheus.Histogram({
    name: 'db_query_duration_seconds',
    buckets: [0.001, 0.01, 0.1, 0.5, 1],
    labelNames: ['operation', 'table']
  }),
  connections: new prometheus.Gauge({
    name: 'db_connections_active',
    labelNames: ['pool']
  }),
  errors: new prometheus.Counter({
    name: 'db_errors_total',
    labelNames: ['operation']
  })
};

const queryWithMetrics = async (operation, table, fn) => {
  const timer = dbMetrics.queryDuration.startTimer({
    operation,
    table
  });
  
  try {
    const result = await fn();
    timer();
    return result;
  } catch (error) {
    dbMetrics.errors.inc({ operation });
    throw error;
  }
};

// Usage
app.get('/api/users/:id', async (req, res) => {
  const user = await queryWithMetrics(
    'SELECT',
    'users',
    () => db.query('SELECT * FROM users WHERE id = ?', [req.params.id])
  );
  res.json(user);
});
```

## Grafana Dashboards

### Installing Grafana

```bash
brew install grafana
brew services start grafana
# Open localhost:3000
```

### Creating Dashboard

1. Add Prometheus datasource: http://localhost:9090
2. Create panels with queries:

```
# HTTP Request Rate
rate(http_requests_total[1m])

# Error Rate
rate(http_requests_total{status=~"[45].."}[1m])

# Request Latency (p95)
histogram_quantile(0.95, 
  rate(http_request_duration_seconds_bucket[5m])
)

# Database Connection Count
database_connections_active

# Active Users
users_active
```

## Real-World Monitoring Scenario

### E-commerce Dashboard

```javascript
// Tracked metrics
app.post('/api/checkout', async (req, res) => {
  const startTime = Date.now();
  
  try {
    const cart = validateCart(req.body.cartId);
    const charge = await processPayment(cart);
    
    // Track successful order
    const orderValue = charge.amount / 100;
    metrics.ordersCreated.inc({
      region: req.user.region,
      currency: charge.currency
    });
    metrics.orderValue.observe(orderValue);
    metrics.orderDuration.observe(
      (Date.now() - startTime) / 1000
    );
    
    res.json({ success: true, orderId: charge.id });
    
  } catch (error) {
    metrics.checkoutErrors.inc({
      type: error.type,
      stage: error.stage
    });
    
    res.status(500).json({ error: 'Checkout failed' });
  }
});

// Grafana visualizations:
// - Orders per minute (rate(orders_created_total[1m]))
// - Revenue per hour (sum(rate(order_value[1h])))
// - Checkout success rate (Orders / failed)
// - P95 checkout latency
```

## Best Practices

1. **Use consistent naming** - prometheus_name_total for counters
2. **Label wisely** - Don't create unbounded labels
3. **Sample wisely** - Don't track every request parameter
4. **Aggregate in Prometheus** - Do math there, not in app
5. **Set appropriate buckets** - Match expected latencies
6. **Monitor the monitor** - Track Prometheus scrape duration
7. **Use recording rules** - Pre-compute common queries
8. **Set alerts** - Don't just visualize

## Common Anti-Patterns

### ❌ Unbounded Labels

```javascript
// BAD - Creates new metric for each user
metrics.userAction.inc({ userId: req.user.id });
// If 1M users, creates 1M time series!

// GOOD - Use user segment
const segment = req.user.isPremium ? 'premium' : 'free';
metrics.userAction.inc({ segment });
```

### ❌ Cardinality Explosion

```javascript
// BAD - Every URL becomes a label (thousands of values)
metrics.requests.inc({ url: req.url });

// GOOD - Group into routes
metrics.requests.inc({ route: req.route.path });
```

### ❌ Calculating in Application

```javascript
// BAD - Calculate error rate in app
const errorRate = errors / total;
metrics.errorRate.observe(errorRate);

// GOOD - Let Prometheus calculate
metrics.requests.inc({ status: 'error' });
metrics.requests.inc({ status: 'success' });
// Then in Prometheus: rate(requests{status="error"}[5m]) / rate(requests[5m])
```

