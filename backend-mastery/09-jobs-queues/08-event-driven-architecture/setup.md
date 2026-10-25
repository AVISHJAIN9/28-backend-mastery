# Setup Guide - Event-Driven Architecture

## Installation

```bash
npm install
```

## Environment

Create `.env`:
```bash
HTTP_PORT=4008
NODE_ENV=development
```

## Running

```bash
npm run dev
```

Server: `http://localhost:4008`

## API Endpoints

### Publishing Events
```bash
POST /api/publish
{
  "eventName": "user.registered",
  "data": {
    "userId": "user-123",
    "email": "user@example.com"
  },
  "source": "auth-service"
}
```

### Subscribing to Events
```bash
POST /api/subscribe
{
  "eventName": "user.registered",
  "subscriberId": "email-service"
}
```

### Monitoring
```bash
GET /api/events                # All event types  
GET /api/log                   # Event log
GET /api/subscribers           # Subscribers info
GET /api/dashboard             # Dashboard view
GET /api/patterns              # Architecture patterns
```

## Common Events

- `user.registered` - New user signup
- `user.deleted` - User account removed
- `order.created` - New order placed
- `payment.completed` - Payment successful
- `shipment.dispatched` - Order shipped

## Architecture Patterns

1. **Pub/Sub**: Loose coupling, multiple subscribers
2. **Event Sourcing**: Complete audit trail
3. **CQRS**: Separate read/write models
4. **Saga**: Distributed transactions

