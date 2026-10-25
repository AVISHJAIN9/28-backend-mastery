# Module 02: Microservices + Service Mesh Architecture

A modular system where independent services collaborate through an intelligent infrastructure layer (service mesh) that handles communication, resilience, and observability.

## What is this?

**Microservices** architecture breaks an application into small, independent services that each handle one business capability. Each service:
- Runs in its own process
- Has its own database
- Communicates via APIs (HTTP, gRPC, etc.)
- Can be deployed independently

**Service Mesh** adds another layer of infrastructure that:
- Manages service-to-service communication
- Provides resilience patterns (circuit breaker, retries)
- Enables observability (tracing, metrics, logs)
- Enforces security policies (mTLS, authentication)
- Handles service discovery and load balancing

## Architecture Overview

```
┌──────────────┐
│ API Gateway  │
└──────┬───────┘
       │ routes requests
       ↓
┌──────────────────────────────────────────┐
│       Service Mesh Layer (Control Plane) │
│  - Service Discovery                     │
│  - Load Balancing                        │
│  - Circuit Breaking                      │
│  - Rate Limiting                         │
└──────────────────────────────────────────┘
       ↓
┌──────────────┬──────────────┬──────────────┐
│ User Service │ Order Service│Payment Service
│   Port 6502  │   Port 6503  │   Port 6504
└──────────────┴──────────────┴──────────────┘
       ↓              ↓              ↓
    [User DB]    [Order DB]  [Payment DB]
```

## Services in This Module

### 1. User Service
- Manages user profiles and authentication
- Port: 6502
- **Endpoints**:
  - GET `/api/users` - List all users
  - GET `/api/users/:id` - Get user by ID
  - POST `/api/users` - Create new user
  - PUT `/api/users/:id` - Update user
  - DELETE `/api/users/:id` - Delete user

### 2. Order Service
- Manages orders and order lifecycle
- Port: 6503
- **Endpoints**:
  - GET `/api/orders` - List all orders
  - POST `/api/orders` - Create new order (calls User Service for verification)

### 3. Payment Service
- Processes payments and transactions
- Port: 6504
- **Endpoints**:
  - POST `/api/payments` - Process payment

## Key Patterns Implemented

### 1. Circuit Breaker
Prevents cascading failures by stopping requests to failing services:
```
Normal       → All requests succeed
Degraded     → Failures detected
Open         → Stop sending requests (fail fast)
Half-Open    → Test if service recovered
Closed       → Resume normal operation
```

### 2. Service Discovery
Services find each other dynamically:
```
'http://order-service' → Service Registry → Returns healthy instances
```

### 3. Rate Limiting
Protect services from overload:
```
Request exceeds limits → Response 429 (Too Many Requests)
```

### 4. Request Tracing
Track request flow through multiple services:
```
X-Request-ID header propagates across service calls
Enables debugging and monitoring
```

## How It Works

### Example: Creating an Order

```
1. Client: POST /api/orders
   └─ Body: { userId: 1, items: ['Product A', 'Product B'] }

2. API Gateway receives request
   └─ Adds X-Request-ID header

3. Route to Order Service
   └─ Check circuit breaker: Order Service UP

4. Order Service processing
   ├─ Call User Service to verify userId exists
   │  └─ User Service (6502) responds: {success: true}
   └─ Verify inventory availability
      └─ Calculate total ($25 per item)

5. Create order in database
   ├─ OrderID: 123
   ├─ Status: pending
   └─ Save to Order DB

6. Return response to client
   └─ {success: true, data: order}
```

## Service Mesh Features

### Resilience Patterns
- **Retry Logic** - Automatically retry failed requests
- **Timeout** - Kill hanging requests after threshold
- **Circuit Breaker** - Stop calling failing services
- **Bulkhead** - Isolate resource pools
- **Fallback** - Return degraded response instead of error

### Observability
- **Request Logging** - Log all requests with timestamps
- **Distributed Tracing** - Track requests across services
- **Metrics** - Collect performance data
- **Health Checks** - Monitor service status

