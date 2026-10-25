# BullMQ - Job Queues Theory

## What is BullMQ?

BullMQ is a fast, reliable, and modern job queue library for Node.js, built on top of Redis. It allows you to process background jobs asynchronously while keeping your application responsive.

### Key Characteristics
```
- Redis-backed persistence
- Reliability with automatic retries
- Multiple job states (pending, active, completed, failed)
- Priority support
- Delayed jobs
- Job events (completed, failed, progress)
- Worker scaling
```

## Why Use Job Queues?

### Problem: Synchronous Processing
```javascript
// Blocking user - slow response
app.post('/send-email', async (req, res) => {
  await sendComplexEmail(); // Takes 30 seconds!
  res.json({ success: true }); // User waits 30 seconds
});
```

### Solution: Job Queue
```javascript
// Fast response, process in background
app.post('/send-email', async (req, res) => {
  await emailQueue.add({ to: req.body.email }); // Instant!
  res.json({ success: true, queued: true });
});

// Process in separate worker
const worker = new Worker('emails', async (job) => {
  await sendComplexEmail(job.data);
});
```

## BullMQ Architecture

```
┌─────────────────┐
│   Application   │
│   (Producer)    │
└────────┬────────┘
         │ Adds Job
         ▼
    ┌─────────┐
    │  Queue  │ (Redis)
    ├─────────┤
    │ Pending │
    │ Delayed │
    │ Active  │
    └────┬────┘
         │
         ▼
    ┌─────────────┐
    │   Worker    │ (Processes jobs)
    │  (Consumer) │
    └─────────────┘
```

## Job States

### Pending
- Job added but not yet processing
- Waiting for a worker to pick it up

### Active
- Worker is currently processing
- Job is locked

### Completed
- Successfully processed

### Failed
- Processing failed
- May retry or move to dead letter queue

### Delayed
- Scheduled to run in the future

## BullMQ Reliability Features

### 1. Atomic Operations
Jobs never get lost - even if server crashes

```javascript
// Job is atomic - either completed or remains in queue
const job = await queue.add({ data });
// If server crashes here, job stays in queue
```

### 2. Auto-Retry
Failed jobs can automatically retry with exponential backoff

```javascript
const job = await queue.add({ data }, {
  attempts: 3,
  backoff: {
    type: 'exponential',
    delay: 2000
  }
});
```

### 3. Dead Letter Queue
After max retries, move to dead letter queue

```javascript
const dlq = new Queue('dead-letter', { connection });
worker.on('failed', async (job, err) => {
  // Job moved to DLQ after retries exhausted
});
```

## Job Priority

### Priority Queues
Process high-priority jobs first

```javascript
// Low priority
queue.add({ email }, { priority: 10 });

// High priority (processes first)
queue.add({ critical }, { priority: 1 });
```

## Delayed Jobs

### Schedule for Future Execution

```javascript
// Process in 5 minutes
queue.add({ data }, { delay: 5 * 60 * 1000 });

// Process at specific time
const delayUntil = new Date(2026, 4, 1, 10, 0, 0); // May 1st 10am
queue.add({ data }, { delay: delayUntil - Date.now() });
```

## Job Progress

### Track Long-Running Operations

```javascript
const worker = new Worker('video-processing', async (job) => {
  for (let i = 0; i <= 100; i++) {
    // Do processing
    await job.progress(i); // 0% to 100%
  }
});

// Listen to progress
job.on('progress', (progress) => {
  console.log(`${progress}% complete`);
});
```

## Common Patterns

### Pattern 1: Email Notifications
```javascript
const emailQueue = new Queue('emails', connection);

app.post('/subscribe', async (req, res) => {
  await emailQueue.add(
    { email: req.body.email },
    { attempts: 3, backoff: { type: 'exponential', delay: 2000 } }
  );
  res.json({ message: 'Confirmation email will be sent' });
});

const worker = new Worker('emails', async (job) => {
  await sendEmail(job.data.email);
});
```

### Pattern 2: Report Generation
```javascript
const reportQueue = new Queue('reports', connection);

app.post('/generate-report', async (req, res) => {
  const job = await reportQueue.add(
    { userId: req.user.id, format: 'pdf' },
    { priority: 5 }
  );
  res.json({ jobId: job.id });
});

const worker = new Worker('reports', async (job) => {
  const report = await generateReport(job.data);
  await saveReportToS3(report);
  job.progress(100);
});
```

### Pattern 3: Batch Processing
```javascript
const batchQueue = new Queue('batch-import', connection);

app.post('/import-data', async (req, res) => {
  const items = req.body.items;
  for (const item of items) {
    await batchQueue.add(item, { attempts: 2 });
  }
  res.json({ jobsQueued: items.length });
});

const worker = new Worker('batch-import', async (job) => {
  await processDataItem(job.data);
});
```

## Redis Requirements

### Connection
```javascript
const connection = {
  host: 'localhost',
  port: 6379,
  password: 'optional-password'
};

const queue = new Queue('myqueue', { connection });
```

### Redis data structures used
- Sorted Sets - for priority and delayed jobs
- Lists - for job storage
- Hashes - for job metadata
- Strings - for job data

## Performance Considerations

### 1. Worker Concurrency
```javascript
// Single job at a time
const worker = new Worker('emails', handler, { concurrency: 1 });

// Multiple jobs in parallel
const worker = new Worker('downloads', handler, { concurrency: 5 });
```

### 2. Job Timeout
```javascript
const job = await queue.add(
  { data },
  { timeout: 30000 } // 30 seconds - job fails if exceeds
);
```

### 3. Job Removal
```javascript
// Remove completed jobs after 1 hour
queue.clean(60 * 1000, 1000, 'completed');

// Remove failed jobs after 24 hours
queue.clean(24 * 60 * 60 * 1000, 0, 'failed');
```

## Real-World Use Cases

1. **Email Services** - Send bulk emails asynchronously
2. **Image Processing** - Generate thumbnails, resize photos
3. **Report Generation** - Create complex reports in background
4. **Data Import/Export** - Process large datasets
5. **Webhooks** - Retry failed webhook deliveries
6. **Analytics** - Process event logs
7. **Notifications** - Push notifications, SMS delivery
8. **Video Transcoding** - Convert video formats
