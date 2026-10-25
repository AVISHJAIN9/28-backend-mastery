# BullMQ Job Queues - Setup & Implementation Guide

## What is BullMQ?

BullMQ is a fast, reliable job queue library for Node.js built on Redis. It enables asynchronous job processing with features like auto-retry, job priority, and progress tracking.

## Why Use BullMQ?

1. **Non-blocking operations** - Don't block user requests for long operations
2. **Reliable processing** - Jobs persist in Redis and survive server crashes
3. **Auto-retry with backoff** - Failed jobs automatically retry with exponential backoff
4. **Job priority** - Process important jobs first
5. **Progress tracking** - Real-time job progress updates
6. **Failed job handling** - Dead letter queues for failed jobs
7. **Scalability** - Distribute jobs across multiple workers

## Installation

```bash
npm install bullmq redis
```

## Prerequisites

- Redis server running (local or remote)
- Node.js 14+

## Quick Start

### 1. Start Redis

```bash
# Using Docker
docker run -d -p 6379:6379 redis:latest

# Or install locally and run
redis-server
```

### 2. Setup Environment

```bash
cp .env.example .env
# Edit .env with your Redis connection details
```

### 3. Create a Queue

```javascript
const { Queue } = require('bullmq');

const connection = {
  host: 'localhost',
  port: 6379
};

const emailQueue = new Queue('emails', { connection });
```

### 4. Add Jobs

```javascript
app.post('/send-email', async (req, res) => {
  const job = await emailQueue.add(
    { to: req.body.email, subject: 'Hello' },
    { attempts: 3, backoff: { type: 'exponential', delay: 2000 } }
  );
  
  res.json({ jobId: job.id, status: 'queued' });
});
```

### 5. Create a Worker

```javascript
const { Worker } = require('bullmq');

const worker = new Worker('emails', async (job) => {
  console.log(`Processing job ${job.id}`);
  
  // Your actual email sending logic
  await sendEmail(job.data);
  
  return { success: true };
}, { connection, concurrency: 2 });

worker.on('completed', (job) => {
  console.log(`Job ${job.id} completed`);
});

worker.on('failed', (job, err) => {
  console.error(`Job ${job.id} failed:`, err.message);
});
```

## API Endpoints

### Add Jobs
- `POST /jobs/email` - Add email job
- `POST /jobs/report` - Add report generation job
- `POST /jobs/bulk` - Add multiple jobs at once

### Monitor Jobs
- `GET /queues/:queueName/stats` - Queue statistics
- `GET /jobs/:jobId/status/:queueName` - Job status and progress
- `GET /queues/:queueName/jobs/:status` - List jobs by status (wait, active, completed, failed)

### Control Jobs
- `POST /jobs/:jobId/retry/:queueName` - Retry a failed job
- `DELETE /jobs/:jobId/:queueName` - Remove a job
- `DELETE /queues/:queueName/clear` - Clear all jobs from queue

### Health
- `GET /queues/:queueName/workers` - Get worker status

## Job Options

```javascript
const job = await queue.add(data, {
  // Retry configuration
  attempts: 3,                    // Number of retry attempts
  backoff: {
    type: 'exponential',          // 'exponential' or 'fixed'
    delay: 2000                   // Initial delay in ms
  },

  // Priority (1 = high priority)
  priority: 5,

  // Delay before processing
  delay: 5000,                    // Process after 5 seconds

  // Timeout
  timeout: 30000,                 // 30 seconds max processing time

  // Auto-removal
  removeOnComplete: true,         // Remove after completion
  removeOnFail: false             // Keep failed jobs for debugging
});
```

## Job States

```
Pending → Active → Completed
               ↓
             Failed → Retry → Active
               ↓
           Dead Letter Queue
```

## Monitoring Queue Health

```javascript
// Get queue statistics
const counts = await queue.getJobCounts('wait', 'active', 'completed', 'failed', 'delayed');
console.log(counts);
// Output: { wait: 5, active: 2, completed: 100, failed: 3, delayed: 0 }

// Get specific jobs
const pendingJobs = await queue.getWaiting(0, 10);     // First 10 pending
const activeJobs = await queue.getActive();             // All active
const completedJobs = await queue.getCompleted(0, 10);  // First 10 completed
const failedJobs = await queue.getFailed(0, 10);        // First 10 failed
```

## Error Handling

```javascript
const worker = new Worker('tasks', handler, { connection });

worker.on('failed', (job, err) => {
  console.error(`Job ${job.id} failed after ${job.attemptsMade} attempts`);
  console.error(`Reason: ${err.message}`);
  
  if (job.attemptsMade === job.opts.attempts) {
    // Max retries exhausted - send to dead letter queue
    await moveToDeadLetterQueue(job);
  }
});

worker.on('error', (err) => {
  console.error('Worker error:', err);
});
```

## Common Patterns

### Pattern 1: Email Service
```javascript
const emailQueue = new Queue('emails', { connection });

app.post('/newsletter', async (req, res) => {
  for (const email of req.body.subscribers) {
    await emailQueue.add({ email, content: req.body.content }, {
      attempts: 3,
      backoff: { type: 'exponential', delay: 2000 }
    });
  }
  res.json({ queued: req.body.subscribers.length });
});

const emailWorker = new Worker('emails', async (job) => {
  await sendEmail(job.data.email, job.data.content);
}, { connection, concurrency: 5 });
```

### Pattern 2: Report Generation with Progress
```javascript
app.post('/generate-report', async (req, res) => {
  const job = await reportQueue.add({
    userId: req.user.id,
    type: 'sales'
  });
  res.json({ jobId: job.id });
});

job.on('progress', (progress) => {
  // Send progress to client via WebSocket
  io.emit('report-progress', { jobId: job.id, progress });
});

const reportWorker = new Worker('reports', async (job) => {
  for (let i = 0; i <= 100; i += 10) {
    // Do processing
    await job.progress(i);
  }
}, { connection, concurrency: 2 });
```

### Pattern 3: Batch Processing with Priority
```javascript
// High priority: customer-facing
await queue.add({ data }, { priority: 1, attempts: 5 });

// Normal priority: internal processes
await queue.add({ data }, { priority: 5, attempts: 2 });

// Low priority: analytics
await queue.add({ data }, { priority: 10, attempts: 1 });
```

## Testing

```bash
# Install dev dependencies
npm install --save-dev jest supertest

# Run tests
npm test
```

## Production Considerations

1. **Redis Persistence** - Use RDB or AOF for data durability
2. **Redis Replication** - Setup master-slave for high availability
3. **Worker Scaling** - Run multiple workers on different servers
4. **Queue Monitoring** - Track queue size and job metrics
5. **Dead Letter Queue** - Process failed jobs manually
6. **Job Cleanup** - Periodically clean completed jobs to free memory

## Troubleshooting

### Jobs stuck in "Active" state
```javascript
// Clean stale active jobs
await queue.clean(30000, 100, 'active'); // Remove active jobs older than 30 seconds
```

### Redis connection timeout
```javascript
// Check Redis is running
redis-cli ping  // Should respond PONG

// Verify connection settings
const connection = {
  host: 'localhost',
  port: 6379,
  password: 'your-password'  // If Redis has password
};
```

### Worker not picking up jobs
```javascript
// Verify worker is running
const workers = await queue.getWorkers();
console.log(`Workers: ${workers.length}`);

// Check worker logs
worker.on('error', (err) => console.error('Worker error:', err));
```

