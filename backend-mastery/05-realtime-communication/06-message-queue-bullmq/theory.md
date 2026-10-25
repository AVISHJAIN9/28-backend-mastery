# Message Queue - Bull/BullMQ Theory

## What is a Message Queue?

A message queue is a system for asynchronously processing tasks. Instead of blocking the user for slow operations, tasks go into a queue for background workers to process.

### Synchronous Problem
```
User action → Long task (5-10 seconds) → UI blocked → Bad UX
```

### Asynchronous Solution
```
User action → Queue task (instant) → UI responsive → Worker processes in background
```

## Why Bull/BullMQ?

Bull is a Redis-based job queue with:
- Persistence (Redis stores jobs)
- Automatic retry with exponential backoff
- Priority support
- Job timeout handling
- Delayed execution
- Failed job handling

## Job Lifecycle

```
1. Producer adds job to queue
2. Job stored in Redis
3. Worker picks up job
4. Job processing begins
5. Success → Remove from queue
   OR
   Failure → Retry with backoff (exp delay)
6. Max retries exceeded → Move to failed queue
7. Admin can retry failed jobs manually
```

## Job States

```
PENDING → ACTIVE → COMPLETED
             ↓
          FAILED (retry) → PENDING
             ↓
          FAILED (permanently)
             
DELAYED → PENDING (after delay) → ...
WAITING → ACTIVE
```

## Job Configuration

### Basic Job
```javascript
const job = await queue.add('send-email', {
  to: 'user@example.com',
  subject: 'Welcome'
});
```

### Job with Options
```javascript
const job = await queue.add('send-email',
  { data },
  {
    delay: 5000,              // Wait 5s before processing
    attempts: 3,               // Retry 3 times on failure
    backoff: {
      type: 'exponential',     // 1s, 2s, 4s delays
      delay: 2000
    },
    removeOnComplete: true,    // Delete after success
    removeOnFail: false,       // Keep failed jobs
    priority: 1                // Higher = process first (0-2147483647)
  }
);
```

### Job Timeout
```javascript
queue.process('send-email', async (job) => {
  // Must complete within 30 seconds
  // or job marked as failed
  return await sendEmail(job.data);
}, {
  concurrency: 5,        // Process 5 jobs simultaneously
  timeout: 30000         // 30 second timeout
});
```

## Processing Jobs

### Basic Processor
```javascript
queue.process(async (job) => {
  console.log(`Processing job ${job.id}`);
  const result = await performTask(job.data);
  return result; // Job succeeds
  
  // Throw error to retry
  throw new Error('Task failed');
});
```

### Progress Tracking
```javascript
queue.process(async (job) => {
  for (let i = 0; i < 100; i++) {
    await doWork();
    job.progress(i);  // Update progress
  }
  return 'Done';
});

// Listen to progress
job.on('progress', (progress) => {
  console.log(`${progress}% complete`);
});
```

### Job Completion
```javascript
job.on('completed', (result) => {
  console.log('Job completed:', result);
});

job.on('failed', (err) => {
  console.log('Job failed:', err.message);
});

job.on('stalled', () => {
  console.log('Job appears stuck, will retry');
});
```

## Retry Strategy

### Default Backoff
```
Attempt 1: Immediately
Attempt 2: Wait 2s (delay * 1)
Attempt 3: Wait 4s (delay * 2)
Attempt 4: Wait 8s (delay * 4)
Total: Exponential backoff
```

### Custom Backoff
```javascript
backoff: {
  type: 'fixed',       // Same delay every time
  delay: 5000          // 5 seconds
}

backoff: {
  type: 'exponential',
  delay: 1000
}
```

## Dead Letter Handling

### What Happens to Failed Jobs
```
1. When attempts exhausted
2. Job moved to failed set in Redis
3. Available for manual inspection
4. Can retry manually via admin UI
5. Can store in database for logging
```

### Failed Job Processor
```javascript
queue.on('failed', async (job, err) => {
  console.log(`Job ${job.id} failed: ${err.message}`);
  
  // Store to database for analysis
  await FailedJobs.create({
    jobId: job.id,
    queue: job.queueName,
    data: job.data,
    error: err.message,
    timestamp: new Date()
  });
});
```

## Scaling Considerations

### Multiple Workers
```
Queue (Redis)
├─ Worker 1 (process 5 jobs/sec)
├─ Worker 2 (process 5 jobs/sec)
└─ Worker 3 (process 5 jobs/sec)
  = 15 jobs/sec throughput
```

### Priority Queue
```
High priority jobs processed first
Medium priority when queue empty
Low priority when all else done
```

### Job Isolation
```
Each queue separate:
- queue:emails
- queue:reports
- queue:notifications

One queue failing doesn't affect others
```

## Monitoring

### Queue Stats
```javascript
const counts = await queue.getJobCounts(
  'active',     // Currently processing
  'wait',       // Waiting to process
  'completed',  // Completed successfully
  'failed',     // Failed permanently
  'delayed'     // Waiting for delay
);
```

### Health Check
```javascript
async function checkQueueHealth() {
  const stats = await queue.getJobCounts();
  
  if (stats.failed > 100) alert('Many failures');
  if (stats.active === 0 && stats.wait > 1000) alert('No workers');
}
```

## Best Practices

✅ Set reasonable timeouts
✅ Implement retry limits
✅ Monitor queue depth
✅ Log job failures
✅ Use priority for critical jobs
✅ Clean up old jobs
✅ Test failure scenarios
✅ Implement health checks
✅ Use separate queues by type
✅ Archive completed jobs periodically
