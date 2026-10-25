# Event-Driven Architecture Theory

## What is Event-Driven Architecture?

Event-driven architecture is a design pattern where components communicate by producing, detecting, and consuming events instead of making direct function calls.

### Traditional vs Event-Driven

```javascript
// TRADITIONAL: Tightly Coupled
function placeOrder(order) {
  processPayment(order);        // Direct call
  updateInventory(order);       // Direct call
  sendConfirmation(order);      // Direct call
  analyzeOrder(order);          // Direct call
}
// If one fails, all fail. Tight coupling.

// EVENT-DRIVEN: Loosely Coupled
function placeOrder(order) {
  eventBus.emit('order:created', order);
  // Other components listen independently
}
```

## Core Components

### 1. Event Emitter (Producer)
```javascript
const EventEmitter = require('events');
const orderEmitter = new EventEmitter();

orderEmitter.emit('order:created', {
  orderId: '123',
  customerId: '456',
  amount: 99.99
});
```

### 2. Event Listener (Consumer)
```javascript
orderEmitter.on('order:created', (order) => {
  console.log(`Processing order ${order.orderId}`);
  processPayment(order);
});

orderEmitter.on('order:created', (order) => {
  updateInventory(order);
});

orderEmitter.on('order:created', (order) => {
  sendConfirmation(order);
});
```

### 3. Event Bus (Central Hub)
```javascript
class EventBus {
  constructor() {
    this.events = {};
  }
  
  emit(eventName, data) {
    if (!this.events[eventName]) return;
    for (const listener of this.events[eventName]) {
      listener(data);
    }
  }
  
  on(eventName, listener) {
    if (!this.events[eventName]) {
      this.events[eventName] = [];
    }
    this.events[eventName].push(listener);
  }
}

const bus = new EventBus();
```

## Event Types

### 1. Domain Events
```javascript
// Represent important business occurrences
bus.emit('user:registered', { userId: '123', email: 'user@example.com' });
bus.emit('payment:completed', { orderId: '456', amount: 99.99 });
bus.emit('inventory:depleted', { productId: '789', quantity: 0 });
```

### 2. Integration Events
```javascript
// Events from external systems
bus.emit('external:webhook:received', { source: 'stripe', event: 'charge.succeeded' });
bus.emit('external:api:response', { service: 'weather', data: {...} });
```

### 3. UI Events
```javascript
// User interactions (in frontend)
bus.emit('button:clicked', { buttonId: 'submit', timestamp: Date.now() });
bus.emit('form:submitted', { formData: {...} });
```

## Event Sourcing Pattern

```javascript
class Order {
  constructor(orderId) {
    this.orderId = orderId;
    this.events = [];
    this.state = { status: 'new' };
  }
  
  // Methods emit events instead of modifying state directly
  create(customerId, items) {
    this.applyEvent({
      type: 'OrderCreated',
      orderId: this.orderId,
      customerId,
      items,
      timestamp: Date.now()
    });
  }
  
  confirm() {
    this.applyEvent({
      type: 'OrderConfirmed',
      orderId: this.orderId,
      timestamp: Date.now()
    });
  }
  
  applyEvent(event) {
    this.events.push(event);
    this.updateState(event);
  }
  
  updateState(event) {
    switch (event.type) {
      case 'OrderCreated':
        this.state.status = 'pending';
        break;
      case 'OrderConfirmed':
        this.state.status = 'confirmed';
        break;
    }
  }
  
  // Replay all events to rebuild state
  replay(allEvents) {
    this.state = { status: 'new' };
    for (const event of allEvents) {
      this.updateState(event);
    }
  }
}
```

## Event-Driven Patterns

### Pattern 1: Choreography (Distributed)
```javascript
// Each service listens and reacts independently

// Order Service
busorderService.on('order:created', async (order) => {
  // Process order
  bus.emit('order:processed', order);
});

// Payment Service
busPaymentService.on('order:processed', async (order) => {
  const payment = await processPayment(order);
  bus.emit(payment.success ? 'payment:completed' : 'payment:failed', payment);
});

// Inventory Service
busInventoryService.on('payment:completed', async (order) => {
  await updateInventory(order);
  bus.emit('inventory:updated', order);
});

// Notification Service
busNotificationService.on('inventory:updated', async (order) => {
  await sendConfirmation(order);
});
```

### Pattern 2: Orchestration (Centralized)
```javascript
// Central orchestrator coordinates all events

class OrderOrchestrator {
  constructor(bus) {
    this.bus = bus;
    this.orders = {};
  }
  
  async handleOrderCreated(order) {
    this.orders[order.id] = { status: 'created', order };
    
    // Ask payment service
    this.bus.emit('payment:process', order);
  }
  
  async handlePaymentCompleted(payment) {
    this.orders[payment.orderId].status = 'payment_completed';
    
    // Ask inventory service
    this.bus.emit('inventory:reserve', this.orders[payment.orderId].order);
  }
  
  async handleInventoryReserved(order) {
    this.orders[order.id].status = 'inventory_reserved';
    
    // Ask notification service
    this.bus.emit('notification:send', this.orders[order.id].order);
  }
  
  async handleNotificationSent(order) {
    this.orders[order.id].status = 'completed';
  }
}
```