### Security
- **mTLS** - Encrypt service-to-service communication
- **Authentication** -  Verify service identity
- **Authorization** - Control what each service can do
- **Rate Limiting** - Prevent abuse

## When to Use Microservices

### ✅ Good For:
- Large teams (50+ developers)
- Multiple independent business domains
- Different scaling needs (some services need 100x more capacity)
- Different technology requirements
- High availability needs
- Separate deployment cycles

### ❌ Not Good For:
- Small teams (< 10 people)
- Tightly coupled features
- Simple applications
- Real-time transaction requirements
- Strong consistency needs

## Comparison: When to Split

| Signal | Stay as Monolith | Consider Microservices |
|--------|------------------|----------------------|
| Team Size | < 10 | 50+ |
| Scaling Needs | Uniform | Different per module |
| Deployment | Once per release | Continuous per team |
| Technology | Single stack | Multiple stacks |
| Data Consistency | ACID transactions | Eventual consistency OK |
| Complexity | Acceptable | Must accept complexity |

## Common Challenges

### 1. Distributed Debugging
- **Problem**: Request fails, hard to find which service is responsible
- **Solution**: Implement distributed tracing with unique request IDs

### 2. Data Consistency
- **Problem**: ACID transactions span multiple databases
- **Solution**: Use Saga pattern for distributed transactions

### 3. Network Latency
- **Problem**: Service calls add network latency
- **Solution**: Cache, async processing, batch operations

### 4. Operational Complexity
- **Problem**: Many services to monitor/manage
- **Solution**: Invest in DevOps, observability, automation

### 5. Testing
- **Problem**: Hard to test service interactions
- **Solution**: Contract testing, test environments, mock services

## Real World Examples

### Netflix (700+ Microservices)
- **Pattern**: Service per feature team
- **Communication**: Async with Kafka
- **Resilience**: Circuit breakers (Hystrix)
- **Discovery**: Eureka service registry

### Uber (2000+ Microservices)
- **Pattern**: Service per business domain
- **Communication**: gRPC for performance
- **Mesh**: Custom service mesh
- **Scale**: Auto-scaling based on demand

### Stripe
- **Pattern**: Services by business capability
- **Communication**: REST APIs
- **Deployment**: Continuous per service
- **Growth**: From monolith to services gradually

## Migration Path

### Monolith → Microservices

```
Stage 1: Well-Structured Monolith (Module 01)
  └─ Single codebase, organized layers

Stage 2: Modular Monolith (Module 03)
  └─ Separate modules within same process

Stage 3: Microservices (This Module)
  └─ Independent services, own processes/databases

Stage 4: Service Mesh (This Module)
  └─ Add infrastructure for inter-service comms

Stage 5: Event-Driven (Module 04)
  └─ Async communication with message queues
```

## Key Metrics to Monitor

### Per-Service Metrics
- Request rate (requests/sec)
- Error rate (% of failed requests)
- Latency (p50, p95, p99)
- Throughput (items processed/sec)

### System Metrics
- Service dependencies status
- Inter-service latency
- Circuit breaker states
- Resource utilization (CPU, memory)

## Best Practices

1. **Service Boundaries** - Split by business capability, not technology
2. **Data Ownership** - Each service owns its data
3. **API Versioning** - Support multiple API versions during migration
4. **Monitoring** - Don't go to production without observability
5. **Testing** - Contract tests for service contracts
6. **Deployment** - Separate deployment pipelines per service
7. **Communication** - Async when possible, sync only when necessary
8. **Gradual Adoption** - Don't rewrite monolith at once

## Next Steps

1. Run this module and test inter-service communication
2. Study how Order Service calls User Service
3. Try breaking one service and observe circuit breaker behavior
4. Look at metrics to see request flow
5. Compare this with Module 01 (Monolith)
6. Proceed to Module 04 (Event-Driven) for async patterns
