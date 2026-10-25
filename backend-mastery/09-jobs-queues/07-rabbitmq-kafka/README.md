# 07 - RabbitMQ & Kafka

Advanced message brokers for distributed messaging and event streaming.

## 🎯 What You'll Learn

- RabbitMQ basic messaging
- Kafka topic-based streaming
- Producer/Consumer pattern
- Message persistence
- Distributed messaging

## 📋 RabbitMQ vs Kafka

### RabbitMQ
- Traditional message broker
- Queue-based
- Message routing
- Request/Response pattern
- Best for: Traditional messaging

### Kafka
- Distributed streaming platform
- Topic-based
- High throughput
- Event sourcing
- Best for: Stream processing

## 🚀 Quick Start

```bash
npm install
npm run dev
```

Server: `http://localhost:4007`

## 📚 API

```bash
# Publish message
POST /api/publish
{
  "broker": "rabbitmq",
  "topic": "orders",
  "message": {...}
}

# Consume messages
GET /api/consume?broker=kafka&topic=events

# Get broker stats
GET /api/stats

# Get configuration
GET /api/config
```

## 💡 Use Cases

- **RabbitMQ**: Task queues, email notifications, async jobs
- **Kafka**: Event streaming, log aggregation, real-time analytics

---

**Status**: ✅ Complete | **Complexity**: Advanced | **Time**: 45-60 min

