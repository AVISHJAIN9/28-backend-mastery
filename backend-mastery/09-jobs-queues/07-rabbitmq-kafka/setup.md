# Setup Guide - RabbitMQ & Kafka

## Installation

```bash
npm install
```

## Prerequisites

### RabbitMQ
```bash
# Using Docker
docker run -d --name rabbitmq -p 5672:5672 -p 15672:15672 rabbitmq:3-management

# Or install locally: https://www.rabbitmq.com/download.html
```

### Kafka
```bash
# Using Docker
docker-compose -f docker-compose.kafka.yml up

# Or download from: https://kafka.apache.org/downloads
```

## Environment

Create `.env`:
```bash
HTTP_PORT=4007
RABBITMQ_HOST=localhost
RABBITMQ_PORT=5672
KAFKA_BROKERS=localhost:9092
```

## Running

```bash
npm run dev
```

Server: `http://localhost:4007`

## API Endpoints

### Publishing
```bash
POST /api/publish
{
  "broker": "rabbitmq",
  "topic": "orders",
  "message": {...}
}
```

### Consuming
```bash
GET /api/consume?broker=kafka&topic=events
```

### Monitoring
```bash
GET /api/stats      # Broker statistics
GET /api/config     # Broker configuration
GET /api/dashboard  # Dashboard view
```

## Verification

```bash
# RabbitMQ management UI
http://localhost:15672
Username: guest
Password: guest

# Kafka console tools
./bin/kafka-topics.sh --list --bootstrap-server localhost:9092
```

