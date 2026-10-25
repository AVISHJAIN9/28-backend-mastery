# Module 09: Graceful Degradation - Fallback Strategies for Failures

## Overview

Graceful degradation is the practice of building services that continue operating at a reduced capacity when some components fail. Instead of a complete system failure cascading through your application, graceful degradation implements **circuit breakers**, **fallback strategies**, and **health monitoring** to ensure partial functionality remains available.

## Key Concepts

### Circuit Breaker Pattern

The circuit breaker prevents cascading failures by stopping calls to failing services.

**Three States:**

1. **CLOSED** (Normal)
   - Service is healthy and responding
   - Requests pass through normally
   - Failures are counted
   - When failure count reaches threshold → OPEN

2. **OPEN** (Failing)
   - Service is unhealthy
   - Requests immediately fail without calling the service
   - Fallback strategy is used
   - After reset timeout → HALF_OPEN

3. **HALF_OPEN** (Testing)
   - Testing if the service has recovered
   - Limited requests allowed through
   - If successful → CLOSED
   - If failed → OPEN

### Fallback Strategies

When a service is unavailable, handle gracefully with one of these strategies:

1. **Cache Strategy**
   - Return previously cached response
   - Best for: Read operations, non-critical data
   - Example: Return user from cache instead of calling user service

2. **Default Strategy**
   - Return a sensible default value
   - Best for: Non-critical features, features with obvious defaults
   - Example: Return empty array for user posts

3. **Partial Strategy**
   - Return available data, omit unavailable fields
   - Best for: Composite responses, optional fields
   - Example: Return post details but skip analytics

4. **Null Strategy**
   - Omit the field entirely from response
   - Best for: Optional features, non-blocking data
   - Example: Skip user recommendations, return posts anyway

## Architecture Diagram

```
┌─────────────┐
│   Client    │
└──────┬──────┘
       │
       v
┌──────────────────────────────────────┐
│    API Request Handler               │
│  (Validation + Routing)              │
└──────────────┬───────────────────────┘
               │
       ┌───────v────────┐
       │ Circuit Check? │
       └───────┬────────┘
       ┌─────┬─┴──┬──────┐
       │     │    │      │
    CLOSED OPEN HALF_OPEN
       │     │    │      │
       v     │    v      │
    Call    │  Test      │
   Service  │  Call      │
       │    │  Service   │
       │    └→┘  │       │
       │        │       │
    Success?  Success?Success?
       │        │       │
    Yes│      No│     Yes│
       │        │       │
       └────┬───┘       │
            v           │
       Return Response  │
            │           │
            │         No│
            │           v
            │      Return from
            │      Fallback
            │           │
            └─────┬─────┘
                  v
             Send to Client
```

## API Endpoints

### 1. Make API Call with Fallback

**Endpoint:** `POST /api/secure/api-call`

**Request:**
```json
{
  "service_name": "userService",
  "endpoint": "/api/users",
  "method": "GET"
}
```

**Response (Success):**
```json
{
  "success": true,
  "data": {
    "user": { "id": 1, "name": "Alice" },
    "posts": [{ "id": 1, "title": "Post 1" }],
    "analytics": { "views": 1000 }
  },
  "degraded": false
}
```

**Response (Circuit Open - Using Fallback):**
```json
{
  "success": true,
  "data": {
    "user": { "id": 1, "name": "Alice (cached)" },
    "posts": [],
    "analytics": null
  },
  "degraded": true,
  "message": "Using fallback - userService is unavailable"
}
```

### 2. Configure Circuit Breaker

**Endpoint:** `POST /api/secure/circuit-breaker/create`

**Request:**
```json
{
  "service_name": "userService",
  "status": "healthy",
  "failure_threshold": 5,
  "timeout_ms": 5000,
  "reset_timeout_ms": 30000
}
```

**Response:**
```json
{
  "success": true,
  "message": "Circuit breaker configured for userService",
  "configuration": {
    "service_name": "userService",
    "status": "healthy",
    "failure_threshold": 5,
    "timeout_ms": 5000,
    "reset_timeout_ms": 30000
  }
}
```

### 3. Get Service Health

**Endpoint:** `GET /api/secure/health/service?service_name=userService`

**Response:**
```json
{
  "service_name": "userService",
  "status": "healthy",
  "circuit_state": "closed",
  "failure_count": 0,
  "last_check": "2024-01-15T10:30:00Z",
  "health_history": [
    { "timestamp": "2024-01-15T10:29:00Z", "status": "healthy" },
    { "timestamp": "2024-01-15T10:28:00Z", "status": "healthy" }
  ]
}
```

### 4. Get System Health

**Endpoint:** `GET /api/secure/health/system`

**Response:**
```json
{
  "system_status": "degraded",
  "overall_health": 66.67,
  "services": {
    "userService": {
      "status": "healthy",
      "circuit_state": "closed"
    },
    "postService": {
      "status": "down",
      "circuit_state": "open"
    },
    "analyticsService": {
      "status": "healthy",
      "circuit_state": "closed"
    }
  },
  "timestamp": "2024-01-15T10:30:00Z"
}
```

### 5. Enable Fallback Strategy

**Endpoint:** `POST /api/secure/fallback/enable`

**Request:**
```json
{
  "service_name": "userService",
  "fallback_enabled": true,
  "fallback_type": "cache"
}
```

