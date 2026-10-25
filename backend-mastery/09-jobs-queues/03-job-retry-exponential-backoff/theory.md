# Job Retry with Exponential Backoff Theory

## What is Exponential Backoff?

Exponential backoff is a retry strategy where the delay between attempts increases exponentially. Instead of retrying immediately, you wait progressively longer before each retry.

### Why Exponential Backoff?

1. **Reduces Server Load** - Don't hammer failing services
2. **Prevents Cascading Failures** - Give systems time to recover
3. **Increases Success Rate** - Temporary failures might resolve
4. **Better Resource Utilization** - Don't waste CPU on retries

### Basic Formula

```
Delay = initialDelay * (2 ^ attemptNumber)

Attempt 1: 1s * (2^0) = 1 second
Attempt 2: 1s * (2^1) = 2 seconds
Attempt 3: 1s * (2^2) = 4 seconds
Attempt 4: 1s * (2^3) = 8 seconds
Attempt 5: 1s * (2^4) = 16 seconds
```

## Backoff Strategies

### 1. Linear Backoff
```javascript
delay = initialDelay * attemptNumber

// Attempt 1: 1s
// Attempt 2: 2s
// Attempt 3: 3s
// Attempt 4: 4s
```

**When to use**: Quick retries (connection resets)

### 2. Exponential Backoff
```javascript
delay = initialDelay * (2 ^ attemptNumber)

// Attempt 1: 1s
// Attempt 2: 2s
// Attempt 3: 4s
// Attempt 4: 8s
// Attempt 5: 16s (caps at 5 min)
```

**When to use**: API calls, external services

### 3. Exponential Backoff with Jitter
```javascript
delay = initialDelay * (2 ^ attemptNumber) + random(0, 1000)

// Prevents thundering herd problem
// Multiple clients don't retry at same time
```

**When to use**: Distributed systems, load balancing

## BullMQ Retry Configuration

### Basic Retry
```javascript
const job = await queue.add(data, {
  attempts: 3  // Retry up to 3 times total
});
```

### Exponential Backoff in BullMQ
```javascript
const job = await queue.add(data, {
  attempts: 5,
  backoff: {
    type: 'exponential',
    delay: 2000  // Initial delay: 2 seconds
  }
});

// Will retry at: 2s, 4s, 8s, 16s, 32s
```

### Fixed Delay
```javascript
const job = await queue.add(data, {
  attempts: 3,
  backoff: {
    type: 'fixed',
    delay: 5000  // Always wait 5 seconds
  }
});
```

### Custom Backoff
```javascript
const job = await queue.add(data, {
  attempts: 5,
  backoff: {
    type: 'custom',
    delay: (attemptsMade) => {
      return Math.pow(2, attemptsMade) * 1000 + Math.random() * 1000;
    }
  }
});
```

## Maximum Delay Caps

Exponential backoff can grow too large. Cap the maximum delay:

```javascript
function calculateDelay(attemptNumber, initialDelay = 1000, maxDelay = 60000) {
  const exponentialDelay = initialDelay * Math.pow(2, attemptNumber - 1);
  return Math.min(exponentialDelay, maxDelay);
}

// Attempt 1: 1s
// Attempt 2: 2s
// Attempt 3: 4s
// Attempt 4: 8s
// Attempt 5: 16s
// Attempt 6: 32s
// Attempt 7: 60s (capped)
// Attempt 8: 60s (capped)
```

## Retry Patterns

### Pattern 1: Temporary Failures (Network)
```javascript
const job = await queue.add(
  { url: 'https://api.example.com/data' },
  {
    attempts: 5,
    backoff: { type: 'exponential', delay: 1000 }
  }
);

// Retry for: 1s, 2s, 4s, 8s, 16s
// Total time: 31 seconds to give up
```

### Pattern 2: Rate Limited APIs
```javascript
const job = await queue.add(
  { apiKey, endpoint: '/users' },
  {
    attempts: 10,
    backoff: { type: 'exponential', delay: 5000 }  // Longer initial delay
  }
);

// Wait longer between attempts for rate-limited APIs
```

### Pattern 3: Database Transient Errors
```javascript
const job = await queue.add(
  { query, database: 'redis' },
  {
    attempts: 3,
    backoff: { type: 'fixed', delay: 2000 }  // Quick retries
  }
);

// Database errors usually resolve quickly
```

