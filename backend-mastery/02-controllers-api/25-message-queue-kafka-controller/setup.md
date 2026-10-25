# Setup Guide - Message Queue Controller

## Installation

```bash
npm install kafkajs express dotenv
```

## Starting Kafka

```bash
# Docker
docker-compose up -d kafka zookeeper
```

## Environment Variables

```env
HTTP_PORT=5025
KAFKA_BROKERS=localhost:9092
KAFKA_TOPIC=events
```

## Running

```bash
npm start
```

## Testing

```bash
# Publish message
curl -X POST http://localhost:5025/api/publish -d '{"message":"test"}'

# Consume message
curl http://localhost:5025/api/consume
```
