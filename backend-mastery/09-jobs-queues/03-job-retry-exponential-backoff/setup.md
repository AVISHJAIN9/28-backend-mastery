# Setup Guide - Job Retry with Exponential Backoff

## Prerequisites
- Node.js 14+
- Redis server running locally

## Installation

```bash
npm install
```

## Environment Setup

Create `.env`:

```bash
HTTP_PORT=4003
REDIS_HOST=localhost
REDIS_PORT=6379
NODE_ENV=development
```

## Running

```bash
# Development
npm run dev

# Production
npm start
```

Server: `http://localhost:4003`

## API Endpoints

### Submit Jobs
- `POST /api/submit/email` - Email with retry
- `POST /api/submit/api-call` - API call with retry
- `POST /api/submit/process-data` - Data processing with retry

### Monitor
- `GET /api/job/:jobId` - Get job status
- `GET /api/stats` - Retry statistics
- `GET /api/strategies` - Available strategies
- `GET /api/calculate-backoff` - Calculate delays
- `GET /api/dashboard` - Dashboard view

## Testing

```bash
# Submit email job
curl -X POST http://localhost:4003/api/submit/email \
  -H "Content-Type: application/json" \
  -d '{
    "to": "test@example.com",
    "subject": "Test",
    "body": "Test body",
    "maxAttempts": 5,
    "baseDelay": 2000
  }'

# Get stats
curl http://localhost:4003/api/stats

# Calculate backoff delays
curl 'http://localhost:4003/api/calculate-backoff?strategy=exponential&attempt=5&baseDelay=2000'

# Get dashboard
curl http://localhost:4003/api/dashboard
```

## Backoff Strategies

| Strategy | Formula | Best For |
|----------|---------|----------|
| Exponential | delay * 2^attempt | API calls, network |
| Linear | delay * attempt | Database ops |
| Fibonacci | fibonacci sequence | Balanced |
| Fixed | constant | Transient errors |

