# Setup Guide - Microservices + Service Mesh

## Architecture Overview

This module simulates a complete microservices architecture with:
- **API Gateway** - Routes requests to services
- **User Service** - Manages user data (Port 6502)
- **Order Service** - Manages orders (Port 6503)
- **Payment Service** - Processes payments (Port 6504)
- **Service Mesh Features** - Circuit breaker, discovery, rate limiting, tracing

## Prerequisites

- Node.js 16+
- npm or yarn
- Terminal/Command line
- Postman (optional, for API testing)

## Installation

### Step 1: Navigate to Module

```bash
cd /path/to/24-architecture-patterns/02-microservices-service-mesh
```

### Step 2: Install Dependencies

```bash
npm install
```

Dependencies:
- express - Web framework
- cors - Cross-origin support
- helmet - Security headers
- dotenv - Environment variables

### Step 3: Create Environment File

```bash
cp .env.example .env
```

Edit `.env`:
```env
HTTP_PORT=6502
NODE_ENV=development
FRONTEND_URL=http://localhost:3000
```

## Running the Services

### Single Server Mode (All Services in One Process)

For development/testing, all services run in a single Express server:

```bash
npm run dev
```

This starts:
- HTTP server on port 6502
- Simulated User, Order, Payment services
- Service Mesh features

### Multi-Server Mode (Production-Like)

In a real system, each service would run separately:

```bash
# Terminal 1 - API Gateway (port 6502)
NODE_ENV=gateway npm start

# Terminal 2 - User Service (port 6502)
SERVICE_NAME=user npm start

# Terminal 3 - Order Service (port 6503)
SERVICE_NAME=order npm start

# Terminal 4 - Payment Service (port 6504)
SERVICE_NAME=payment npm start
```

## Health Checks

### Check Server Health

```bash
curl http://localhost:6502/health
```

Response:
```json
{
  "status": "ok",
  "module": "02 Microservices Service Mesh"
}
```

### Liveness Probe
```bash
curl http://localhost:6502/api/health/live
```

### Readiness Probe
```bash
curl http://localhost:6502/api/health/ready
```

## API Endpoints

### User Service Endpoints

#### Get All Users
```bash
curl http://localhost:6502/api/users
```

#### Get User by ID
```bash
curl http://localhost:6502/api/users/1
```

#### Create User
```bash
curl -X POST http://localhost:6502/api/users \
  -H "Content-Type: application/json" \
  -d '{
    "name": "John Doe",
    "email": "john@example.com",
    "role": "user"
  }'
```

#### Update User
```bash
curl -X PUT http://localhost:6502/api/users/1 \
  -H "Content-Type: application/json" \
  -d '{
    "name": "John Updated",
    "email": "john.updated@example.com"
  }'
```

#### Delete User
```bash
curl -X DELETE http://localhost:6502/api/users/1
```

### Order Service Endpoints

#### Get All Orders
```bash
curl http://localhost:6502/api/orders
```

#### Create Order
```bash
curl -X POST http://localhost:6502/api/orders \
  -H "Content-Type: application/json" \
  -d '{
    "userId": 1,
    "items": ["Product A", "Product B"]
  }'
```

### Payment Service Endpoints

#### Process Payment
```bash
curl -X POST http://localhost:6502/api/payments \
  -H "Content-Type: application/json" \
  -d '{
    "orderId": 1,
    "amount": 150.00,
    "method": "credit_card",
    "lastFour": "4242"
  }'
```

### Service Status

#### Get Service Mesh Status
```bash
curl http://localhost:6502/api/status
```

Response shows all services and their status:
```json
{
  "status": "operational",
  "architecture": "Microservices with Service Mesh",
  "services": {
    "user-service": { "port": 6502, "status": "up" },
    "order-service": { "port": 6503, "status": "up" },
    "payment-service": { "port": 6504, "status": "up" }
  }
}
```

## Testing Scenarios

### Scenario 1: Happy Path - Create Order

```bash
# 1. Create a user first
curl -X POST http://localhost:6502/api/users \
  -H "Content-Type: application/json" \
  -d '{"name":"Alice","email":"alice@test.com"}'

# Response: { "success": true, "data": { "id": 4, ... } }
# Note the returned id, let's say it's 4

# 2. Create an order for that user
curl -X POST http://localhost:6502/api/orders \
  -H "Content-Type: application/json" \
  -d '{
    "userId": 4,
    "items": ["Book", "Pen"]
  }'

# Response: Order created successfully
```

### Scenario 2: Error Handling - Invalid Input

```bash
# Try to create order without userId
curl -X POST http://localhost:6502/api/orders \
  -H "Content-Type: application/json" \
  -d '{"items": ["Product"]}'

# Response: 400 error with validation details
```

### Scenario 3: Service Dependency - Order with Invalid User

