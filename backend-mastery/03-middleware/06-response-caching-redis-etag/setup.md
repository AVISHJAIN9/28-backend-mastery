# Setup Guide
## Dependencies
```bash
npm install redis
```
## Environment Variables
REDIS_URL=redis://localhost:6379
## How to run
```bash
redis-server
const redis = require('redis');
const client = redis.createClient();
app.get('/items', cacheMiddleware, handler);
node server.js
```
## How to test
```bash
curl -i http://localhost:3000/items
# Check for Cache-Control and ETag headers
curl -i http://localhost:3000/items -H "If-None-Match: abc123"
# Should return 304 Not Modified
```
