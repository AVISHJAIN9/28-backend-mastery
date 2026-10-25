# Module 11: Rate Limiting - Setup Guide

## Prerequisites

- **Node.js:** 16.0.0+
- **npm:** 8.0.0+
- **Redis:** 6.0+
- **RAM:** 2GB minimum

## Quick Installation

```bash
cd 11-rate-limiting
npm install
cp .env.example .env
npm start
```

## Configuration

### Environment Variables
```bash
NODE_ENV=development
HTTP_PORT=6417
REDIS_HOST=localhost
REDIS_PORT=6379
```

### Redis Setup
```bash
# Start Redis
redis-server

# Or Docker
docker run -d -p 6379:6379 redis:latest
```

## Testing

### Test Single Request
```bash
curl -X POST http://localhost:6417/api/fixed-window/check \
  -H "Content-Type: application/json" \
  -d '{"identifier":"user1","limit":5,"window":60}'

# Response (allowed):
# {"success":true,"count":1,"remaining":4}

# After 5 requests:
# {"error":"Rate limit exceeded","count":6,"remaining":0}
```

### Test Burst
```bash
curl -X POST http://localhost:6417/api/simulate/burst \
  -H "Content-Type: application/json" \
  -d '{
    "algorithm":"fixed",
    "identifier":"burst1",
    "count":10,
    "limit":5,
    "window":60
  }'
```

## Port Configuration

- **Default:** 6417
- **Change:** `HTTP_PORT=6418 npm start`

## Troubleshooting

| Issue | Solution |
|-------|----------|
| Connection refused | Start Redis: `redis-server` |
| Port in use | Kill: `lsof -i :6417 \| awk 'NR!=1' \| xargs kill -9` |
| Rate limits not expiring | Clear: `redis-cli FLUSHDB` |

## Performance Tuning

### High Traffic (1000+ req/sec)
```bash
# Use fixed window (fastest)
RATE_LIMIT_WINDOW=60
RATE_LIMIT_CAPACITY=1000
```

### Strict Compliance
```bash
# Use sliding window (most accurate)
RATE_LIMIT_WINDOW=60
RATE_LIMIT_CAPACITY=100
```

## Production Checklist

- [ ] Limits configured per tier/endpoint
- [ ] 429 responses return Retry-After header
- [ ] RateLimit-* headers set correctly
- [ ] Monitoring alerts on violations
- [ ] DDoS threshold configured
- [ ] IP-based limits for anonymous requests

## Next Steps

1. Read theory.md completely
2. Test each algorithm with burst test
3. Understand trade-offs
4. Choose algorithm for your API
5. Implement in production

---

**Module:** Rate Limiting (11)  
**Difficulty:** Intermediate  
**Time:** 2-3 hours
