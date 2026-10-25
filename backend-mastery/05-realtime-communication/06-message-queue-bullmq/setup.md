# Message Queue - Bull/BullMQ - Setup Guide

## Installation
```bash
npm install bullmq redis
npm install --save-dev @types/node
```

## Environment Variables
```env
REDIS_URL=redis://localhost:6379
PORT=4000
```

## How to run

### Start Redis
```bash
redis-server
```

### Start worker
```bash
node worker.js
```

### Start API
```bash
node server.js
```

## How to test
```bash
curl -X POST http://localhost:4000/api/jobs \
  -d '{"type":"email","data":{"to":"user@example.com"}}' \
  -H "Content-Type: application/json"
```