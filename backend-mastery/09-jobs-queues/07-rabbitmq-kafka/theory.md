# RabbitMQ & Kafka - Advanced Message Brokers Theory

## RabbitMQ vs Kafka

### RabbitMQ
```
- Traditional message broker
- Request/Reply pattern
- Routing key support
- AMQP protocol
- Smaller message throughput (~50k msgs/sec)
- Multiple consumer groups
- ACK/NACK reliability
- Good for: Microservices, task queues
```

### Kafka
```
- Event streaming platform
- Publish/Subscribe pattern
- Topic partitions
- Binary protocol
- High throughput (~1M msgs/sec)
- Consumer groups
- Offset-based replay
- Good for: Analytics, event streaming, data pipeline
```

## RabbitMQ Basics

### Core Concepts
```
Publisher → Exchange → Queue → Consumer
             (Router)  (Buffer)
```

### Exchange Types
```javascript
const amqp = require('amqplib');

async function setupRabbitMQ() {
  const connection = await amqp.connect('amqp://localhost');
  const channel = await connection.createChannel();
  
  // Fanout: Send message to all queues
  await channel.assertExchange('events', 'fanout', { durable: true });
  
  // Direct: Route based on key
  await channel.assertExchange('tasks', 'direct', { durable: true });
  
  // Topic: Pattern-based routing
  await channel.assertExchange('logs', 'topic', { durable: true });
  
  return { connection, channel };
}
```

### RabbitMQ Patterns

#### Pattern 1: Work Queue (Task Distribution)
```javascript
// Publisher
async function publishTask(channel, task) {
  const queue = 'tasks';
  await channel.assertQueue(queue, { durable: true });
  channel.sendToQueue(queue, Buffer.from(JSON.stringify(task)));
}

// Consumer
async function consumeTask(channel) {
  const queue = 'tasks';
  await channel.assertQueue(queue, { durable: true });
  channel.prefetch(1);  // Process one at a time
  
  channel.consume(queue, async (msg) => {
    const task = JSON.parse(msg.content.toString());
    try {
      await processTask(task);
      channel.ack(msg);
    } catch (error) {
      channel.nack(msg, false, true);  // Requeue
    }
  });
}
```

#### Pattern 2: Pub/Sub (Event Broadcast)
```javascript
// Publisher
async function publishEvent(channel, event) {
  const exchange = 'events';
  await channel.assertExchange(exchange, 'fanout', { durable: true });
  channel.publish(exchange, '', Buffer.from(JSON.stringify(event)));
}

// Consumer (each gets all events)
async function subscribeToEvents(channel, consumerName) {
  const exchange = 'events';
  const queue = `${consumerName}-events`;
  
  await channel.assertExchange(exchange, 'fanout', { durable: true });
  await channel.assertQueue(queue, { exclusive: true });
  await channel.bindQueue(queue, exchange, '');
  
  channel.consume(queue, async (msg) => {
    const event = JSON.parse(msg.content.toString());
    await handleEvent(event);
    channel.ack(msg);
  });
}
```

#### Pattern 3: Routing (Smart Delivery)
```javascript
// Publisher with routing key
async function publishLog(channel, level, message) {
  const exchange = 'logs';
  await channel.assertExchange(exchange, 'direct', { durable: true });
  
  const routingKey = level;  // 'error', 'info', 'debug'
  channel.publish(exchange, routingKey, Buffer.from(message));
}

// Consumers subscribe to specific levels
async function subscribeToLogs(channel, levels) {
  const exchange = 'logs';
  const queue = `logs-${Date.now()}`;
  
  await channel.assertExchange(exchange, 'direct', { durable: true });
  await channel.assertQueue(queue);
  
  // Bind to specific routing keys
  for (const level of levels) {
    await channel.bindQueue(queue, exchange, level);
  }
  
  channel.consume(queue, (msg) => {
    console.log(`[${msg.fields.routingKey}] ${msg.content}`);
    channel.ack(msg);
  });
}

// Usage
const channel = ...;
subscribeToLogs(channel, ['error', 'info']);  // Only errors and info
```

## Kafka Basics

### Core Concepts
```
Topic (Log/Stream)
  ├─ Partition 0 [msg1, msg2, msg3, ...]
  ├─ Partition 1 [msg4, msg5, msg6, ...]
  └─ Partition 2 [msg7, msg8, ...]

Consumer Group: Multiple consumers read different partitions
```

### Kafka Patterns

#### Pattern 1: Basic Produce/Consume
```javascript
const { Kafka } = require('kafkajs');

const kafka = new Kafka({
  clientId: 'my-app',
  brokers: ['localhost:9092']
});

const producer = kafka.producer();
const consumer = kafka.consumer({ groupId: 'my-group' });

// Produce
await producer.connect();
await producer.send({
  topic: 'events',
  messages: [
    { key: 'user-1', value: JSON.stringify({ action: 'login' }) }
  ]
});

// Consume
await consumer.connect();
await consumer.subscribe({ topic: 'events' });
await consumer.run({
  eachMessage: async ({ topic, partition, message }) => {
    console.log(`Received from partition ${partition}:`, message.value);
  }
});
```

