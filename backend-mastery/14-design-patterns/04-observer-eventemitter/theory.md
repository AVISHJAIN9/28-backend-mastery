# Observer Pattern: Event-Driven Architecture

## What is the Observer Pattern?

The **Observer Pattern** is a behavioral design pattern that defines a one-to-many dependency between objects such that when one object changes state, all its dependents are notified automatically.

## Key Characteristics

1. **Subject** - Object being observed
2. **Observers** - Objects watching the subject
3. **Notification** - Subject notifies all observers of changes
4. **Loose Coupling** - Subject and observers don't know details about each other
5. **Dynamic Subscription** - Observers can subscribe/unsubscribe at runtime

## Real-World Analogy

Magazine subscriptions:
- Magazines are subjects
- Subscribers are observers
- New issue published (state change)
- All subscribers notified automatically
- Subscribers can cancel (unsubscribe)

## Why Use Observer Pattern?

### 1. **Event-Driven Systems**
Notify multiple handlers when events occur.

### 2. **Loose Coupling**
Subject doesn't know about specific observers.

### 3. **Multiple Observers**
One event can have many handlers.

### 4. **Dynamic Subscription**
Add/remove observers at runtime.

## Node.js EventEmitter

```javascript
const EventEmitter = require('events');
const emitter = new EventEmitter();

emitter.on('userCreated', (user) => {
  console.log('Welcome email sent to:', user.email);
});

emitter.emit('userCreated', { name: 'John', email: 'john@example.com' });
```

## Common Use Cases

1. **User Events** - Registration, login, logout
2. **Order Events** - Created, shipped, delivered
3. **System Events** - Error, warning, info
4. **UI Events** - Click, hover, scroll
5. **Data Changes** - Update, delete, create
6. **Realtime Updates** - WebSocket, Server-Sent Events

## Benefits

1. **Loose Coupling** - Decouples objects
2. **Dynamic Relationships** - Observers added/removed at runtime
3. **Broadcast Communication** - One-to-many notifications
4. **Separation of Concerns** - Components focus on their responsibility
5. **Testability** - Easy to mock observers
6. **Scalability** - Add new observers without changing subject

## Real-World Examples

- **Database triggers** - Automatically notify listeners
- **UI Frameworks** - React hooks, Vue watchers
- **Node.js streams** - Pipe data between processes
- **DOM Events** - Click, focus, change events
- **WebSockets** - Real-time push notifications
- **Message Queues** - Publish-subscribe patterns

## Anti-Patterns to Avoid

1. **Too Many Observers** - Performance degrades
2. **Circular Updates** - Observer notifies subject
3. **No Error Handling** - One observer fails, breaks chain
4. **Memory Leaks** - Not unsubscribing when done
5. **Tight Coupling** - Observers depend on subject internals

## Conclusion

Observer Pattern is essential for:
- Building event-driven systems
- Loose coupling between components
- Real-time notifications and updates
- Scalable reactive architectures