## Real-World Examples

### E-Commerce Order Flow
```javascript
// Event sequence
1. order:created → PaymentService
2. payment:completed → InventoryService
3. inventory:reserved → NotificationService
4. email:sent → AnalyticsService

Each service is independent and can scale separately
```

### User Onboarding
```javascript
eventBus.on('user:registered', async (user) => {
  // Email service sends welcome email
  await sendWelcomeEmail(user);
  
  // Analytics tracks signup
  await trackSignup(user);
  
  // CRM creates contact
  await createCRMContact(user);
  
  // Notification sends SMS
  await sendWelcomeSMS(user);
  
  // All happen independently - if one fails, others still proceed
});
```

### Social Media Post
```javascript
eventBus.on('post:published', async (post) => {
  // Emit to followers
  eventBus.emit('post:notify-followers', post);
  
  // Send notifications
  eventBus.emit('notification:queue', {
    type: 'new_post',
    post
  });
  
  // Update timeline
  eventBus.emit('timeline:update', post);
  
  // Process media
  eventBus.emit('media:process', post);
  
  // Update search index
  eventBus.emit('search:index', post);
});
```

## Event Error Handling

```javascript
class ResilientEventBus {
  async emit(eventName, data) {
    const listeners = this.listeners[eventName] || [];
    
    for (const listener of listeners) {
      try {
        await listener(data);
      } catch (error) {
        // Log error
        console.error(`Listener error for ${eventName}:`, error);
        
        // Send to error handler
        await this.handleError(eventName, data, error);
        
        // Don't stop other listeners
      }
    }
  }
  
  async handleError(eventName, data, error) {
    // Retry logic
    const maxRetries = 3;
    for (let i = 0; i < maxRetries; i++) {
      try {
        await this.emit(`${eventName}:retry`, data);
        return;
      } catch (retryError) {
        if (i === maxRetries - 1) {
          // Move to dead letter queue
          await this.deadLetterQueue.add({
            eventName,
            data,
            error: error.message,
            timestamp: Date.now()
          });
        }
      }
    }
  }
}
```

## Distributed Events (Kafka/RabbitMQ)

```javascript
class DistributedEventBus {
  constructor(kafkaProducer) {
    this.producer = kafkaProducer;
  }
  
  async emit(eventName, data) {
    await this.producer.send({
      topic: eventName,
      messages: [{
        key: data.id,  // Ensure ordering
        value: JSON.stringify(data),
        headers: {
          'event-type': eventName,
          timestamp: Date.now()
        }
      }]
    });
  }
  
  async on(eventName, listener) {
    const consumer = this.kafkaConsumer({
      groupId: `${eventName}-group`,
      topics: [eventName]
    });
    
    await consumer.run({
      eachMessage: async ({ message }) => {
        const data = JSON.parse(message.value);
        await listener(data);
      }
    });
  }
}
```

## Event Versioning

```javascript
// Handle old and new event formats

function handleUserCreatedEvent(event) {
  switch (event.version) {
    case 1:  // Old format
      return mapV1toV2(event);
    
    case 2:  // New format
      return event;
    
    default:
      throw new Error(`Unknown version: ${event.version}`);
  }
}

function mapV1toV2(eventV1) {
  return {
    version: 2,
    userId: eventV1.id,
    email: eventV1.email_address,
    timestamp: eventV1.created_at
  };
}
```

## Monitoring and Observability

```javascript
class MonitoredEventBus {
  async emit(eventName, data) {
    const startTime = Date.now();
    
    try {
      const listeners = this.listeners[eventName] || [];
      
      for (const listener of listeners) {
        try {
          await listener(data);
          // Track successful event
          this.metrics.record({
            event: eventName,
            listener: listener.name,
            duration: Date.now() - startTime,
            status: 'success'
          });
        } catch (error) {
          // Track failed event
          this.metrics.record({
            event: eventName,
            listener: listener.name,
            duration: Date.now() - startTime,
            status: 'failed',
            error: error.message
          });
        }
      }
    } catch (error) {
      // Log critical errors
      await this.logger.error({
        eventName,
        error: error.message,
        timestamp: new Date()
      });
    }
  }
}
```

## Benefits

✅ **Decoupling** - Services don't call each other directly  
✅ **Scalability** - Add new listeners without modifying existing code  
✅ **Resilience** - One failure doesn't cascade  
✅ **Flexibility** - Reorder processing without code changes  
✅ **Auditability** - All events are recorded  

## Challenges

⚠️ **Debugging** - Harder to trace execution flow  
⚠️ **Data Consistency** - Eventual consistency models  
⚠️ **Testing** - More complex to test async flows  
⚠️ **Event Ordering** - Must handle events out of order  

---

Event-driven architecture is powerful but requires careful design and monitoring.

