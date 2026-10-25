# Module 02: Microservices + Service Mesh Architecture

## What is this?

**Microservices** break a monolithic application into small, independent services that each handle a specific business capability. A **Service Mesh** is additional infrastructure that manages service-to-service communication, providing observability, security, and reliability without application code changes.

### Core Components:
1. **Microservices** - Independent services, separate codebases, own databases
2. **API Gateway** - Single entry point for clients
3. **Service Mesh** - Infrastructure for service communication
4. **Data Partitioning** - Each service owns its data

## Characteristics

### Microservices Architecture:
- **Independent Services** - Each service can be developed, tested, deployed separately
- **Decentralized Data** - Each service has its own database
- **Technology Diversity** - Different services can use different tech stacks
- **Network Communication** - Services communicate via APIs (HTTP, gRPC, etc.)
- **Scalable** - Scale individual services based on demand
- **Resilience** - Failure of one service doesn't crash entire system

### Service Mesh Concepts:
- **Sidecar Proxies** - Each service has a proxy handling its network calls
- **Control Plane** - Central management of all proxies (Istio, Linkerd)
- **Observability** - Traces, metrics, logs for distributed systems
- **Service Discovery** - Automatic detection of service locations
- **Load Balancing** - Distribute requests across service instances
- **Circuit Breaking** - Prevent cascading failures
- **Rate Limiting** - Protect services from overload
- **Security** - mTLS between services, authentication/authorization

## Advantages

✅ **Independent Scaling** - Scale only services that need it
✅ **Technology Flexibility** - Use best tool for each service
✅ **Independent Deployment** - Deploy services separately
✅ **Team Autonomy** - Teams own their services
✅ **Fault Isolation** - One service failure doesn't crash system
✅ **Resilience** - Partial system operation during failures
✅ **Performance** - Optimize each service independently
✅ **Easier Upgrades** - Update services without full redeployment

## Disadvantages

❌ **Operational Complexity** - Requires sophisticated deployment tools
❌ **Distributed Debugging** - Harder to trace issues across services
❌ **Data Consistency** - No ACID transactions across services
❌ **Network Latency** - Inter-service calls add delay
❌ **Service Dependencies** - Services must manage each other's failures
❌ **Deployment Overhead** - Each service needs CI/CD pipeline
❌ **Testing Complexity** - Integration testing across services
❌ **Monitoring Burden** - Must monitor many independent services
❌ **Cost** - More infrastructure, service mesh overhead

## When to Use Microservices

### ✅ Use microservices when:
1. **Multiple independent domains** - Different business areas
2. **Large teams** - 50+ developers working on same product
3. **Independent scaling needs** - Some services need 100x more instances
4. **Different technology needs** - Some parts need different languages/frameworks
5. **High availability requirements** - Need to survive service failures
6. **Separate deployment cycles** - Teams deploy on different schedules
7. **Organizational structure** - Team boundaries match service boundaries

### ❌ Don't use microservices when:
1. **Small team** - Less than 10 developers
2. **Simple domain** - One business area
3. **Tightly coupled features** - Strong data consistency needs
4. **Real-time collaboration** - Heavy in-process synchronization
5. **Legacy monolith** - Not broken, don't split
6. **Lack of automated testing** - Can't manage complexity

## How Services Interact

### Traditional Monolith
```
┌─────────────────────────────────────┐
│  Single Process - Shared Memory     │
│  ┌────────┐  ┌────────┐             │
│  │ User   │  │ Order  │             │
│  │Service │→ │Service │ (function   │
│  │        │  │        │  calls)     │
│  └────────┘  └────────┘             │
│                        ↓             │
│                   [Database]         │
└─────────────────────────────────────┘
```

### Microservices-Based System
```
┌──────────┐      ┌──────────┐      ┌──────────┐
│ User     │      │ Order    │      │ Payment  │
│Service   │      │Service   │      │Service   │
│Port 3001 │      │Port 3002 │      │Port 3003 │ (separate processes)
└────┬─────┘      └────┬─────┘      └────┬─────┘
     ↓                 ↓                 ↓
 [User DB]         [Order DB]       [Payment DB]
```

### Communication Pattern
```
Request → API Gateway → Route to Service → Service processes → Response

Example: Create Order
1. Client: POST /api/orders → API Gateway
2. Gateway routes to: Order Service
3. Order Service: Calls User Service to verify user
4. Order Service: Calls Payment Service to process payment
5. Order Service: Writes to its own database
6. Order Service: Returns response to Gateway
7. Gateway: Returns response to Client
```