#### Pattern 2: Multiple Partitions
```javascript
// Messages with same key go to same partition
await producer.send({
  topic: 'user-events',
  messages: [
    { key: 'user-123', value: 'logged in' },    // Partition X
    { key: 'user-123', value: 'viewed page' }, // Partition X (same order)
    { key: 'user-456', value: 'logged in' }    // Partition Y
  ]
});

// Guarantees same user's events stay ordered
```

#### Pattern 3: Consumer Groups
```javascript
// App instance 1
const consumer1 = kafka.consumer({ groupId: 'app-group' });
await consumer1.subscribe({ topic: 'events' });

// App instance 2
const consumer2 = kafka.consumer({ groupId: 'app-group' });
await consumer2.subscribe({ topic: 'events' });

// Kafka automatically distributes messages:
// Consumer 1 gets: Partition 0, 1
// Consumer 2 gets: Partition 2

// All benefit from ordering + parallelism
```

## RabbitMQ Use Cases

1. **Task Queues** - Background job processing
2. **Event Broadcasting** - Multi-consumer events
3. **Microservices Communication** - RPC pattern
4. **Request/Response** - Temporary queues
5. **Dead Letter Handling** - Failed message processing

```javascript
// Task queue for workers
const taskQueue = 'email-jobs';
const channel = ...;

// Producer
async function queueEmailJob(email) {
  channel.sendToQueue(taskQueue, 
    Buffer.from(JSON.stringify(email)),
    { persistent: true }
  );
}

// Consumer (scalable)
channel.consume(taskQueue, async (msg) => {
  const email = JSON.parse(msg.content);
  await sendEmail(email);
  channel.ack(msg);
});
```

## Kafka Use Cases

1. **Event Streaming** - Real-time event pipeline
2. **Data Integration** - Connect systems
3. **Analytics Pipeline** - Process streams
4. **Activity Tracking** - User behavior
5. **Log Aggregation** - Collect logs from all services

```javascript
// Event streaming for analytics
const eventTopic = 'user-events';
const producer = kafka.producer();
const consumer = kafka.consumer({ groupId: 'analytics' });

// Produce events
async function trackEvent(userId, action) {
  await producer.send({
    topic: eventTopic,
    messages: [{
      key: userId,
      value: JSON.stringify({ action, timestamp: Date.now() })
    }]
  });
}

// Consume for analytics
await consumer.subscribe({ topic: eventTopic });
await consumer.run({
  eachMessage: async ({ message }) => {
    const event = JSON.parse(message.value);
    await updateAnalytics(event);
  }
});
```

## Comparison Table

| Feature | RabbitMQ | Kafka |
|---------|----------|-------|
| Throughput | 50K/sec | 1M/sec |
| Latency | <1ms | 10ms |
| Protocol | AMQP | Binary |
| Ordering | Per queue | Per partition |
| Replay | No | Yes (offset) |
| Storage | Memory | Disk |
| Complexity | Simple | Complex |
| Scaling | Vertical | Horizontal |

## Reliability Patterns

### RabbitMQ Acknowledgment
```javascript
channel.on('error', (err) => console.log(err));

channel.consume(queue, async (msg) => {
  try {
    await processMessage(msg);
    channel.ack(msg);  // Success
  } catch (error) {
    // Don't ack - message returns to queue
    channel.nack(msg, false, true);
  }
});
```

### Kafka Offset Management
```javascript
// Automatic (default)
await consumer.run({
  eachMessage: async ({ message }) => {
    await processMessage(message);
    // Offset auto-committed
  }
});

// Manual control
await consumer.run({
  eachMessage: async ({ message }) => {
    try {
      await processMessage(message);
      await consumer.commitOffsets([
        { topic, partition, offset: message.offset + 1 }
      ]);
    } catch (error) {
      // Don't commit - will retry from same offset
    }
  }
});
```

## Production Deployment

### RabbitMQ Cluster
```
Node 1 ──── Node 2 ──── Node 3
  │           │           │
  └─────────────────────────
   (Shared message queue)
```

### Kafka Cluster
```
Topic: events
  ├─ Partition 0 [Leader: Broker 1, Replicas: 2,3]
  ├─ Partition 1 [Leader: Broker 2, Replicas: 1,3]
  └─ Partition 2 [Leader: Broker 3, Replicas: 1,2]
```

---

**Choose RabbitMQ for**: Simple message queuing, request/reply patterns  
**Choose Kafka for**: Event streaming, data pipelines, high throughput

