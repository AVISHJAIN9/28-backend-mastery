# Circuit Breaker Pattern - Theory

## Overview
Circuit breaker prevents cascading failures by stopping requests to failing services until they recover.

## States
1. **Closed** - Normal operation, requests pass through
2. **Open** - Service failing, requests rejected immediately
3. **Half-Open** - Testing if service recovered

## Triggers for Opening Circuit
- Threshold of failures reached
- Error rate exceeds limit
- Request timeout rate high
- Manual intervention

## Recovery Mechanisms
- Gradual traffic increase
- Health checks
- Timeout-based retry
- Manual reset

## Integration Points
- External API calls
- Database operations
- Microservice calls
- Job queue processing

## Benefits
- Prevents cascading failures
- Faster failure detection
- Automatic recovery
- Better system resilience