```bash
# Try to create order with non-existent user
curl -X POST http://localhost:6502/api/orders \
  -H "Content-Type: application/json" \
  -d '{
    "userId": 99999,
    "items": ["Product"]
  }'

# Response: User not found error
```

### Scenario 4: Circuit Breaker - Simulate Service Failure

The Order Service calls User Service. When User Service times out, circuit breaker engages:

```bash
# In one terminal, stop the server (Ctrl+C)
# In another terminal, try to create an order

# Response will indicate circuit is open
```

### Scenario 5: Rate Limiting

Make many requests quickly:

```bash
for i in {1..150}; do
  curl http://localhost:6502/api/users &
done
wait

# After 100 requests, get 429 (Too Many Requests)
```

## Distributed Tracing Example

Every request gets a unique ID:

```bash
curl -X POST http://localhost:6502/api/orders \
  -H "Content-Type: application/json" \
  -H "X-Request-ID: my-trace-123" \
  -d '{"userId": 1, "items": ["Item"]}'

# Response includes X-Request-ID header
# All service calls in this request use same ID
# Request ID appears in logs for debugging
```

## React Testing UI

Start the React UI for visual testing:

```bash
npm start
# Then navigate to http://localhost:3000
```

The UI allows you to:
- View and manage users
- Create and view orders
- See system status
- Test all endpoints visually

## Monitoring Service Health

### Check All Service Endpoints

```bash
echo "User Service:"
curl http://localhost:6502/api/users | jq '.count'

echo "Order Service:"
curl http://localhost:6502/api/orders | jq '.count'

echo "Service Status:"
curl http://localhost:6502/api/status | jq '.services'
```

### Monitor Circuit Breaker Status

The circuit breaker tracks:
- Number of failures
- Current state (CLOSED, OPEN, HALF_OPEN)
- Last failure time
- Reset timeout

States transition as services fail/recover.

## Troubleshooting

### Port Already in Use

```bash
# Find process using port 6502
lsof -ti:6502

# Kill the process
kill -9 <PID>

# Or use a different port in .env
HTTP_PORT=6505
```

### Module Not Found

```bash
# Reinstall dependencies
rm -rf node_modules package-lock.json
npm install
```

### Service Discovery Failed

If services can't find each other:
1. Verify all services are running
2. Check firewall isn't blocking localhost:65XX ports
3. Verify service names in serviceRegistry (middleware.js)

### CORS Errors

```env
# Update FRONTEND_URL in .env
FRONTEND_URL=http://localhost:3000
```

### Request Timeouts

Services timeout after 30 seconds by default. To adjust:
1. Edit middleware.js circuitBreaker.resetTimeout
2. Edit schema.js validation timeouts

## Performance Testing

### Load Test with Apache Bench

```bash
# Install if needed
brew install httpd

# Run 100 requests, 10 concurrent
ab -n 100 -c 10 http://localhost:6502/api/users
```

### Load Test with hey

```bash
# Install
go get -u github.com/rakyll/hey

# Run
hey -n 1000 -c 100 http://localhost:6502/api/users
```

## Development Tips

### Hot Reload

```bash
npm run dev
# Uses nodemon to auto-restart on file changes
```

### Debug Mode

```bash
node --inspect server.js
# Then open chrome://inspect in Chrome DevTools
```

### Test with Different Payment Methods

```bash
# Try different payment methods
credit_card, debit_card, paypal, bank_transfer

# Some will randomly fail (10% failure rate) - test resilience
```

## Understanding the Code

### Request Flow
1. Request arrives at API Gateway (server.js)
2. Route matches request to endpoint (routes.js)
3. Middleware runs (validation, circuit breaker, etc.)
4. Controller processes business logic (controller.js)
5. Response sent back to client

### Service Communication
When Order Service creates an order:
```javascript
const user = getUserById(userId);  // Calls User Service logic
if (!user) throw error;             // Dependency check
```

This simulates synchronous service-to-service communication.

### Error Handling
All errors follow consistent format:
```json
{
  "success": false,
  "error": "Error message",
  "details": [{ "field": "...", "message": "..." }]
}
```

## Next Steps

1. **Understand Service Dependencies**
   - See how Order Service depends on User Service
   - Observe error handling when dependency fails

2. **Test Circuit Breaker**
   - Stop server, try requests
   - Observe circuit breaker state changes

3. **Monitor Metrics**
   - See how metrics are collected
   - Understand latency percentiles (p50, p99)

4. **Try Async Patterns**
   - Study Module 04 (Event-Driven) for async communication
   - See how to avoid tight coupling with Kafka/RabbitMQ

5. **Compare Architectures**
   - Run Module 01 (Monolith) - fast, simple, but scales all features
   - Run Module 02 (Microservices) - complex, but scales independently
   - Understand trade-offs