## Service Mesh Concepts

### What is a Service Mesh?

A Service Mesh is infrastructure dedicated to handling service-to-service communication. It abstracts networking logic from application code.

### Without Service Mesh
```
// Application code handles all communication logic
const orderService.createOrder = async (userId, items) => {
  try {
    // Call user service
    const user = await fetchUserWithRetry(userId);
    if (!user) throw new Error('User not found');
    
    // Call payment service
    const payment = await fetchPaymentWithCircuitBreaker(payment);
    if (payment.error) throw new Error('Payment failed');
    
    // Log the call
    logger.info('Order created', { userId, items });
    
    // Create order
    return createOrder(userId, items);
  } catch (error) {
    // Handle timeout, retry, fallback
    logger.error(error);
  }
};
```

### With Service Mesh (Istio/Linkerd)
```
// Application code is simple, mesh handles complexity
const orderService.createOrder = async (userId, items) => {
  const user = await http.get('http://user-service/api/users/' + userId);
  const payment = await http.post('http://payment-service/api/payments', paymentData);
  return createOrder(userId, items);
};

// Mesh configuration (declarative):
// - Retry policy: 3 retries on failure
// - Circuit breaker: Open after 5 failures
// - Load balancing: Round-robin
// - mTLS: Encrypt all service-to-service calls
// - Rate limiting: 100 req/sec per service
```

### Service Mesh Components

```
┌─────────────────────────────────────────────────────────┐
│                    Control Plane (Istio)               │
│  ┌──────────────┐  ┌──────────────┐                   │
│  │Configuration│  │Service        │                   │
│  │Management   │  │Discovery      │                   │
│  └──────────────┘  └──────────────┘                   │
└──────────────────────┬──────────────────────────────────┘
                       │ manages
┌──────────────────────┴───────────────────────────────┐
│          Data Plane - Sidecar Proxies (Envoy)       │
│  ┌──────────┐  ┌──────────┐  ┌──────────┐          │
│  │ Service  │  │Service   │  │Service   │          │
│  │A + Proxy │  │B + Proxy │  │C + Proxy │          │
│  └──────────┘  └──────────┘  └──────────┘          │
│        ↓              ↓              ↓               │
│     Network calls with:                             │
│     - Retry logic                                   │
│     - Circuit breaking                             │
│     - Load balancing                               │
│     - mTLS encryption                              │
│     - Rate limiting                                │
│     - Observability (tracing, metrics)             │
└─────────────────────────────────────────────────────┘
```

## Key Patterns

### 1. API Gateway Pattern
Single entry point for all client requests:
```
Client → API Gateway → Route to appropriate service
         ↓
       - Authentication
       - Rate limiting
       - Request routing
       - Response aggregation
```

### 2. Service Discovery
Services find each other dynamically:
```
// Without service discovery
const orderService = 'http://192.168.1.100:3002'

// With service discovery
const orderService = 'http://order-service'  // DNS resolves to healthy instances
```

### 3. Circuit Breaker Pattern
Stop making calls to failing services:
```
Normal: ✓ Request → Service → Response
          Request → Service → Response (TIMEOUT)
          Request → Service (FAIL) - Circuit breaks
          Request ✗ (returned instantly, circuit open)
          After timeout...
          Request → Service (PROBE) - Circuit half-open
          Success: Circuit closes, normal operation
```

### 4. Bulkhead Pattern
Isolate resources to prevent cascade failures:
```
Service A: 
  └─ 10 threads for Service B
  └─ 10 threads for Service C
  
If Service B is down, only 10 connections blocked,
other connections to Service C continue.
```

### 5. Saga Pattern (Distributed Transactions)
Managing transactions across multiple services:
```
Client creates order:
1. Order Service creates order (status: pending)
2. Payment Service processes payment
   - Success: Order Service updates (status: confirmed)
   - Failure: Payment Service instructs Order Service to cancel
3. Inventory Service reserves items
   - Success: Confirm
   - Failure: Reverse previous steps (compensating transaction)
```

## Common Failure Scenarios

