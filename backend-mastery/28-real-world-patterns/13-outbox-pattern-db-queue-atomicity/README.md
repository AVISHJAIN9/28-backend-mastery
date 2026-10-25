# Module 13: Outbox Pattern - Ensuring Atomicity Between Database & Events

## Overview

The Outbox Pattern solves the distributed transaction problem by storing domain events in the same database transaction as the primary data. A separate process then publishes events from the outbox, ensuring events are never lost and exactly-once semantics are maintained.

## Key Concepts

### The Problem: Lost Events

When updating data and publishing events separately:
```javascript
// If this fails, event is never published
await db.insert('orders', order);
await eventBus.publish('order.created', order);
```

**Risk:** System crashes after insert but before publish → event lost

### The Solution: Outbox Pattern

1. Insert both data AND event in one transaction
2. Mark events as unpublished
3. Separate background process publishes events
4. Mark events as published after successful delivery

```javascript
await db.transaction(() => {
  await db.insert('orders', order);
  await db.insert('outbox', { event: 'order.created', data: order });
});
```

## Benefits

1. **Atomicity** - Data and events updated together
2. **No Lost Events** - All events persisted in database
3. **Exactly-Once Delivery** - Idempotent processing prevents duplicates
4. **Consistency** - Database is source of truth for events
5. **Decoupling** - Event publishing doesn't affect transaction

## Architecture

### Components

1. **Database Outbox Table** - Stores unpublished events
2. **Application Code** - Inserts data and events transactionally
3. **Event Relay** - Background process polling outbox
4. **Event Publishers** - Send events to message queue/subscribers
5. **Published Events Log** - Track successfully published events

### Flow

```
1. Business operation updates aggregate
2. Domain event added to outbox in same transaction
3. Transaction commits (both data and event persisted)
4. Event relay detects new outbox entry
5. Publishes event to message broker
6. Marks event as published
7. Other services receive and process event
```

## Common Mistakes

- Publishing events in separate transaction
- Not tracking published events
- Not handling publication failures
- Blocking on event publishing
- Not deduplicating messages

## Learning Path

1. Understand atomic transactions
2. Learn outbox table design
3. Implement event insertion with data
4. Build event publishing background job
5. Handle idempotency and deduplication

## Module Files

- `controller.js` - Creates records with outbox events
- `routes.js` - Route definitions
- `schema.js` - Validation schemas
- `middleware.js` - Express middleware
- `App.jsx` - React testing UI
- `server.js` - Express server with outbox setup
