# Setup Guide - Dead Letter Queue

## What is a Dead Letter Queue?

A DLQ is a queue that stores jobs that have exhausted all retry attempts. It serves as a safety net for failed jobs.

## Installation

```bash
npm install
```

## Environment Variables

Create `.env`:
```bash
HTTP_PORT=4004
REDIS_HOST=localhost
REDIS_PORT=6379
```

## Running

```bash
npm run dev
```

Server: `http://localhost:4004`

## API Endpoints

### Submit Orders
```bash
POST /api/orders
{
  "orderId": "ORD-001",
  "customerId": "CUST-123",
  "items": [...],
  "totalAmount": 99.99
}
```

### Manage Dead Letters
```bash
GET /api/dlq                      # Get all DLQ jobs
GET /api/dlq/:jobId               # Get DLQ job details
POST /api/dlq/:jobId/retry        # Retry specific job
DELETE /api/dlq/:jobId            # Delete job
POST /api/dlq/retry-all           # Bulk retry all
```

### Analysis & Monitoring
```bash
GET /api/analysis/causes          # Analyze failure causes
GET /api/stats                    # DLQ statistics
GET /api/export                   # Export for audit
```

## How Dead Letter Queue Works

```
Job submitted
    ↓
Process with retries (max 3)
    ↓
All retries fail
    ↓
Move to Dead Letter Queue
    ↓
Manual review & retry
    ↓
Delete or reprocess
```