**Response:**
```json
{
  "success": true,
  "message": "Fallback strategy enabled for userService",
  "fallback": {
    "service_name": "userService",
    "enabled": true,
    "type": "cache",
    "cached_data": { "id": 1, "name": "Alice (cached)" }
  }
}
```

### 6. Record Failure

**Endpoint:** `POST /api/secure/failure/record`

**Request:**
```json
{
  "service_name": "userService",
  "error_message": "Connection timeout",
  "error_code": "TIMEOUT"
}
```

**Response:**
```json
{
  "success": true,
  "message": "Failure recorded for userService",
  "circuit": {
    "service_name": "userService",
    "failure_count": 4,
    "failure_threshold": 5,
    "circuit_state": "closed"
  }
}
```

### 7. Reset Circuit

**Endpoint:** `POST /api/secure/circuit/reset`

**Request:**
```json
{
  "service_name": "userService"
}
```

**Response:**
```json
{
  "success": true,
  "message": "Circuit reset to HALF_OPEN for userService",
  "circuit": {
    "service_name": "userService",
    "state": "half_open",
    "failure_count": 0
  }
}
```

## Real-World Examples

### Netflix's Hystrix Pattern

Netflix uses circuit breakers to prevent cascading failures:
- When a service fails > 50 times in 10 seconds
- Circuit opens and returns cached response
- Every 5 seconds, one request is allowed (half-open)
- If successful, circuit closes; if fails, stays open

**Result:** Netflix can lose an entire service and users still see recommendations (older versions)

### Stripe's Graceful Degradation

Stripe payment failures are handled with fallbacks:
- Timeout → Return error asking customer to retry
- Service down → Return cached "charge succeeded" if high confidence
- Rate limit → Queue request and retry after delay

### Amazon Web Services

AWS returns degraded service status:
- S3 write fails → Return error with retry info
- CloudFront slow → Fallback to direct origin
- RDS unavailable → Use read replica if available

## Best Practices

### 1. Set Appropriate Thresholds

```javascript
// ✓ GOOD: Real-world thresholds
const config = {
  failure_threshold: 5,      // Open after 5 failures
  timeout_ms: 3000,          // 3-second timeout for calls
  reset_timeout_ms: 30000    // Try recovery after 30 seconds
};

// ✗ BAD: Too aggressive
const config = {
  failure_threshold: 1,      // Opens on first failure
  timeout_ms: 100,           // Too short, triggers false positives
  reset_timeout_ms: 1000     // Retries too quickly
};
```

### 2. Monitor Circuit State Changes

```javascript
circuit.on('state-change', (service, newState) => {
  logger.warn(`Circuit state changed: ${service} → ${newState}`);
  // Alert operations team
  alertOps(`Service ${service} is ${newState}`);
});
```

### 3. Use Appropriate Fallbacks

```javascript
// ✓ GOOD: Cache strategy for read operations
if (circuit.isOpen()) {
  return fallback.cache.get('user-' + userId);
}

// ✓ GOOD: Default strategy for optional data
if (circuit.isOpen()) {
  return { recommendations: [] };
}

// ✓ GOOD: Partial strategy for composite responses
if (circuit.isOpen()) {
  return {
    user: cachedUser,
    posts: cachedPosts,
    analytics: null  // Omit analytics
  };
}
```

### 4. Log Degradation Events

```javascript
logger.info('System degradation detected', {
  timestamp: new Date(),
  degraded_services: ['userService', 'analyticsService'],
  system_health: 66.67,
  fallback_strategy: 'cache+default'
});
```

### 5. Test Failover Behavior

```javascript
// Simulate service failure
await recordFailure('userService', 'TIMEOUT');
await recordFailure('userService', 'TIMEOUT');
await recordFailure('userService', 'TIMEOUT');
// ...5 times
// Circuit should now be OPEN

// Make request → should use fallback
const response = await makeCall('userService');
assert(response.degraded === true); // ✓
```

## Testing Scenarios

### Scenario 1: Healthy Service
- All services healthy
- Circuits in CLOSED state
- Requests go through normally
- No fallbacks triggered

### Scenario 2: Service Failure
- Service starts failing (e.g., timeout)
- Failures recorded incrementally
- After failure_threshold reached → circuit OPEN
- Next requests use fallback immediately

### Scenario 3: Circuit Recovery
- Service recovers
- Circuit in HALF_OPEN state
- Test requests allowed through
- If successful → circuit CLOSED
- Normal operation resumes

### Scenario 4: Multiple Service Failures
- Multiple services fail simultaneously
- Each has independent circuit breaker
- Some circuits OPEN, some CLOSED
- System operates in degraded mode
- Users still get partial functionality

## Implementation Checklist

- [ ] Circuit breaker states implemented (CLOSED, OPEN, HALF_OPEN)
- [ ] Failure threshold configurable
- [ ] Timeout mechanism for service calls
- [ ] Reset timeout for half-open testing
- [ ] Fallback strategies implemented (cache, default, partial, null)
- [ ] Health monitoring for each service
- [ ] System-wide health aggregation
- [ ] Event emission on state changes
- [ ] Logging for all degradation events
- [ ] React UI for testing all scenarios

## Running the Module

```bash
# Install dependencies
npm install

# Start backend server
node server.js

# Start React frontend
npm start
# Open http://localhost:3000
```
