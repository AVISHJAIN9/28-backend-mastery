# Theory: Email Queuing, Async Processing, Retries & Bounce Handling

## Table of Contents
1. [Core Concepts](#core-concepts)
2. [Queue Architecture](#queue-architecture)
3. [Retry Strategies](#retry-strategies)
4. [Dead Letter Queues](#dead-letter-queues)
5. [Bounce Handling](#bounce-handling)
6. [Production Patterns](#production-patterns)
7. [Monitoring & Observability](#monitoring--observability)
8. [Real-world Examples](#real-world-examples)
9. [Performance Tuning](#performance-tuning)
10. [Common Issues & Solutions](#common-issues--solutions)

---

## Core Concepts

### Why Queue-Based Email?

Sending emails directly (synchronously) in request handlers is problematic:

1. **Performance**: Network I/O blocks the request. A user must wait 500ms-5s for email to send.
2. **Reliability**: If the email service is down, the entire request fails.
3. **Scalability**: Can't handle traffic spikes - would need to add infinite worker threads.
4. **No Retries**: Single failure = email never sent.

**Example of Bad Pattern:**
```javascript
app.post('/register', async (req, res) => {
  const user = createUser(req.body);
  
  // ❌ User waits for email to send
  await sendEmail(user.email, 'Welcome!');
  
  res.json({ success: true }); // Slow response!
});
```

**Queue-Based Solution:**
```javascript
app.post('/register', async (req, res) => {
  const user = createUser(req.body);
  
  // ✓ Add to queue immediately
  queue.add('send-email', { email: user.email, template: 'welcome' });
  
  res.json({ success: true }); // Fast response!
  
  // Email will be sent in background with automatic retries
});
```

### Queue Systems Overview

A **message queue** is a system for asynchronous communication:

```
┌─────────────┐
│   Producer  │ (Your API server)
│  task.add() │
└──────┬──────┘
       │
       ▼
┌─────────────────┐
│  Queue/Broker   │ (Redis, RabbitMQ, Bull)
│  [job1][job2]   │ Persistent storage
│  [job3][job4]   │
└──────┬──────────┘
       │
       ▼
┌─────────────┐
│  Consumer   │ (Workers)
│  process()  │
└─────────────┘
```

### Key Terminology

| Term | Definition | Example |
|------|-----------|---------|
| **Message/Job** | Unit of work to process | `{ email: 'user@example.com', template: 'welcome' }` |
| **Queue** | Storage container for jobs | Email queue, SMS queue |
| **Producer** | Creates jobs | User registration endpoint |
| **Consumer/Worker** | Processes jobs | Background worker process |
| **Broker** | Manages queue | Redis, RabbitMQ, Bull |
| **Priority** | Job urgency (1-10) | Payment emails = 10, newsletters = 1 |
| **Backoff** | Delay before retry | Exponential: 1s → 2s → 4s → 8s |
| **Dead Letter Queue** | Failed jobs repository | Email that failed 5 times |
| **Bounce** | Delivery failure | Hard: invalid email, Soft: mailbox full |

---

## Queue Architecture

### Architecture Components

```
┌─────────────────────────────────────────────────────┐
│                  Application Layer                   │
├─────────────────────────────────────────────────────┤
│  Route Handler → Validation → Queue.add()            │
│  (Add job instantly, return to user)                │
└────────────────────┬────────────────────────────────┘
                     │
                     ▼
┌─────────────────────────────────────────────────────┐
│                   Queue Storage                      │
├─────────────────────────────────────────────────────┤
│  [Pending] [Processing] [Completed] [Failed]        │
│  Using: Redis, Database, Message Broker             │
└────────────────────┬────────────────────────────────┘
                     │
        ┌────────────┴────────────┐
        ▼                         ▼
   ┌─────────────┐          ┌──────────────┐
   │   Worker 1  │          │   Worker N   │
   │ Processing  │   ...    │ Processing   │
   └─────────────┘          └──────────────┘
        │                         │
        └────────────┬────────────┘
                     ▼
          ┌───────────────────────┐
          │   Monitoring/Logging   │
          │   Metrics & Alerting   │
          └───────────────────────┘
```

### Queue States

Each job transitions through states:

```
QUEUED
  │
  ├→ delayed (if retry/schedule)
  │
  ▼
PROCESSING
  │
  ├→ SUCCESS → SENT
  │
  └→ FAILURE
      │
      ├→ Attempt < MaxAttempts
      │   └→ FAILED (will retry)
      │
      └→ Attempt >= MaxAttempts
          └→ DEADLETTER (manual intervention needed)
```

### State Definitions

- **QUEUED**: Waiting for processing
- **DELAYED**: Waiting for retry delay to elapse
- **PROCESSING**: Currently being sent by a worker
- **SENT**: Successfully delivered
- **FAILED**: Attempt failed, will retry
- **DEADLETTER**: Max retries exceeded, requires manual action
- **BOUNCED**: Provider reported delivery failure

---

## Retry Strategies

### 1. Exponential Backoff (Recommended)

Doubles delay each attempt. Perfect for transient failures (network hiccup, server overload).

**Formula:** `delay = baseDelay * (2 ^ (attempt - 1))`

**Example:**
```
Attempt 1: immediate
Attempt 2: 5s later
Attempt 3: 10s later (5 * 2)
Attempt 4: 20s later (5 * 4)
Attempt 5: 40s later (5 * 8)
Attempt 6: 80s later (5 * 16)
```

**When to use:**
- Temporary network issues
- Provider service recovery
- Load-based failures

**Code:**
```javascript
const calculateExponentialBackoff = (attempt, baseDelay, maxDelay) => {
  const delay = baseDelay * Math.pow(2, attempt - 1);
  return Math.min(delay, maxDelay); // Cap at maxDelay
};

// Example
const delay1 = calculateExponentialBackoff(1, 1000, 3600000); // 1000ms
const delay2 = calculateExponentialBackoff(2, 1000, 3600000); // 2000ms
const delay3 = calculateExponentialBackoff(3, 1000, 3600000); // 4000ms
```

### 2. Linear Backoff

Increases delay linearly. Good for rate-limit scenarios.

**Formula:** `delay = baseDelay * attempt`

**Example:**
```
Attempt 1: immediate
Attempt 2: 5s
Attempt 3: 10s
Attempt 4: 15s
Attempt 5: 20s
```

**When to use:**
- Rate-limit recovery
- API quota exhaustion
- Controlled backoff needed

### 3. Fixed Delay

Same delay each time. Simple, predictable.

**Formula:** `delay = baseDelay`

**Example:**
```
Attempt 1: immediate
Attempt 2: 5s
Attempt 3: 5s
Attempt 4: 5s
Attempt 5: 5s
```

**When to use:**
- Quick retries for temporary blips
- Batch processing
- Low-priority messages

### Jitter (Thundering Herd Prevention)

When multiple workers retry simultaneously, they can overwhelm the server. Add randomness:

```javascript
const jitter = () => Math.random() * 1000; // ±1s

const calculateBackoffWithJitter = (attempt, baseDelay, maxDelay) => {
  const exponential = baseDelay * Math.pow(2, attempt - 1);
  const withJitter = exponential + jitter();
  return Math.min(withJitter, maxDelay);
};
```

### Retry Configuration Matrix

| Scenario | Max Attempts | Backoff | Base Delay | Max Delay | Use Case |
|----------|-------------|---------|------------|-----------|----------|
| Critical (Payment) | 10 | Exponential | 1s | 1h | Order confirmations |
| Standard | 5 | Exponential | 5s | 10m | Welcome emails |
| Batch | 3 | Linear | 1m | 10m | Newsletters |
| SMS | 6 | Exponential | 3s | 30m | OTP codes |
| Webhooks | 5 | Exponential | 2s | 30m | External notifications |

---

## Dead Letter Queues

### Concept

A **Dead Letter Queue (DLQ)** is where jobs go when they can't be delivered after exhausting all retries.

Instead of losing the job, it's stored for inspection and manual recovery.

**Why needed:**
- Hard bounces (invalid email: `user@invalid-domain.abc`)
- Provider rejections (blacklisted domain)
- Invalid data (malformed email address)
- Permanent failures (after exponential backoff)

### DLQ Architecture

```
Queue Processing Flow:
├── Attempt 1 → FAILED (soft error, retry)
├── Attempt 2 → FAILED (delay 5s)
├── Attempt 3 → FAILED (delay 10s)
├── Attempt 4 → FAILED (delay 20s)
├── Attempt 5 → FAILED (final attempt)
│
└── Max attempts exceeded → Move to DLQ
    (Store for manual review/recovery)
```

### DLQ Entry Structure

```javascript
{
  id: 1,
  originalJobId: 42,
  recipientEmail: 'invalid@example.nonexistent',
  subject: 'Welcome Email',
  reason: 'hard_bounce',
  remainingData: {
    template: 'welcome',
    metadata: { userId: 123 }
  },
  movedAt: '2024-01-15T10:30:00Z',
  manuallyRetried: false,
  manualRetryAt: null
}
```

### DLQ Operations

#### 1. Inspect DLQ Items
```bash
GET /api/dlq/items
```
**Response:**
```json
{
  "count": 3,
  "items": [
    {
      "id": 1,
      "recipientEmail": "bounce@example.com",
      "reason": "hard_bounce",
      "movedAt": "2024-01-15T10:30:00Z"
    }
  ]
}
```

#### 2. Retry Failed Job
```bash
POST /api/dlq/retry/1
```

This moves the job back to the queue with fresh retry counts.

#### 3. DLQ Monitoring

Set up alerts for items stuck in DLQ:

```javascript
const getDLQHealth = () => {
  const dlqItems = getDLQItems();
  const oldestItem = dlqItems[0];
  const ageHours = (Date.now() - new Date(oldestItem.movedAt)) / (1000 * 60 * 60);
  
  if (ageHours > 24) {
    alert('Items stuck in DLQ for >24h');
  }
};
```

### DLQ Processing Strategies

**Strategy 1: Manual Review**
- Dev team reviews DLQ daily
- Determines if email address is correctable
- Retries with corrected data

**Strategy 2: Segmentation by Reason**
```javascript
const dlqReasons = {
  invalid_email: items.filter(i => i.reason === 'invalid_email'),
  hard_bounce: items.filter(i => i.reason === 'hard_bounce'),
  provider_reject: items.filter(i => i.reason === 'provider_reject'),
  timeout: items.filter(i => i.reason === 'timeout')
};

// Retry timeouts automatically, escalate others
dlqReasons.timeout.forEach(item => retryFromDLQ(item.id));
```

**Strategy 3: Time-based Cleanup**
```javascript
const cleanupOldDLQ = (olderThanDays = 30) => {
  const cutoff = new Date(Date.now() - (olderThanDays * 24 * 60 * 60 * 1000));
  getDLQItems().forEach(item => {
    if (new Date(item.movedAt) < cutoff) {
      archiveOrDelete(item);
    }
  });
};
```

---

## Bounce Handling

### Bounce Types

Email providers send bounce notifications when delivery fails:

#### Hard Bounces (Permanent)

**Cause:** Email address doesn't exist or domain invalid

**Examples:**
- `user@invalid-domain.abc` - Invalid domain TLD
- `user+123@company.com` - Disabled account
- `misspelled@cmpany.com` - Typo in company domain

**Action:** Never retry, remove from mailing list, move to DLQ

**Code:**
```javascript
const handleHardBounce = (email, jobId) => {
  // 1. Move job to DLQ
  moveToDLQ(jobId, `Hard bounce: ${email}`);
  
  // 2. Suppress future sends to this email
  addToSuppression List(email);
  
  // 3. Alert if VIP user
  const user = getUserByEmail(email);
  if (user.isVIP) {
    notifyAbusingTeam(email);
  }
};
```

#### Soft Bounces (Temporary)

**Cause:** Mailbox full, server temporarily down, rate limits

**Examples:**
- `user@company.com` - Mailbox quota exceeded (451 error)
- Receiving server not responding (timeout)
- Rate limit on provider

**Action:** Retry with backoff, eventually give up

**Code:**
```javascript
const handleSoftBounce = async (email, jobId, reason) => {
  const job = getQueueJob(jobId);
  
  if (job.attempts < job.maxAttempts) {
    // Retry with longer backoff (server is recovering)
    const nextRetry = calculateNextRetry(
      job.attempts + 1,
      30000, // 30s base (longer than normal)
      'exponential'
    );
    
    updateQueueJob(jobId, {
      status: 'failed',
      nextRetry,
      failureReason: `Soft bounce: ${reason}`
    });
  } else {
    // Too many attempts, move to DLQ
    moveToDLQ(jobId, `Soft bounce max retries exceeded`);
  }
};
```

#### Complaints

**Cause:** User marked email as spam

**Examples:**
- User hit "Report Spam" button
- Email content triggers spam filters

**Action:** Unsubscribe user, move to DLQ, investigate content

**Code:**
```javascript
const handleComplaint = (email, jobId) => {
  moveToDLQ(jobId, 'Complaint filed');
  
  // Unsubscribe user
  const user = getUserByEmail(email);
  if (user) {
    updateUser(user.id, {
      unsubscribed: true,
      unsubscribedReason: 'spam_complaint',
      unsubscribedAt: new Date()
    });
  }
  
  // Analyze email content
  logger.warn('Complaint received', { email, templateUsed: job.template });
};
```

### Bounce Webhook Handler

Email providers (SendGrid, SES, Mailgun) send webhooks when bounces occur:

```javascript
// Example SendGrid webhook payload
{
  "event": "bounce",
  "email": "user@example.com",
  "bounce_type": "hard",
  "bounce_subtype": "permanent",
  "timestamp": "2024-01-15T10:30:00Z",
  "job_id": 42,
  "reason": "Your email was rejected by the recipient's mail server"
}
```

**Handler Implementation:**
```javascript
const handleBounceWebhook = async (req, res) => {
  const { email, event, bounce_type, bounce_subtype, job_id } = req.body;
  
  // Verify webhook signature (security)
  if (!verifyWebhookSignature(req)) {
    return res.status(401).json({ error: 'Invalid signature' });
  }
  
  // Log bounce
  const bounce = createBounceLog({
    jobId: job_id,
    email,
    bounceType: bounce_type,
    bounceSubType: bounce_subtype
  });
  
  // Handle based on type
  if (bounce_type === 'hard') {
    handleHardBounce(email, job_id);
  } else if (bounce_type === 'soft') {
    handleSoftBounce(email, job_id, bounce_subtype);
  } else if (event === 'complaint') {
    handleComplaint(email, job_id);
  }
  
  res.json({ success: true });
};
```

### Bounce Suppression List

Maintain a suppression list to avoid sending to known bad addresses:

```javascript
const suppressionList = new Set();

const shouldSendTo = (email) => {
  return !suppressionList.has(email);
};

const addToSuppressionList = (email, reason) => {
  suppressionList.add(email);
  logger.info('Email suppressed', { email, reason });
};

// When creating a job:
if (!shouldSendTo(recipientEmail)) {
  return res.status(400).json({
    error: 'Email is on suppression list',
    reason: 'Previously bounced (hard bounce) or complained'
  });
}
```

---

## Production Patterns

### Pattern 1: Persistent Queue (Redis + Bull)

In production, use Redis for durability:

```javascript
const Queue = require('bull');
const redis = require('redis');

const emailQueue = new Queue('email', {
  redis: {
    host: process.env.REDIS_HOST,
    port: process.env.REDIS_PORT
  },
  defaultJobOptions: {
    attempts: 5,
    backoff: {
      type: 'exponential',
      delay: 5000
    },
    removeOnComplete: true,
    removeOnFail: {
      age: 3600 * 24 * 7 // Keep failed jobs for 7 days for analysis
    }
  }
});

// Add job
emailQueue.add(
  { email: 'user@example.com', template: 'welcome' },
  { priority: 5 }
);

// Process jobs
emailQueue.process(async (job) => {
  await sendEmail(job.data);
});

// Listen to events
emailQueue.on('failed', (job, err) => {
  if (job.attemptsMade >= job.opts.attempts) {
    moveToDLQ(job.id, err.message);
  }
});
```

### Pattern 2: Job Timeout Handling

Set timeouts to prevent hung workers:

```javascript
emailQueue.process({
  concurrency: 10, // Process up to 10 emails concurrently
  maxStalledCount: 2 // Retry if worker crashes
}, async (job) => {
  return new Promise((resolve, reject) => {
    // Timeout after 30s
    const timeout = setTimeout(() => {
      reject(new Error('Email sending timeout'));
    }, 30000);
    
    sendEmail(job.data)
      .then(result => {
        clearTimeout(timeout);
        resolve(result);
      })
      .catch(err => {
        clearTimeout(timeout);
        reject(err);
      });
  });
});
```

### Pattern 3: Priority Queuing

Send critical emails first:

```javascript
// Add jobs with priorities
emailQueue.add(
  { email: 'vip@company.com', template: 'payment-receipt' },
  { priority: 10 } // High priority
);

emailQueue.add(
  { email: 'user@example.com', template: 'newsletter' },
  { priority: 1 } // Low priority
);

// Bull processes high-priority jobs first
```

### Pattern 4: Scheduled/Delayed Emails

Send emails at specific times:

```javascript
// Send email in 2 hours
emailQueue.add(
  { email: 'user@example.com', template: 'reminder' },
  { delay: 2 * 60 * 60 * 1000 } // 2 hours in ms
);

// Send email at specific time
const deliveryTime = new Date('2024-01-20T15:00:00Z');
const delay = deliveryTime - Date.now();
emailQueue.add(
  { email: 'user@example.com', template: 'birthday' },
  { delay }
);
```

### Pattern 5: Batch Processing

Process multiple emails efficiently:

```javascript
const emailsToSend = [
  { email: 'user1@example.com', template: 'welcome' },
  { email: 'user2@example.com', template: 'welcome' },
  // ... 1000 more
];

// Add all at once
const jobs = await emailQueue.addBulk(
  emailsToSend.map(data => ({
    data,
    opts: { priority: 5 }
  }))
);

console.log(`Added ${jobs.length} jobs to queue`);
```

---

## Monitoring & Observability

### Key Metrics

**Queue Health Metrics:**
- Total jobs queued
- Jobs processing
- Success rate (%)
- Failure rate (%)
- Average processing time
- DLQ size
- Bounce rate

**Infrastructure Metrics:**
- Redis memory usage
- Worker CPU/memory
- Queue latency (time from add to process)
- Worker uptime

**Business Metrics:**
- Delivery latency (time from action to email received)
- Hard bounce count
- Soft bounce count
- Complaint count
- Sent success count

### Monitoring Implementation

```javascript
const getQueueMetrics = async () => {
  const [queued, processing, completed, failed] = await Promise.all([
    emailQueue.getJobCounts('queued'),
    emailQueue.getJobCounts('processing'),
    emailQueue.getJobCounts('completed'),
    emailQueue.getJobCounts('failed')
  ]);
  
  return {
    timestamp: new Date(),
    queue: {
      pending: queued,
      processing,
      completed,
      failed
    },
    rates: {
      successRate: (completed / (completed + failed)) * 100,
      failureRate: (failed / (completed + failed)) * 100
    },
    dlq: {
      items: getDLQItems().length,
      oldestItemAge: getOldestDLQItem()?.age || 0
    },
    bounces: {
      hardBounces: getBounceLog().filter(b => b.bounceType === 'hard_bounce').length,
      softBounces: getBounceLog().filter(b => b.bounceType === 'soft_bounce').length,
      complaints: getBounceLog().filter(b => b.bounceType === 'complaint').length
    }
  };
};

// Log metrics every minute
setInterval(async () => {
  const metrics = await getQueueMetrics();
  logger.info('Queue metrics', metrics);
  
  // Alert if failure rate > 10%
  if (metrics.rates.failureRate > 10) {
    alertOps('High email failure rate', metrics);
  }
  
  // Alert if DLQ growing
  if (metrics.dlq.items > 100) {
    alertOps('DLQ overflow', { items: metrics.dlq.items });
  }
}, 60000);
```

### Health Check Endpoint

```javascript
app.get('/health/queue', async (req, res) => {
  try {
    const stats = await getQueueMetrics();
    const isPoisoned = stats.rates.failureRate > 20 || stats.dlq.items > 500;
    
    res.status(isPoisoned ? 503 : 200).json({
      status: isPoisoned ? 'degraded' : 'healthy',
      queue: stats.queue,
      dlq: stats.dlq,
      bounces: stats.bounces
    });
  } catch (error) {
    res.status(503).json({ status: 'error', message: error.message });
  }
});
```

---

## Real-world Examples

### Example 1: E-commerce Order Confirmation

**Scenario:** User places order, needs email receipt immediately, but sending shouldn't block checkout

```javascript
// Route handler
app.post('/api/orders', async (req, res) => {
  const order = createOrder(req.body); // Save order
  
  // Add to queue with highest priority
  emailQueue.add(
    {
      email: order.customerEmail,
      template: 'order-confirmation',
      variables: {
        orderId: order.id,
        amount: order.total,
        estimatedDelivery: order.estimatedDelivery
      }
    },
    {
      priority: 10,
      attempts: 5,
      backoff: { type: 'exponential', delay: 1000 }
    }
  ).catch(queueError => {
    logger.error('Failed to queue order email', { orderId: order.id, queueError });
    // Still consider order successful even if email queuing fails
  });
  
  res.status(201).json({ success: true, orderId: order.id });
});

// Worker
emailQueue.process(async (job) => {
  const { email, variables } = job.data;
  
  const receipt = generateReceipt(variables);
  await sendEmailWithAttachment(email, 'order-confirmation', {
    attachment: receipt
  });
  
  // Track email in order
  updateOrder(variables.orderId, {
    confirmationEmailSent: true,
    sentAt: new Date()
  });
});
```

### Example 2: Weekly Newsletter

**Scenario:** Send newsletter to 100k subscribers, stagger sends

```javascript
// Scheduled task (runs every Monday)
schedule.scheduleJob('0 9 * * 1', async () => {
  const subscribers = getAllActiveSubscribers();
  
  const jobs = subscribers.map(sub => ({
    data: {
      email: sub.email,
      template: 'weekly-newsletter',
      variables: { name: sub.firstName }
    },
    opts: {
      priority: 1, // Low priority
      attempts: 3,
      backoff: { type: 'linear', delay: 60000 }, // 1min, 2min, 3min
      delay: Math.random() * (8 * 60 * 60 * 1000) // Stagger over 8 hours
    }
  }));
  
  await emailQueue.addBulk(jobs);
  logger.info(`Queued ${jobs.length} newsletter emails`);
});

// With rate limiting
emailQueue.process({ concurrency: 50 }, async (job) => {
  await sendEmail(job.data.email, job.data.template, job.data.variables);
});
```

### Example 3: Transactional Alert with Fallback

**Scenario:** Security alert needs to reach user - try email, then SMS if email fails

```javascript
// Multi-channel delivery
const sendSecurityAlert = async (userId, alertData) => {
  const user = getUser(userId);
  
  // Try email first
  const emailJob = await securityAlertQueue.add(
    {
      email: user.email,
      subject: 'Security Alert',
      message: alertData.message,
      fallback: 'sms', // SMS if email fails
      phoneNumber: user.phone
    },
    {
      priority: 10, // Critical
      attempts: 5,
      backoff: { type: 'exponential', delay: 2000 }
    }
  );
  
  // Worker
  securityAlertQueue.process(async (job) => {
    try {
      await sendEmail(job.data.email, 'security-alert', job.data);
    } catch (error) {
      logger.warn('Email failed, trying SMS', { userId, error });
      
      if (job.data.fallback === 'sms') {
        // Move to SMS queue
        smsQueue.add({
          phone: job.data.phoneNumber,
          message: job.data.message
        });
      }
      throw error; // Trigger retry
    }
  });
};
```

---

## Performance Tuning

### Concurrency Configuration

```javascript
// Start with conservative settings
emailQueue.process({ concurrency: 10 }, handler);

// Monitor, then increase
emailQueue.process({ concurrency: 50 }, handler);

// Monitor Redis memory, CPU, latency
// CPU usage high? Reduce concurrency
// Latency high? Increase concurrency / add workers
```

### Redis Optimization

```javascript
// Use connection pooling
const redis = require('redis');
const client = redis.createClient({
  host: process.env.REDIS_HOST,
  port: process.env.REDIS_PORT,
  maxRetriesPerRequest: null, // For queue compatibility
  socket: {
    reconnectStrategy: (retries) => Math.min(retries * 50, 500)
  }
});

// Enable pipelining for bulk operations
const pipeline = client.multi();
jobs.forEach(job => pipeline.set(job.id, JSON.stringify(job)));
await pipeline.exec();
```

### Job Processing Optimization

```javascript
// Reuse transporter connection
const transporter = nodemailer.createTransport({...});

// Precompile templates
const templates = {};
fs.readdirSync('./templates').forEach(file => {
  templates[file.replace('.hbs', '')] = fs.readFileSync(`./templates/${file}`);
});

// Process with caching
emailQueue.process(async (job) => {
  const template = templates[job.data.template];
  // Already compiled, no file I/O
  const html = mustache.render(template, job.data.variables);
  await transporter.sendMail({ ...job.data, html });
});
```

---

## Common Issues & Solutions

| Issue | Cause | Solution |
|-------|-------|----------|
| **Jobs stuck in "processing"** | Worker crashed mid-send | Set `maxStalledCount: 2` to retry automatically |
| **High memory usage in Redis** | Queue never cleaned | Enable `removeOnComplete: true` and set `removeOnFail` age limit |
| **Duplicate emails sent** | Retries don't deduplicate | Use idempotency keys: `{ email, campaignId }` as unique constraint |
| **DLQ growing indefinitely** | No one reviews/retries | Set up daily DLQ dashboard, auto-archive old items |
| **Workers not processing** | Connection pool exhausted | Increase `maxConnections` in Redis or email provider |
| **Exponential backoff too aggressive** | Last attempt takes hours | Cap max delay: `Math.min(delay, 1 * 60 * 60 * 1000)` |
| **Thundering herd on retry** | All workers retry simultaneously | Add jitter to backoff delays |
| **Webhooks missing bounces** | Webhook handler crashed | Use dead-letter queue for webhook processing too |
| **High disk usage (MongoDB/DB)** | Storing all job history forever | Archive completed jobs older than 30 days |

---

## Summary

Email queuing is essential for reliable, scalable notification systems. Key takeaways:

1. **Always queue**: Never send email synchronously in request handlers
2. **Use exponential backoff**: For transient failures with automatic recovery
3. **Implement DLQ**: For jobs that can't be delivered, not lost
4. **Handle bounces**: Track hard bounces, suppress future sends
5. **Monitor relentlessly**: Track queue depth, success rate, DLQ size
6. **Test thoroughly**: Simulate failures, bounces, timeouts in staging
7. **Scale gradually**: Start with single worker, monitor metrics, add workers as needed

The patterns in this module form the foundation for all notification systems. Master them, and you'll build bulletproof notification infrastructure.