### Pattern 4: External Service Outage
```javascript
const job = await queue.add(
  { paymentData },
  {
    attempts: 7,
    backoff: { 
      type: 'exponential', 
      delay: 10000,  // Start with longer delay
      maxDelay: 300000  // Max 5 minutes
    }
  }
);

// For critical payments, retry aggressively but not too fast
```

## Monitoring Retries

```javascript
const worker = new Worker('payments', handler, { connection });

worker.on('failed', (job, err) => {
  console.log(`Attempt ${job.attemptsMade}/${job.opts.attempts} failed`);
  console.log(`Reason: ${err.message}`);
  
  if (job.attemptsMade === job.opts.attempts) {
    console.error(`Job ${job.id} exhausted all retries`);
    // Send alert
    await notifyTeam(`Payment processing failed after ${job.attemptsMade} retries`);
  }
});

worker.on('progress', (job, progress) => {
  console.log(`Job progress: ${progress}%`);
});
```

## When NOT to Retry

1. **Invalid Input** - Will keep failing
2. **Authentication Errors** - Won't become valid
3. **Permission Denied** - Retries won't help
4. **Resource Not Found (404)** - Will always fail
5. **Unsupported Feature** - Never will work

### Filter Non-Retryable Errors
```javascript
const worker = new Worker('api-calls', async (job) => {
  try {
    return await callAPI(job.data);
  } catch (error) {
    // Don't retry if 401 or 403
    if (error.status === 401 || error.status === 403) {
      throw new Error('Authentication/Authorization failed - not retrying');
    }
    
    // Don't retry if 404
    if (error.status === 404) {
      throw new Error('Resource not found - not retrying');
    }
    
    // Retry for other errors
    throw error;
  }
}, { connection });
```

## Retry Budget

Track how many jobs are retrying:

```javascript
const getRetryMetrics = async (queue) => {
  const counts = await queue.getJobCounts();
  const allJobs = await queue.getWaiting(0, 10000);
  
  let totalRetries = 0;
  let maxRetries = 0;
  
  for (const job of allJobs) {
    totalRetries += job.attemptsMade;
    maxRetries = Math.max(maxRetries, job.attemptsMade);
  }
  
  return {
    totalJobs: counts.wait,
    totalRetries,
    averageRetries: totalRetries / counts.wait,
    maxRetries
  };
};
```

## Dead Letter Queue vs Retries

- **Retries**: Temporary failures (network, timeouts)
- **Dead Letter Queue**: Permanent failures after all retries exhausted

```
Job → Attempts to process
  → Failed: Wait (backoff)
  → Retry...
  → Failed after all attempts: → Dead Letter Queue
  → Manual review/fix
  → Manual retry or discard
```

## Anti-Patterns to Avoid

### ❌ Retrying All Errors Equally
```javascript
// BAD: Retries network issues and validation errors alike
const job = await queue.add(data, { attempts: 10 });
```

### ✅ Selective Retry
```javascript
// GOOD: Only retry transient failures
try {
  return await process(job.data);
} catch (err) {
  if (err.code === 'ETIMEDOUT' || err.code === 'ECONNREFUSED') {
    throw err;  // Retry
  }
  throw new Error('Non-retryable: ' + err.message);  // Don't retry
}
```

### ❌ Too Many Retries
```javascript
// BAD: Wastes resources retrying obviously broken jobs
const job = await queue.add(data, { attempts: 1000 });
```

### ✅ Reasonable Retry Count
```javascript
// GOOD: Balance between resilience and resources
const job = await queue.add(data, { 
  attempts: 5,  // Max 5 total attempts
  backoff: { type: 'exponential', delay: 1000 }
});
```

### ❌ Exponential Backoff Without Cap
```javascript
// BAD: Delay grows unbounded
delay = 1000 * Math.pow(2, attemptNumber);
```

### ✅ Capped Exponential Backoff
```javascript
// GOOD: Delay grows but with reasonable max
const delay = Math.min(
  1000 * Math.pow(2, attemptNumber),
  300000  // Max 5 minutes
);
```

## Best Practices

1. **Use exponential backoff** for transient failures
2. **Cap maximum delay** to reasonable value (usually 5-10 minutes)
3. **Add jitter** to prevent thundering herd
4. **Log failures** with attempt count
5. **Monitor retry metrics** to catch issues early
6. **Use DLQ** for jobs exhausting retries
7. **Alert on excessive retries** -may indicate outages
8. **Different backoff for different job types** - urgent vs background

