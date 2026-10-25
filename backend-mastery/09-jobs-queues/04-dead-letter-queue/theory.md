# Dead Letter Queue (DLQ) Theory

## What is a Dead Letter Queue?

A Dead Letter Queue (DLQ) is where jobs move after they've failed all retry attempts. It's a recovery mechanism for jobs that couldn't be processed despite retries.

### Flow
```
Job Created
    ↓
Attempt Processing
    ↓
Failed (retryable error)
    ↓
Retry According to Backoff
    ↓
Exhausted All Retries
    ↓
Move to Dead Letter Queue
    ↓
Manual Review/Fix
    ↓
Manual Retry or Discard
```

## Why Use DLQ?

1. **Safety** - Don't lose failed jobs
2. **Debugging** - Preserve failed job data and error stack
3. **Recovery** - Retry after fixes are made
4. **Monitoring** - Track problematic jobs
5. **Alerting** - Know when things fail

## DLQ Implementation

### Creating a Separate DLQ Queue

```javascript
const emailQueue = new Queue('emails', { connection });
const emailDLQ = new Queue('emails-dlq', { connection });

const worker = new Worker('emails', handler, { connection });

worker.on('failed', async (job, err) => {
  if (job.attemptsMade === job.opts.attempts) {
    // All retries exhausted - move to DLQ
    await emailDLQ.add(job.data, {
      originalJobId: job.id,
      failedAt: new Date(),
      error: err.message,
      stacktrace: err.stack,
      attemptsMade: job.attemptsMade
    });
    
    console.log(`Job ${job.id} moved to DLQ`);
  }
});
```

### Automatic DLQ with BullMQ

```javascript
const job = await queue.add(data, {
  attempts: 5,
  backoff: { type: 'exponential', delay: 2000 },
  removeOnComplete: false,  // Keep for debugging
  removeOnFail: false       // Keep failed job
});
```

## Common DLQ Patterns

### Pattern 1: Email Delivery Failures
```javascript
// Create main and DLQ queues
const emailQueue = new Queue('emails', { connection });
const emailDLQ = new Queue('emails-dlq', { connection });

const emailWorker = new Worker('emails', async (job) => {
  const { to, subject, body } = job.data;
  
  // This might fail due to invalid email, SMTP timeout, etc.
  await sendEmail(to, subject, body);
}, { connection, concurrency: 5 });

emailWorker.on('failed', async (job, err) => {
  if (job.attemptsMade === job.opts.attempts) {
    await emailDLQ.add({
      ...job.data,
      failureReason: err.message,
      failedAt: new Date(),
      originalJobId: job.id
    });
    
    // Alert admin
    await notifyAdmin(`Email to ${job.data.to} failed permanently`);
  }
});
```

### Pattern 2: Payment Processing

```javascript
const paymentQueue = new Queue('payments', { connection });
const paymentDLQ = new Queue('payments-dlq', { connection });

const paymentWorker = new Worker('payments', async (job) => {
  const result = await processPayment(job.data);
  return result;
}, { connection });

paymentWorker.on('failed', async (job, err) => {
  if (job.attemptsMade === job.opts.attempts) {
    // Move to DLQ for manual review
    const dlqJob = await paymentDLQ.add({
      ...job.data,
      error: err.message,
      originalJobId: job.id,
      failedAt: new Date(),
      requiresManualReview: true
    });
    
    // Create support ticket
    await createSupportTicket({
      type: 'PAYMENT_FAILED',
      jobId: dlqJob.id,
      amount: job.data.amount,
      userId: job.data.userId
    });
  }
});
```

### Pattern 3: Data Import with Validation

```javascript
const importQueue = new Queue('data-import', { connection });
const importDLQ = new Queue('data-import-dlq', { connection });

const importWorker = new Worker('data-import', async (job) => {
  const { data, fileId } = job.data;
  
  // Validate and import
  const result = await validateAndImport(data);
  return result;
}, { connection });

importWorker.on('failed', async (job, err) => {
  if (job.attemptsMade === job.opts.attempts) {
    const dlqJob = await importDLQ.add({
      fileId: job.data.fileId,
      error: err.message,
      sample: job.data.data.slice(0, 5),  // First 5 records
      failedAt: new Date(),
      originalJobId: job.id,
      status: 'requires_review'
    });
    
    // Update file status
    await updateFileStatus(job.data.fileId, 'FAILED', dlqJob.id);
  }
});
```

## DLQ Monitoring

### Tracking DLQ Stats

