# Setup Guide - Caching Controller

## Installation

```bash
npm install redis express dotenv
```

## Environment Variables

```env
HTTP_PORT=5023
REDIS_URL=redis://localhost:6379
CACHE_TTL=3600
```

## Running

```bash
# Start Redis
redis-server

# Start server
npm start
```

## Testing

```bash
# Set cache
curl -X POST http://localhost:5023/api/cache/key -d '{"value":"data"}'

# Get from cache
curl http://localhost:5023/api/cache/key

# Clear cache
curl -X DELETE http://localhost:5023/api/cache/key
```
