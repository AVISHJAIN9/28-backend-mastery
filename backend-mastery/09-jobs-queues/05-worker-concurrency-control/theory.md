# Worker Concurrency Control Theory

## What is Worker Concurrency?

Concurrency is the number of jobs a worker processes simultaneously. It directly affects throughput, resource usage, and load on external services.

### Concurrency vs Sequential

```javascript
// Concurrency: 1 (sequential)
const worker = new Worker('emails', handler, { concurrency: 1 });
// Process: Job 1 → Job 2 → Job 3

// Concurrency: 5 (parallel)
const worker = new Worker('emails', handler, { concurrency: 5 });
// Process: Job 1,2,3,4,5 simultaneously
```

## Why Control Concurrency?

1. **Resource Management** - Prevent server overload
2. **Rate Limiting** - Respect API limits
3. **Database Connections** - Limit connection pool usage
4. **Memory Usage** - Control heap memory
5. **CPU Usage** - Balance CPU utilization
6. **External Service Throttling** - Don't hammer APIs

## Concurrency Strategies

### Strategy 1: Single Worker (Concurrency 1)
```javascript
const worker = new Worker('critical-tasks', handler, { 
  connection,
  concurrency: 1 
});
```
- **Use when**: Tasks must be sequential (database migrations, single resource updates)
- **Throughput**: ~10 jobs/min (slow)
- **Resource**: Minimal

### Strategy 2: Low Concurrency (2-5)
```javascript
const worker = new Worker('api-calls', handler, { 
  connection,
  concurrency: 3 
});
```
- **Use when**: External API with rate limits
- **Throughput**: ~30 jobs/min
- **Resource**: Low

### Strategy 3: Medium Concurrency (5-20)
```javascript
const worker = new Worker('emails', handler, { 
  connection,
  concurrency: 10 
});
```
- **Use when**: Internal processing, moderate resources
- **Throughput**: ~100 jobs/min
- **Resource**: Moderate

### Strategy 4: High Concurrency (20+)
```javascript
const worker = new Worker('fast-cache', handler, { 
  connection,
  concurrency: 50 
});
```
- **Use when**: Fast operations (cache updates)
- **Throughput**: ~500 jobs/min
- **Resource**: High

## CPU vs I/O Bound Tasks

### I/O Bound (High Concurrency)
```javascript
// Network calls - can wait for I/O
const emailWorker = new Worker('emails', async (job) => {
  // Waiting for SMTP server - doesn't use CPU
  return await sendEmail(job.data);
}, { 
  connection, 
  concurrency: 20  // High concurrency
});

// Database queries - can wait for database
const dbWorker = new Worker('db-queries', async (job) => {
  // Waiting for database - doesn't use CPU
  return await db.query(job.data.sql);
}, {
  connection,
  concurrency: 15
});
```

### CPU Bound (Low Concurrency)
```javascript
// Image processing - uses CPU
const imageWorker = new Worker('image-processing', async (job) => {
  // Image resizing uses 100% CPU until complete
  return await resizeImage(job.data.path);
}, {
  connection,
  concurrency: 2  // Low - only 2 tasks can run
});

// Video encoding - uses CPU
const videoWorker = new Worker('video-encoding', async (job) => {
  // Video encoding = intensive CPU work
  return await encodeVideo(job.data.path);
}, {
  connection,
  concurrency: 1  // Or 2 if dual-core
});
```

## Dynamic Concurrency

### Adjust Based on System Load

```javascript
function getOptimalConcurrency() {
  const cpuUsage = os.cpus().length;
  const memUsage = os.freemem() / os.totalmem();
  
  if (memUsage < 0.2) return 1;    // Low memory
  if (memUsage < 0.4) return 3;
  if (memUsage < 0.6) return 5;
  return 10;
}

const worker = new Worker('tasks', handler, {
  connection,
  concurrency: getOptimalConcurrency()
});
```

### Adjust Based on Time of Day

```javascript
function getConcurrencyByTime() {
  const hour = new Date().getHours();
  
  // Peak hours (9am-5pm)
  if (hour >= 9 && hour <= 17) {
    return 5;  // Lower concurrency during peak
  }
  
  // Off-peak
  return 15;  // Higher concurrency
}

setInterval(() => {
  const newConcurrency = getConcurrencyByTime();
  worker.concurrency = newConcurrency;
  console.log(`Adjusted concurrency to ${newConcurrency}`);
}, 60000);  // Check every minute
```

## Concurrency per Task Type

