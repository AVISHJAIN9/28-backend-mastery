# Setup Guide - Priority Queues

## Installation

```bash
npm install
```

## Environment

Create `.env`:
```bash
HTTP_PORT=4006
REDIS_HOST=localhost
REDIS_PORT=6379
```

## Running

```bash
npm run dev
```

Server: `http://localhost:4006`

## API Endpoints

### Submit Jobs
```bash
POST /api/jobs
{
  "taskId": "task-123",
  "data": {...},
  "priority": "high"  # critical, high, normal, low
}
```

### Monitoring
```bash
GET /api/jobs                # All jobs
GET /api/jobs/:jobId         # Specific job
GET /api/levels              # Priority levels info
GET /api/dashboard           # Dashboard view
```

## Priority Values

- `critical` → 0 (highest priority)
- `high` → 1
- `normal` → 5  
- `low` → 10 (lowest priority)

Lower values = processed first!

