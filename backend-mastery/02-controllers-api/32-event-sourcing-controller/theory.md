# Event Sourcing Theory

## Core Concepts
- **Event**: Immutable record of state change
- **Aggregate**: Entity with its event history
- **Command**: Request to change state
- **Read Model**: Denormalized view of state

## Event Store
- Append-only log of all events
- No updates or deletes
- Single source of truth
- Enables replaying history

## Challenges
- Eventual consistency
- Event versioning
- Snapshot management
- Storage growth

## Benefits
- Complete audit trail
- Event replay for debugging
- Temporal queries
- Event-driven architecture
