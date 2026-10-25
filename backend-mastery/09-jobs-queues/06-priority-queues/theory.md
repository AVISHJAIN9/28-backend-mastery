# Priority Queues Theory

## What are Priority Queues?

A priority queue processes jobs based on importance level, not just FIFO (First-In-First-Out). Higher priority jobs execute before lower priority ones.

### Priority Levels

```javascript
// Priority 1 = Highest (process first)
// Priority 10 = Lowest (process last)

await queue.add(criticalData, { priority: 1 });      // URGENT
await queue.add(normalData, { priority: 5 });        // NORMAL
await queue.add(bulkData, { priority: 10 });         // LOW
```

## Priority Matrix

```
┌─────────────────────────────────────────┐
│         PRIORITIZATION MATRIX            │
├──────────┬──────────┬──────────┬─────────┤
│ Priority │  Type    │ Example  │ Wait    │
├──────────┼──────────┼──────────┼─────────┤
│  1-2     │ Critical │ Payment  │ <1s     │
│  3-4     │ High     │ Login    │ <10s    │
│  5-6     │ Normal   │ Email    │ <1min   │
│  7-8     │ Low      │ Report   │ <1hour  │
│  9-10    │ Bulk     │ Import   │ >1hour  │
└──────────┴──────────┴──────────┴─────────┘
```

## Use Cases by Priority

### Priority 1-2 (Critical)
```javascript
// Payment processing - must complete quickly
await paymentQueue.add(paymentData, { 
  priority: 1,
  attempts: 5,
  timeout: 30000 
});

// Authentication - user is waiting
await authQueue.add(authData, { 
  priority: 1,
  timeout: 5000 
});

// Real-time notifications
await notificationQueue.add(notifData, { 
  priority: 2,
  timeout: 10000 
});
```

### Priority 3-4 (High)
```javascript
// User login - should be quick
await loginQueue.add(loginData, { 
  priority: 3,
  timeout: 10000 
});

// Profile updates - user initiated
await profileQueue.add(profileData, { 
  priority: 4,
  timeout: 15000 
});
```

### Priority 5-6 (Normal)
```javascript
// Email notifications - standard
await emailQueue.add(emailData, { 
  priority: 5,
  timeout: 30000,
  attempts: 3 
});

// Data sync - regular
await syncQueue.add(syncData, { 
  priority: 6,
  timeout: 60000 
});
```

### Priority 7-8 (Low)
```javascript
// Report generation - can wait
await reportQueue.add(reportData, { 
  priority: 8,
  timeout: 300000  // 5 minutes
});

// Analytics processing
await analyticsQueue.add(analyticsData, { 
  priority: 7,
  timeout: 120000  // 2 minutes
});
```

### Priority 9-10 (Bulk)
```javascript
// Large imports
await importQueue.add(importData, { 
  priority: 10,
  timeout: 600000  // 10 minutes
});

// Batch processing
await batchQueue.add(batchData, { 
  priority: 10,
  timeout: 300000
});
```

## Multi-Queue Strategy

Instead of one queue with priorities, use multiple queues:

```javascript
// Create separate queues per priority
const criticalQueue = new Queue('tasks:critical', { connection });
const normalQueue = new Queue('tasks:normal', { connection });
const lowQueue = new Queue('tasks:low', { connection });

// Add to appropriate queue based on priority
function addJob(data, priority) {
  if (priority <= 2) {
    return criticalQueue.add(data, { attempts: 3 });
  } else if (priority <= 6) {
    return normalQueue.add(data, { attempts: 2 });
  } else {
    return lowQueue.add(data, { attempts: 1 });
  }
}

// Process in priority order
const criticalWorker = new Worker(
  'tasks:critical',
  handler,
  { connection, concurrency: 5 }
);

const normalWorker = new Worker(
  'tasks:normal',
  handler,
  { connection, concurrency: 10 }
);

const lowWorker = new Worker(
  'tasks:low',
  handler,
  { connection, concurrency: 20 }
);
```

## Real-World Examples

### E-Commerce Example
```javascript
const orderQueue = new Queue('orders', { connection });

async function processOrder(orderData) {
  // Express orders get priority
  const priority = orderData.express ? 2 : 5;
  
  const job = await orderQueue.add(orderData, {
    priority,
    attempts: 3,
    backoff: { type: 'exponential', delay: 2000 }
  });
  
  return job.id;
}

// Customer 1: Standard shipping
await processOrder({
  id: 'ORD-001',
  items: [...],
  express: false  // priority: 5
});

// Customer 2: Express delivery
await processOrder({
  id: 'ORD-002',
  items: [...],
  express: true  // priority: 2
});
```

