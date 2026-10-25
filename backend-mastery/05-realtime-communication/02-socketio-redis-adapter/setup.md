# Socket.io Redis Adapter - Multi-Server Setup Guide

## Prerequisites

```bash
Node.js 16+
Redis Server 6.2+
npm or yarn
Express.js application
Multiple servers (or Docker containers)
```

## Installation

```bash
npm install socket.io @socket.io/redis-adapter redis joi
```

## Environment Configuration

Create `.env` file on each server:
```env
PORT=4000
SERVER_ID=server_1
CLIENT_URL=http://localhost:3000
NODE_ENV=production

# Redis Configuration
REDIS_HOST=redis.server.com
REDIS_PORT=6379
REDIS_PASSWORD=your_redis_password
REDIS_DB=0
```

## Redis Setup

### Option 1: Docker
```bash
docker run -d -p 6379:6379 redis:latest
```

### Option 2: Install Locally
```bash
# macOS
brew install redis

# Linux
sudo apt-get install redis-server

# Start Redis
redis-server
```

##Multi-Server Deployment

### Server 1
```bash
SERVER_ID=server_1 node server.js
```

### Server 2
```bash
SERVER_ID=server_2 node server.js
```

### Server 3
```bash
SERVER_ID=server_3 node server.js
```

## Server Code

```javascript
const express = require('express');
const http = require('http');
const redisRoutes = require('./routes');

const app = express();
const server = http.createServer(app);

// Mount Redis Adapter routes
const wsRouter = await redisRoutes(app, server);
app.use('/api/ws', wsRouter);

const PORT = process.env.PORT || 4000;
server.listen(PORT, () => {
  console.log(`🚀 Server ${process.env.SERVER_ID} running on port ${PORT}`);
});
```

## Testing Multi-Server Setup

### 1. Test Cross-Server Messaging
```bash
# Terminal 1: Client connects to Server 1
curl http://localhost:4000/health

# Terminal 2: Send broadcast
curl -X POST http://localhost:4000/api/ws/broadcast \
  -H "Content-Type: application/json" \
  -d '{"message": "Hello from server 1"}'

# Terminal 3: Check Server 2
curl http://localhost:4001/health
```

### 2. Redis CLI Monitoring
```bash
redis-cli
> SUBSCRIBE socket:broadcast
> CLIENT LIST
> INFO stats
```

### 3. Metrics Endpoint
```bash
curl http://localhost:4000/api/ws/metrics
# Response shows total servers and connections
```

## Load Balancing with Nginx

```nginx
upstream socketio {
  server localhost:4000;
  server localhost:4001;
  server localhost:4002;
}

server {
  listen 80;
  server_name socketio.app.com;

  location / {
    proxy_pass http://socketio;
    proxy_http_version 1.1;
    proxy_set_header Upgrade $http_upgrade;
    proxy_set_header Connection "upgrade";
    proxy_set_header Host $host;
  }
}
```

## Common Issues

**Issue:** Connections not syncing across servers
- **Solution:** Verify Redis connection and REDIS_HOST environment variable

**Issue:** Performance degradation
- **Solution:** Check Redis latency with `redis-cli --latency`

**Issue:** Pub/Sub messages not received
- **Solution:** Ensure all servers subscribed to same Redis channel

## Next Steps

1. Add persistent message storage (MongoDB)
2. Implement cluster monitoring
3. Add health checks and circuit breaker
4. Configure Redis clustering for high availability