### Scenario 1: Service Unavailable
```
Order Service trying to call Payment Service
Payment Service: OFFLINE

Without Mesh:
❌ Order Service hangs/times out
❌ User gets error after delay
❌ Cascading timeouts

With Mesh:
✓ Circuit breaks immediately
✓ User gets error quickly
✓ Calls to other services unaffected
```

### Scenario 2: Slow Service
```
Inventory Service: Very slow (10 seconds/request)

Without Mesh:
❌ All callers wait 10 seconds
❌ Threads exhausted
❌ System becomes unresponsive

With Mesh:
✓ Timeout after 2 seconds
✓ Circuit breaks
✓ Request rejected quickly
```

### Scenario 3: Cascading Failures
```
Chain: Client → Gateway → Order → Payment → User Service

If User Service fails:
  ❌ Without mesh: All services back up, cascade failure
  ✓ With mesh: Only calls to User Service fail, others continue
```

## Real-World Examples

### Netflix Microservices Architecture
- **Services**: 700+ microservices
- **Scaling**: Each service scales independently
- **Resilience**: Service failures don't crash entire platform
- **Patterns**: Circuit breakers, fallbacks, retry logic
- **Technology**: Zuul (gateway), Eureka (service discovery), Hystrix (circuit breaker)

### Uber's Microservices
- **Services**: 2000+ microservices
- **Challenges**: Massive complexity, debugging nightmare
- **Solution**: Custom service mesh (Ringpop), observability tools
- **Lessons**: Small teams own complete service, including operations

### Airbnb's Evolution
```
2010: Monolithic Rails application
2013: Split into microservices for scaling
2017: 100+ services, growing complexity
2020: Service mesh adoption for observability
```

## Observability in Distributed Systems

### Three Pillars
1. **Logs** - What happened
2. **Metrics** - How much and how fast
3. **Traces** - End-to-end request flow

### Example Trace
```
POST /api/orders (Client)
├─ API Gateway: 5ms
│  └─ Route to Order Service
│
├─ Order Service: 150ms total
│  ├─ Verify User (calls User Service): 30ms
│  ├─ Process Payment (calls Payment Service): 100ms
│  └─ Save to Database: 20ms
│
└─ Response: 155ms total
```

Without tracing, you only see "request took 155ms" without knowing where time was spent.

## Technology Considerations

### When You're Ready for Microservices
- ✅ Team 50+ developers
- ✅ Application is 1M+ LOC
- ✅ Different scaling needs
- ✅ Dedicated ops/platform team
- ✅ Multiple programming languages
- ✅ Separate deployment cycles

### Service Mesh Overhead
- 10-50% latency increase
- Requires CPU/memory for proxies
- Adds network protocol overhead
- Only worth it with 20+ services

### Communication Patterns
- **Synchronous (HTTP/gRPC)** - Immediate response needed
- **Asynchronous (Kafka/RabbitMQ)** - Eventual consistency OK
- **Hybrid** - Mix based on use case

## Comparison: Monolith vs Microservices

| Aspect | Monolith | Microservices |
|--------|----------|---------------|
| Deployment | 1 artifact | N artifacts |
| Scaling | Entire app | Per service |
| Technology | One stack | Diverse |
| Data | Shared | Partitioned |
| Transactions | ACID | Eventual consistency |
| Debugging | Easy | Complex |
| Team Size | 5-20 | 50+ |
| Time to Market | Fast initially | Slower with overhead |
| Maintenance | Single codebase | Multiple codebases |
| Reliability | Single point of failure | Graceful degradation |

## Migration Path

### Stage 1: Well-Structured Monolith (Module 01)
- Single codebase, organized layers
- Works for startup/small team

### Stage 2: Modular Monolith (Module 03)
- Separate highly cohesive modules
- Prepare for service extraction

### Stage 3: Microservices (Module 02 - This)
- Extract modules into services
- Each service has own database
- Requires API Gateway, service discovery

### Stage 4: Service Mesh (This module)
- Add infrastructure layer
- Handle inter-service communication
- Provide observability, resilience

## Guiding Principles

1. **Start with Monolith** - Don't start with microservices
2. **Split by Business Capability** - Not by technology
3. **Own Your Data** - Each service owns its data
4. **Async First** - Design for async communication
5. **Fail Fast** - Quick failures better than timeouts
6. **Monitor Everything** - Observability is critical
7. **Plan for Failures** - Assume services will fail
8. **Gradual Migration** - Don't rewrite everything
