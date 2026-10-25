# Theory & Concepts
## Request Tracing Overview
In distributed systems, requests span multiple services. Tracing tracks requests using unique correlation IDs, enabling debugging across services.

## Why Tracing Needed
- **Microservices**: Request goes through 5-10 services
- **Debugging**: Follow request through entire system
- **Performance**: Identify which service is slow
- **Error Tracking**: See which service failed
- **User Support**: Track user's request path

## Distributed System Example
```
User → API Gateway
  ↓
User Service → Auth Service → Database
  ↓
Order Service → Payment Service → Database
  ↓
Notification Service
```
All with same correlation ID.

## Correlation ID
- **Format**: UUID (550e8400-e29b-41d4-a716-446655440000)
- **Unique**: One per request flow
- **Propagated**: Passed to all downstream services
- **Logged**: In every log entry

## Trace Log Example
```
[550e8400] API Gateway: Request received
[550e8400] User Service: Auth check (12ms)
[550e8400] Auth Service: Token validation (8ms)
[550e8400] User Service: Fetching profile (45ms)
[550e8400] Database: Query (23ms)
[550e8400] API Gateway: Response sent (200 OK, 120ms total)
```

## Propagation
- **HTTP**: X-Correlation-ID header
- **Message Queue**: In message metadata
- **RPC**: In RPC metadata
- **Logging**: Always include in log entries

## Log Aggregation
Collect logs from all services, group by correlation ID, view complete request flow with timing.

## Industry Standards
- **OpenTelemetry**: Standard for observability
- **Jaeger**: Open source tracing
- **AWS X-Ray**: AWS native solution