```javascript
// Different workers for different tasks
const emailWorker = new Worker('emails', emailHandler, {
  connection,
  concurrency: 10  // Emails are I/O bound
});

const reportWorker = new Worker('reports', reportHandler, {
  connection,
  concurrency: 2  // Reports are CPU bound
});

const imageWorker = new Worker('images', imageHandler, {
  connection,
  concurrency: 4  // Images are CPU bound
});

const cacheWorker = new Worker('cache', cacheHandler, {
  connection,
  concurrency: 20  // Cache updates are fast
});
```

## Monitoring Concurrency

### Track Active Jobs

```javascript
setInterval(async () => {
  const queue = new Queue('emails', { connection });
  const active = await queue.getActiveCount();
  const waiting = await queue.getWaitingCount();
  
  console.log(`Active: ${active}, Waiting: ${waiting}`);
  
  // Alert if queue is backing up
  if (waiting > 1000) {
    await alertOps('Email queue has 1000+ waiting jobs');
  }
}, 30000);
```

### Worker Metrics

```javascript
const worker = new Worker('tasks', handler, { connection, concurrency: 5 });

let completed = 0;
let failed = 0;
let avgDuration = 0;

worker.on('completed', (job, result, prev) => {
  completed++;
  const duration = Date.now() - prev;
  avgDuration = (avgDuration + duration) / 2;
});

worker.on('failed', () => {
  failed++;
});

setInterval(() => {
  const successRate = (completed / (completed + failed)) * 100;
  console.log(`Success rate: ${successRate.toFixed(2)}%`);
  console.log(`Avg duration: ${avgDuration.toFixed(0)}ms`);
}, 60000);
```

## Backpressure Handling

When queue is growing faster than processing:

```javascript
async function handleBackpressure() {
  const queue = new Queue('tasks', { connection });
  const waiting = await queue.getWaitingCount();
  
  if (waiting > 5000) {
    // Too many waiting jobs - reduce new job acceptance
    return {
      canAccept: false,
      reason: `Queue backlog: ${waiting} jobs waiting`
    };
  }
  
  return { canAccept: true };
}

// In your API endpoint
app.post('/jobs', async (req, res) => {
  const { canAccept, reason } = await handleBackpressure();
  
  if (!canAccept) {
    return res.status(429).json({ error: reason });
  }
  
  // Add job
  const job = await queue.add(req.body);
  res.json({ jobId: job.id });
});
```

## Concurrency Best Practices

1. **Start Conservative** - Begin with low concurrency, increase gradually
2. **Monitor Impact** - Watch CPU, memory, and response times
3. **Test with Load** - Simulate high volume before production
4. **Set Limits** - Cap concurrency to prevent resource exhaustion
5. **Different Settings per Task** - Email ≠ Image Processing
6. **Use Auto-scaling** - Adjust concurrency based on load
7. **Circuit Breaker** - Stop processing if external service is down
8. **Dead Letter Queue** - Catch failures without slowing queue

## Circuit Breaker Pattern

```javascript
class CircuitBreaker {
  constructor(threshold = 5) {
    this.failureCount = 0;
    this.threshold = threshold;
    this.isOpen = false;
  }
  
  async execute(fn) {
    if (this.isOpen) {
      throw new Error('Circuit breaker is open');
    }
    
    try {
      const result = await fn();
      this.failureCount = 0;  // Reset on success
      return result;
    } catch (error) {
      this.failureCount++;
      if (this.failureCount >= this.threshold) {
        this.isOpen = true;
        console.log('Circuit breaker opened');
      }
      throw error;
    }
  }
}

const breaker = new CircuitBreaker(5);

const worker = new Worker('api-calls', async (job) => {
  return await breaker.execute(() => callExternalAPI(job.data));
}, { connection, concurrency: 3 });
```

## Performance Tuning

| Config | Throughput | CPU | Memory | Use Case |
|--------|-----------|-----|--------|----------|
| 1 | 10 jobs/min | Low | Low | Critical sequential tasks |
| 3 | 30 jobs/min | Low | Low | Rate-limited APIs |
| 5 | 50 jobs/min | Low | Moderate | Balanced I/O |
| 10 | 100 jobs/min | Moderate | Moderate | Email, notifications |
| 20 | 200 jobs/min | High | High | Cache, fast operations |
| 50+ | 500+ jobs/min | Very High | Very High | Specialized high-speed |

---

**Rule of Thumb**: Concurrency = Number of CPU cores × 2 for I/O bound tasks