### SaaS Analytics Example
```javascript
const analyticsQueue = new Queue('analytics', { connection });

async function trackEvent(eventData) {
  // User action = high priority
  // Batch import = low priority
  
  let priority = 8;  // Default
  
  if (eventData.source === 'user-action') {
    priority = 3;  // High priority
  } else if (eventData.source === 'bulk-import') {
    priority = 10;  // Low priority
  }
  
  return await analyticsQueue.add(eventData, { priority });
}
```

### Support Ticketing System
```javascript
const ticketQueue = new Queue('tickets', { connection });

async function createTicket(ticketData) {
  // VIP customer = priority 2
  // Regular customer = priority 5
  // Bulk = priority 9
  
  let priority = 5;
  let timeout = 60000;  // 1 minute
  
  if (ticketData.customerTier === 'vip') {
    priority = 2;
    timeout = 30000;  // 30 seconds response
  } else if (ticketData.tier === 'bulk') {
    priority = 9;
    timeout = 300000;  // 5 minutes
  }
  
  return await ticketQueue.add(ticketData, {
    priority,
    timeout,
    attempts: 3
  });
}
```

## Monitoring Priority Distribution

```javascript
async function getPriorityMetrics(queue) {
  const allJobs = await queue.getWaiting(0, 10000);
  
  const distribution = {
    critical: 0,
    high: 0,
    normal: 0,
    low: 0,
    bulk: 0
  };
  
  for (const job of allJobs) {
    const p = job.opts.priority;
    if (p <= 2) distribution.critical++;
    else if (p <= 4) distribution.high++;
    else if (p <= 6) distribution.normal++;
    else if (p <= 8) distribution.low++;
    else distribution.bulk++;
  }
  
  return distribution;
}

// Monitor
setInterval(async () => {
  const metrics = await getPriorityMetrics(queue);
  console.table(metrics);
}, 60000);
```

## Starvation Prevention

High-priority jobs might cause low-priority jobs to never run. Prevent starvation:

```javascript
// Process mostly high-priority, but guarantee low-priority runs
let processCount = 0;

const worker = new Worker('tasks', async (job) => {
  return await handler(job);
}, { connection, concurrency: 5 });

// Override job selection to allow low-priority through occasionally
worker.on('drained', async () => {
  // When queue is empty, process some low-priority jobs
  processCount++;
  if (processCount % 20 === 0) {
    // Every 20 jobs, process a low-priority
    const lowPriority = await queue.getWaiting(0, 100);
    const lowJobs = lowPriority.filter(j => j.opts.priority > 8);
    if (lowJobs.length > 0) {
      // Temporarily boost priority
      await lowJobs[0].update({ priority: 1 });
    }
  }
});
```

## Dynamic Priority

Adjust priority based on:

```javascript
async function calculateDynamicPriority(job) {
  let priority = 5;  // Default
  
  // Boost if waiting long
  const waitTime = Date.now() - job.timestamp;
  if (waitTime > 60000) priority -= 2;  // In queue >1min
  if (waitTime > 600000) priority = 1;  // In queue >10min (make critical)
  
  // User importance
  if (job.data.userId === 'vip-user') priority -= 2;
  
  // Retry count
  if (job.attemptsMade > 0) priority -= 1;  // Retries get boost
  
  // Cap between 1 and 10
  return Math.max(1, Math.min(10, priority));
}

// Apply dynamic priority
setInterval(async () => {
  const waiting = await queue.getWaiting(0, 1000);
  
  for (const job of waiting) {
    const newPriority = await calculateDynamicPriority(job);
    if (newPriority !== job.opts.priority) {
      await job.update({ priority: newPriority });
    }
  }
}, 30000);  // Recalculate every 30 seconds
```

## Best Practices

1. **Use 1-10 scale** - Easy to understand and configure
2. **Document priorities** - Team should understand scale
3. **Separate critical path** - Different queues for critical work
4. **Prevent starvation** - Guarantee low-priority jobs run
5. **Monitor distribution** - Check queue composition
6. **Adjust dynamically** - Boost old jobs
7. **Timeout based on priority** - Critical = short timeout
8. **Retries based on priority** - Critical = more retries

---

**Pro Tip**: Use multiple queues instead of priority within one queue for better control