```javascript
async function getDLQHealth(dlqName) {
  const dlq = new Queue(dlqName, { connection });
  const counts = await dlq.getJobCounts();
  
  return {
    queue: dlqName,
    deadLetters: counts.wait,
    completed: counts.completed,
    failed: counts.failed,
    health: counts.wait > 100 ? 'warning' : 'healthy'
  };
}

// Monitor multiple DLQs
setInterval(async () => {
  const health = {
    emails: await getDLQHealth('emails-dlq'),
    payments: await getDLQHealth('payments-dlq'),
    imports: await getDLQHealth('data-import-dlq')
  };
  
  // Alert if any DLQ has too many jobs
  for (const [name, status] of Object.entries(health)) {
    if (status.deadLetters > 50) {
      await alertOps(`${name} DLQ has ${status.deadLetters} dead letters`);
    }
  }
}, 60000);  // Check every minute
```

### Analyzing Failed Jobs

```javascript
async function analyzeDLQ(dlqName) {
  const dlq = new Queue(dlqName, { connection });
  const failedJobs = await dlq.getWaiting(0, 10);
  
  const analysis = {
    total: failedJobs.length,
    errors: {},
    byTime: {}
  };
  
  for (const job of failedJobs) {
    // Count error types
    const errorType = job.data.failureReason?.split(':')[0];
    analysis.errors[errorType] = (analysis.errors[errorType] || 0) + 1;
    
    // Group by failure time
    const hour = new Date(job.data.failedAt).getHours();
    analysis.byTime[hour] = (analysis.byTime[hour] || 0) + 1;
  }
  
  return analysis;
}
```

## Retry from DLQ

### Manual Retry
```javascript
async function retryFromDLQ(dlqName, jobId) {
  const dlq = new Queue(dlqName, { connection });
  const mainQueue = new Queue(dlqName.replace('-dlq', ''), { connection });
  
  const job = await dlq.getJob(jobId);
  if (!job) throw new Error('Job not found in DLQ');
  
  // Extract original data
  const { originalJobId, ...jobData } = job.data;
  
  // Re-add to main queue
  const newJob = await mainQueue.add(jobData, {
    attempts: 3,  // Fresh retry count
    backoff: { type: 'exponential', delay: 2000 }
  });
  
  // Remove from DLQ
  await job.remove();
  
  return newJob.id;
}
```

### Bulk Retry
```javascript
async function bulkRetryDLQ(dlqName, filter = {}) {
  const dlq = new Queue(dlqName, { connection });
  const mainQueue = new Queue(dlqName.replace('-dlq', ''), { connection });
  
  const failedJobs = await dlq.getWaiting(0, 10000);
  let retried = 0;
  
  for (const job of failedJobs) {
    // Apply filter
    if (filter.beforeDate && new Date(job.data.failedAt) > new Date(filter.beforeDate)) {
      continue;
    }
    
    if (filter.errorType && !job.data.error?.includes(filter.errorType)) {
      continue;
    }
    
    // Re-add to main queue
    await mainQueue.add(job.data, {
      attempts: 3,
      backoff: { type: 'exponential', delay: 2000 }
    });
    
    await job.remove();
    retried++;
  }
  
  return retried;
}
```

## Error Classification

### Retryable Errors
```javascript
const retryableErrors = [
  'ECONNREFUSED',
  'ETIMEDOUT',
  'EHOSTUNREACH',
  'ENETUNREACH',
  'ECONNRESET',
  '503',  // Service Unavailable
  '429'   // Too Many Requests
];
```

### Non-Retryable Errors
```javascript
const nonRetryableErrors = [
  400,  // Bad Request
  401,  // Unauthorized
  403,  // Forbidden
  404,  // Not Found
  422   // Unprocessable Entity
];
```

### Smart Retry Logic
```javascript
function shouldRetry(error) {
  // Check error code
  if (nonRetryableErrors.includes(error.statusCode)) {
    return false;
  }
  
  // Check error message
  if (error.message?.includes('Invalid') || error.message?.includes('Not found')) {
    return false;
  }
  
  // Default to retry
  return true;
}
```

## DLQ Best Practices

1. **Always create a DLQ** for critical jobs
2. **Monitor DLQ size** - alert if growing
3. **Log detailed errors** - include stack traces
4. **Implement retry logic** - allow manual retries
5. **Set DLQ retention** - don't keep forever
6. **Review failed jobs** - understand why they fail
7. **Fix root causes** - don't just retry blindly
8. **Alert on DLQ growth** - sign of systemic issues

## Clean Old Dead Letters

```javascript
async function cleanOld DLQ(dlqName, ageInDays = 7) {
  const dlq = new Queue(dlqName, { connection });
  const cutoffTime = Date.now() - (ageInDays * 24 * 60 * 60 * 1000);
  
  const allJobs = await dlq.getWaiting(0, 10000);
  let deleted = 0;
  
  for (const job of allJobs) {
    if (new Date(job.data.failedAt).getTime() < cutoffTime) {
      await job.remove();
      deleted++;
    }
  }
  
  return deleted;
}
```

