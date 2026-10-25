# Distributed Tracing with OpenTelemetry Theory

## What is Distributed Tracing?

Distributed tracing tracks a single request as it flows through multiple services in a microservices architecture. It shows the complete path: which services were called, in what order, how long each took, and where failures occurred.

### Problem Without Tracing

```
User Action: Browse Product
↓
Frontend Service (200ms) → API Gateway Service (300ms)
↓
├─ Catalog Service (500ms)
├─ Cart Service (400ms)
└─ Recommendation Service (???)

User says: "Page loads slowly!"
Questions:
- Where is the bottleneck?
- Are all services responding?
- Which call failed?
→ Can't tell without tracing each service separately
```

### With Distributed Tracing

```
Trace ID: trace_xyz_123

Frontend (200ms)
  └─ API Gateway (300ms)
      ├─ Catalog Service (500ms) ✓
      ├─ Cart Service (400ms) ✓
      └─ Recommendation Service (8000ms) ✗ TIMEOUT!

Analysis:
- Recommendation Service is down
- Frontend waits for all services
- Solution: Timeout after 3s, show page without recommendations
```

## OpenTelemetry

OpenTelemetry is a vendor-neutral standard for collecting telemetry data (traces, metrics, logs) across all your services and applications.

### Why OpenTelemetry?

- **Vendor-agnostic** - Export to Jaeger, Datadog, New Relic, etc.
- **Standard format** - All services use same tracing protocol
- **Auto-instrumentation** - Automatically traces popular frameworks
- **Language-agnostic** - Works with Node.js, Java, Python, Go, etc.

## OpenTelemetry Concepts

### Trace

Complete end-to-end journey of a request.

```
Trace ID: 4bf92f3577b34da6a3ce929d0e0e4736

Service A → Service B → Service C
[Operation 1] [Operation 2] [Operation 3]
```

### Span

Individual operation within a trace.

```
Span ID: 00f067aa0ba902b7
Operation Name: http.server
Duration: 150ms
Status: OK
Attributes:
  - http.method: POST
  - http.status_code: 200
  - span.kind: server
```

### Context Propagation

Passing trace info between services.

```
Service A → Service B

Headers:
traceparent: 00-4bf92f3577b34da6a3ce929d0e0e4736-00f067aa0ba902b7-01

Service B receives:
- Trace ID: 4bf92f3577b34da6a3ce929d0e0e4736
- Parent Span ID: 00f067aa0ba902b7
- Creates child span under parent
```

## Setting Up OpenTelemetry with Node.js

### Installation

```bash
npm install @opentelemetry/api
npm install @opentelemetry/sdk-node
npm install @opentelemetry/auto-instrumentations-node
npm install @opentelemetry/exporter-trace-otlp-http
npm install @opentelemetry/sdk-trace-node
npm install @opentelemetry/resources
npm install @opentelemetry/semantic-conventions
```

### Basic Configuration

```javascript
// instrumentation.js - MUST be required before app code
const { NodeSDK } = require('@opentelemetry/sdk-node');
const { getNodeAutoInstrumentations } = require('@opentelemetry/auto-instrumentations-node');
const { OTLPTraceExporter } = require('@opentelemetry/exporter-trace-otlp-http');
const { Resource } = require('@opentelemetry/resources');
const { SemanticResourceAttributes } = require('@opentelemetry/semantic-conventions');

const sdk = new NodeSDK({
  resource: new Resource({
    [SemanticResourceAttributes.SERVICE_NAME]: 'backend-api',
    [SemanticResourceAttributes.SERVICE_VERSION]: '1.0.0'
  }),
  traceExporter: new OTLPTraceExporter({
    url: 'http://localhost:4318/v1/traces'
  }),
  instrumentations: [
    getNodeAutoInstrumentations({
      '@opentelemetry/instrumentation-express': {
        enabled: true
      },
      '@opentelemetry/instrumentation-pg': {
        enabled: true
      },
      '@opentelemetry/instrumentation-redis': {
        enabled: true
      }
    })
  ]
});

sdk.start();

console.log('Tracing initialized');

process.on('SIGTERM', () => {
  sdk.shutdown()
    .then(() => console.log('Tracing terminated'))
    .catch(log => console.log('Error terminating tracing', log))
    .finally(() => process.exit(0));
});

// Export tracer for manual instrumentation
module.exports = require('@opentelemetry/api').trace.getTracer(
  'backend-api',
  '1.0.0'
);
```

### Auto-Instrumentation Coverage

With OpenTelemetry auto-instrumentation:

```
✓ Express/HTTP requests
✓ Database queries (PostgreSQL, MySQL, MongoDB)
✓ Redis operations
✓ External HTTP calls
✓ gRPC calls
✓ Lambda functions
✓ AWS SDK operations
```

No code changes required - automatically traced!

## Manual Instrumentation

### Creating Spans

```javascript
const { trace } = require('@opentelemetry/api');
const tracer = trace.getTracer('app-tracer', '1.0.0');

app.post('/api/checkout', async (req, res) => {
  const span = tracer.startSpan('checkout_process');
  
  try {
    const validateSpan = tracer.startSpan('validate_cart', {
      parent: span
    });
    
    const cart = await validateCart(req.body.cartId);
    validateSpan.end();
    
    const paymentSpan = tracer.startSpan('process_payment', {
      parent: span
    });
    
    const payment = await processPayment(cart);
    paymentSpan.end();
    
    span.setStatus({ code: 0 });  // OK
    res.json({ success: true });
    
  } catch (error) {
    span.recordException(error);
    span.setStatus({ code: 2, message: error.message });
    res.status(500).json({ error: error.message });
  } finally {
    span.end();
  }
});
```

