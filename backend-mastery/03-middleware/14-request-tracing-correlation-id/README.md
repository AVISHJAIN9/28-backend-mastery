# Request Tracing with Correlation ID Middleware

## What is this?
Request tracing middleware tracks requests through distributed systems using unique correlation IDs, enabling debugging and monitoring of request paths.

## Why does it matter?
- **Distributed Tracing**: Follow requests across microservices
- **Debugging**: Correlate logs from multiple services
- **Monitoring**: Track request latency and errors
- **Performance Analysis**: Identify bottlenecks in flow
- **Support**: Track user issues across systems
- **Analytics**: Understand user journeys

## How it works (step by step)
1. Request arrives at API gateway or first service
2. Tracing middleware checks for existing Correlation ID
3. If exists: Use provided ID
4. If not: Generate new UUID
5. Correlation ID attached to request
6. Request passed to handlers
7. Handlers include correlation ID in logs
8. When calling other services: Pass correlation ID in headers
9. Other services log with same correlation ID
10. Logs from all services can be correlated

## Key concepts
- **Correlation ID**: Unique identifier for request flow
- **UUID**: Universally unique identifier (128-bit)
- **X-Correlation-ID**: Standard header name
- **Request Tracking**: Following request through system
- **Log Aggregation**: Collecting logs across services
- **Tracing Header**: Passed to downstream services

## Common mistakes
- Not propagating correlation ID to downstream calls
- Not including correlation ID in error messages
- Using correlation ID as sensitive data
- Not logging correlation ID
- Using weak ID generation (not unique enough)

## Real world usage
```javascript
const { v4: uuidv4 } = require('uuid');

// Tracing middleware
const tracingMiddleware = (req, res, next) => {
  // Check for existing correlation ID from upstream service
  req.correlationId = req.headers['x-correlation-id'] || uuidv4();
  
  // Add to response headers
  res.set('X-Correlation-ID', req.correlationId);
  
  // Add to logs
  const originalLog = console.log;
  console.log = (...args) => {
    originalLog(`[${req.correlationId}]`, ...args);
  };
  
  next();
};

app.use(tracingMiddleware);

// In route handlers
app.get('/users/:id', (req, res) => {
  console.log('Fetching user:', id);  // Logs with correlation ID
  
  // When calling other service
  fetch('http://auth-service/verify', {
    headers: {
      'X-Correlation-ID': req.correlationId  // Propagate ID
    }
  });
});

// Logs from all services:
// [550e8400-e29b-41d4-a716-446655440000] Fetching user: 123
// [550e8400-e29b-41d4-a716-446655440000] Verifying auth
// [550e8400-e29b-41d4-a716-446655440000] User response sent
```
