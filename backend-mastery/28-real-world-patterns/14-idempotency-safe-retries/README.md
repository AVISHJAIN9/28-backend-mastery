# Module 14: Idempotency - Safe Retries Without Side Effects

## Overview

Idempotency ensures that making the same request multiple times produces the same result as making it once. This is critical for building resilient systems where network failures require retries without duplicating operations.

## Key Concepts

### What is Idempotency?

An operation is idempotent if it produces the same outcome regardless of how many times it's executed.

**Idempotent Operations:**
- GET requests (reading data doesn't change state)
- PUT updates with explicit values
- DELETE operations (deleting twice = same as deleting once)

**Non-Idempotent Operations:**
- POST creates (creates multiple resources on retry)
- Increment operations (5++, 5++, 5++ = 5, 6, 7 - different each time)

### The Problem

Without idempotency:
```javascript
POST /accounts/123/withdraw with amount=100
Network timeout → Retry
Network timeout → Retry
Result: Withdrew 300 instead of 100!
```

### The Solution

With idempotency key:
```javascript
POST /accounts/123/withdraw with amount=100, idempotency_key=UUID
Network timeout → Retry with same UUID
System recognizes duplicate UUID → Returns cached result
Result: Withdrew exactly 100
```

## Implementation

### Idempotency Key Strategy

1. **Client generates unique key** per request (UUID recommended)
2. **Server stores key + result** mapping
3. **On duplicate key** return cached result
4. **For retries** use same key

### Storage

```javascript
const idempotencyMap = {
  'uuid-1234': { status: 'completed', result: {...} },
  'uuid-5678': { status: 'processing', result: null }
};
```

## Benefits

1. **Resilient Retries** - Safely retry failed requests
2. **No Duplicates** - Prevent accidental double-processing
3. **Network Tolerant** - Handle unreliable networks gracefully
4. **Client Simplifies** - Clients can retry without complex logic
5. **System Stability** - No cascading failures from multiple attempts

## Design Patterns

### Status Tracking

1. **PROCESSING** - Operation in progress
2. **COMPLETED** - Operation succeeded
3. **FAILED** - Operation failed

### Timeout Handling

- How long to cache idempotency keys? (hours, days)
- When to allow the same key again? (never, after timeout)

## Common Mistakes

- Not generating unique keys on client side
- Caching results too briefly
- Not handling concurrent requests with same key
- Using guessable idempotency keys
- Not providing idempotency key in response

## Learning Path

1. Understand why retries are needed
2. Learn idempotency principles
3. Implement idempotency key storage
4. Handle status tracking (processing/completed/failed)
5. Practice with distributed systems

## Module Files

- `controller.js` - Idempotency key handling
- `routes.js` - Route definitions
- `schema.js` - Validation schemas
- `middleware.js` - Express middleware
- `App.jsx` - React testing UI
- `server.js` - Express server with idempotency setup
