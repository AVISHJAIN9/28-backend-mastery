# 08 - Event-Driven Architecture

Build scalable systems using publish-subscribe patterns and event streaming.

## 🎯 Key Concepts

- **Publisher**: Emits events
- **Subscriber**: Listens to events
- **Event Bus**: Central event hub
- **Loose Coupling**: Services don't know about each other
- **Scalability**: Add subscribers without changing publisher

## 📋 Patterns

### Pub/Sub
```
Publisher → Event → Event Bus → Subscribers
```

### Event Sourcing
```
All changes stored as events
Complete audit trail
Temporal queries possible
```

### CQRS
```
Commands → Write Model
Queries → Read Model (eventual consistency)
```

## 🚀 Quick Start

```bash
npm install
npm run dev
```

Server: `http://localhost:4008`

## 📚 API

```bash
# Publish event
POST /api/publish
{
  "eventName": "user.registered",
  "data": {...}
}

# Subscribe to event
POST /api/subscribe
{
  "eventName": "user.registered",
  "subscriberId": "email-service"
}

# Get events
GET /api/events

# Get event log
GET /api/log

# Get subscribers
GET /api/subscribers

# Get dashboard
GET /api/dashboard
```

## 💡 Example Use Cases

### User Registration Event
```
Event: user.registered

Subscribers:
- Email Service (send welcome email)
- Analytics Service (track signup)
- Notification Service (send SMS)
- CRM Service (add to list)
```

## ✅ Benefits

✅ Loose coupling
✅ Easy to scale
✅ Easy to test
✅ Audit trail
✅ Easy to add subscribers

## 🌍 Real-World Examples

- E-commerce: Order placed → Payment → Shipment → Notification
- SaaS: User signup → Email → Training → Onboarding
- IoT: Sensor data → Storage → Analytics → Alerting

---

**Status**: ✅ Complete | **Complexity**: Advanced | **Time**: 45-60 min

