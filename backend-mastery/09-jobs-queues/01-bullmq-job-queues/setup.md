# Setup Instructions - BullMQ

## Prerequisites
- Node.js 14+
- Redis (local or remote)

## Step 1: Install Dependencies

```bash
cd 01-bullmq-job-queues
npm install
```

### Dependencies
- `bullmq` - Job queue library
- `redis` - Redis client
- `express` - Web framework
- `joi` - Validation library
- `cors` - CORS middleware

## Step 2: Setup Redis

### Option A: Using Docker (Recommended)
```bash
docker run -d \
  --name redis-bullmq \
  -p 6379:6379 \
  redis:7-alpine
```

### Option B: Local Installation
```bash
# macOS
brew install redis

# Linux
sudo apt-get install redis-server

# Start Redis
redis-server
```

### Option C: Using Docker Compose
```bash
# Create docker-compose.yml
version: '3.8'
services:
  redis:
    image: redis:7-alpine
    ports:
      - "6379:6379"
```

Then run:
```bash
docker-compose up -d
```

## Step 3: Environment Variables

Copy `.env.example` to `.env`:
```bash
cp .env.example .env
```

Edit `.env`:
```
HTTP_PORT=4009
REDIS_HOST=localhost
REDIS_PORT=6379
REDIS_PASSWORD=
NODE_ENV=development
```

## Step 4: Start the Application

### Terminal 1: Start Server
```bash
npm start

# Or for development with auto-reload
npm run dev
```

Output:
```
✅ Server running on http://localhost:4009
✅ Redis connected
```

### Terminal 2: Start Worker (Optional - for production)
```bash
npm run worker
```

## Step 5: Test the Setup

### 1. Add an Email Job
```bash
curl -X POST http://localhost:4009/jobs/email \
  -H "Content-Type: application/json" \
  -d '{
    "to": "user@example.com",
    "subject": "Welcome",
    "body": "Hello from BullMQ!"
  }'
```

Response:
```json
{
  "success": true,
  "jobId": "1",
  "status": "queued",
  "message": "Email job added to queue"
}
```

### 2. Check Queue Stats
```bash
curl http://localhost:4009/queues/emails/stats
```

### 3. Monitor Job Status
```bash
curl http://localhost:4009/jobs/1/status/emails
```

### 4. List Pending Jobs
```bash
curl "http://localhost:4009/queues/emails/jobs/wait?limit=10&offset=0"
```

## Running the UI

Open your browser and go to: `http://localhost:4009`

You can use the web UI to:
- Add jobs
- Monitor queue statistics
- View job status and progress
- Retry failed jobs
- Clear queues

## Verify Worker is Processing

Check terminal output:
```
✅ Email job 1 completed
✅ Report job 2 completed
```

## Development Commands

```bash
# Start with auto-reload
npm run dev

# Run tests
npm test

# Run specific test file
npm test -- tests/queue.test.js

# View Redis data
redis-cli
> KEYS *
> HGETALL "bull:emails:1"
```

## Common Issues

### ❌ Redis Connection Refused
```
Error: connect ECONNREFUSED 127.0.0.1:6379
```

**Fix:** Ensure Redis is running
```bash
# Check Redis
redis-cli ping

# If not running, start it
redis-server
```

### ❌ Port Already in Use
```
Error: listen EADDRINUSE :::4009
```

**Fix:** Change port in `.env` or kill process
```bash
# Kill process on port 4009
lsof -ti:4009 | xargs kill -9

# Or change HTTP_PORT in .env
```

### ❌ Module not found
```
Error: Cannot find module 'bullmq'
```

**Fix:** Install dependencies
```bash
npm install
```

## Production Setup

1. **Use Redis persistence:**
   ```
   maxmemory-policy allkeys-lru
   save 900 1
   save 300 10
   ```

2. **Run multiple workers:**
   ```bash
   npm run worker &
   npm run worker &
   npm run worker &
   ```

3. **Monitor logs:**
   ```bash
   npm start 2>&1 | tee app.log
   ```

4. **Use process manager (PM2):**
   ```bash
   npm install -g pm2
   pm2 start server.js -i max
   pm2 start worker.js -i 4
   ```

## API Testing

### Add Report Job
```bash
curl -X POST http://localhost:4009/jobs/report \
  -H "Content-Type: application/json" \
  -d '{
    "userId": 123,
    "reportType": "sales",
    "format": "pdf",
    "priority": 1
  }'
```

### Add Bulk Jobs
```bash
curl -X POST http://localhost:4009/jobs/bulk \
  -H "Content-Type: application/json" \
  -d '{
    "queueName": "batch",
    "items": [
      {"data": "item1"},
      {"data": "item2"},
      {"data": "item3"}
    ]
  }'
```

### List Failed Jobs
```bash
curl "http://localhost:4009/queues/emails/jobs/failed"
```

### Retry a Job
```bash
curl -X POST http://localhost:4009/jobs/1/retry/emails
```

### Remove a Job
```bash
curl -X DELETE http://localhost:4009/jobs/1/emails
```

## Next Steps

1. Explore different queue types (cron jobs, priority, delayed)
2. Implement dead letter queue handling
3. Add job retry with exponential backoff
4. Scale workers across multiple processes
5. Integrate with real services (SendGrid, S3, etc.)