### Setting Span Attributes

```javascript
const span = tracer.startSpan('process_order');

span.setAttributes({
  'order.id': '12345',
  'order.amount': 299.99,
  'order.currency': 'USD',
  'customer.id': 'cust_456',
  'customer.region': 'US-East'
});

// Attributes for filtering/analysis in UI
```

### Adding Events

```javascript
const span = tracer.startSpan('payment_processing');

span.addEvent('card_validated', {
  'card.last4': '4242',
  'card.brand': 'visa'
});

span.addEvent('payment_authorized', {
  'auth_code': 'AUTH_789'
});

span.addEvent('payment_captured', {
  'transaction_id': 'txn_456'
});

// Events create timeline within span
```

## Context Propagation

### Propagating Between Services

```javascript
// Service A: Calls Service B
const { trace, context } = require('@opentelemetry/api');
const tracer = trace.getTracer('service-a');

app.get('/api/user', async (req, res) => {
  const span = tracer.startSpan('fetch_user_data');
  
  try {
    // Get current context
    const ctx = trace.getActiveSpan().spanContext();
    
    // Call Service B, propagate trace
    const response = await fetch('http://service-b/api/profile', {
      headers: {
        'traceparent': `00-${ctx.traceId}-${ctx.spanId}-01`
      }
    });
    
    res.json(await response.json());
  } finally {
    span.end();
  }
});

// Service B: Receives trace
app.get('/api/profile', (req, res) => {
  const traceparent = req.headers.traceparent;
  
  // Extract and link to parent span
  const parentCtx = parseTraceparent(traceparent);
  
  const span = tracer.startSpan('process_profile', {
    attributes: {
      'span.kind': 'server'
    }
  });
  
  // span is now child of parent!
  
  res.json({ profile: {...} });
});
```

## Common Tracing Patterns

### Pattern 1: Timeout Detection

```
Trace shows:
Service A (100ms) → Service B (3000ms - TIMEOUT!) → Never reaches Service C

Problem: Service B hangs
Solution: Implement timeout, fast-fail
```

### Pattern 2: Cascading Failures

```
Trace shows:
Service A (OK) → Service B (Failed) → Service C (Timeout)

Root cause: Service B error cascades to C
Solution: Circuit breaker, fallback
```

### Pattern 3: Resource Exhaustion

```
Traces in last hour:

14:00 - All services: 50-100ms
14:15 - DB Service: 100-200ms
14:30 - DB Service: 500-1000ms
14:45 - DB Service: 2000ms+, timeouts

Analysis:
- 100 requests/sec → 200 → 500 connections
- DB connection pool: 100 max
- Solution: Add connection pooling, optimize queries
```

## Jaeger UI

Jaeger is visualization for OpenTelemetry traces.

### Starting Jaeger

```bash
docker run -d --name jaeger \
  -p 16686:16686 \
  -p 4318:4318 \
  jaegertracing/all-in-one:latest
```

### Finding Traces

```
Filter by:
- Service name: backend-api
- Operation: POST /api/checkout
- Status: Error
- Duration: > 1s
- Tag: order.id = 12345
```

### Trace Analysis

```
Timeline view shows:
checkout_process (2000ms total)
├─ validate_cart (100ms) ✓
├─ process_payment (1800ms) ✓
│  ├─ stripe_auth (900ms) ✓
│  └─ stripe_capture (900ms) ✓
└─ [waiting 100ms]

Flame graph shows time distribution
```

## Real-World Scenario: Slow Checkout

### Investigation with Tracing

```
User reports: "Checkout takes 30 seconds!"

Trace ID: abc_xyz_123

Request path:
1. Frontend → API (10ms)
2. API → Auth Service (200ms)
3. API → Cart Service (100ms)
4. API → Payment Service (28000ms) ← PROBLEM!
5. API → Notification Service (300ms)
6. Response → Frontend (100ms)

Within Payment Service:
process_payment (28000ms)
├─ validate_payment_method (100ms)
├─ stripe_api_call (25000ms) ← SLOW!
│  ├─ stripe_connect (500ms)
│  └─ stripe_charge (24500ms) ← Stripe is slow!
└─ record_transaction (200ms)

Root cause: Stripe API degraded
Solution: Implement timeout, retry with exponential backoff, async webhook processing
```

## Best Practices

1. **Sample wisely** - 100% in dev, 1-5% in production
2. **Set span names well** - "checkout_payment" not "async_operation"
3. **Add relevant attributes** - Customer ID, order ID, region
4. **Include error context** - Always record exceptions
5. **Correlate with logs** - Include trace ID in logs
6. **Monitor trace volume** - Each trace costs money in cloud services
7. **Review traces regularly** - Find bottleneck patterns
8. **Set retention** - Keep traces 7-30 days

## Common Anti-Patterns

### ❌ Creating Too Many Spans

```javascript
// BAD - Span for every tiny operation
for (let i = 0; i < 1000; i++) {
  const span = tracer.startSpan(`process_item_${i}`);
  // ...
  span.end();
}

// Creates 1000 spans - massive overhead!
```

### ❌ Not Propagating Context

```javascript
// BAD - Loses trace when calling another service
fetch('http://other-service/api/endpoint');
// No trace headers passed!
```

### ❌ Blocking on Trace Export

```javascript
// BAD - Spans.end() waits for export
span.end();  // Blocks if network slow!
res.send(data);  // Delayed!

// GOOD - Non-blocking batch export
// Span ends immediately, exported in background
```

