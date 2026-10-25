# Module 02: Email Queuing & Async Retry (Redis/Bull)

## Overview

This module demonstrates production-grade email queuing with:
- **Queue-based sending** - Add jobs instantly, process asynchronously
- **Exponential backoff retries** - Auto-retry with intelligent delays
- **Dead Letter Queues** - Persist failed jobs for manual recovery
- **Bounce handling** - Track hard bounces, soft bounces, and complaints
- **Priority queuing** - Send critical emails first
- **Comprehensive monitoring** - Track queue health and metrics

Key features:
- Configurable retry strategies (exponential, linear, fixed)
- Automatic bounce detection and suppression
- Job status tracking with detailed history
- Dead letter queue management
- Priority-based processing
- Rate limiting and concurrent worker management
- Full audit logging

---

## Quick Start

### 1. Install Dependencies
```bash
npm install
```

### 2. Configure Environment
```bash
cp .env.example .env
```

### 3. For Local Development (No Redis Needed)

The module uses in-memory storage by default. Edit `.env`:
```env
HTTP_PORT=4002
NODE_ENV=development
QUEUE_PROVIDER=memory
EMAIL_PROVIDER=nodemailer
SMTP_HOST=localhost
SMTP_PORT=1025
FROM_EMAIL=noreply@app.local
```

###4. Start Local Mail Server (Optional)
```bash
npm install -g maildev
maildev
# Runs on http://localhost:1080
```

### 5. Start Server
```bash
npm run dev
```

Server runs on `http://localhost:4002`

---

## API Endpoints

### Queue Management

#### Add Email to Queue
```bash
POST /api/queue/add
Content-Type: application/json

{
  "recipientEmail": "user@example.com",
  "subject": "Welcome to MyApp",
  "body": "<h1>Welcome!</h1>",
  "template": "welcome",
  "priority": 5,
  "maxAttempts": 5,
  "backoffStrategy": "exponential",
  "metadata": { "userId": 123 }
}
```

#### Process Queue (Send Emails)
```bash
POST /api/queue/process
Content-Type: application/json

{
  "maxJobs": 10
}
```

#### Get Job Status
```bash
GET /api/queue/job/1
```

#### Get All Jobs
```bash
GET /api/queue/jobs?status=queued&limit=50
```

#### Get Queue Statistics
```bash
GET /api/queue/stats
```

#### Retry Failed Jobs
```bash
POST /api/queue/retry-failed
```

### Dead Letter Queue

#### Get DLQ Items
```bash
GET /api/dlq/items
```

#### Retry from DLQ
```bash
POST /api/dlq/retry/1
```

### Bounce Handling

#### Handle Bounce Webhook
```bash
POST /api/bounces/webhook
```

#### Get Bounce Log
```bash
GET /api/bounces/log
```

---

## Architecture

- **Queue-based processing**: Async, scalable, reliable
- **Exponential backoff**: Smart retry with delays
- **Dead Letter Queue**: Failure tracking and recovery
- **Bounce handling**: Automatic bounce reporting
- **Monitoring**: Queue metrics and health

---

## Testing

Use React UI at http://localhost:3000 or curl to test endpoints.

---

## Summary

This module teaches async email queue management for production systems.

## Common Mistakes & Solutions

### 1. ❌ Sending Emails Synchronously in Request Handlers

**Mistake:**
```javascript
// BAD - User waits for email sending
app.post('/register', async (req, res) => {
  const user = createUser(req.body);
  await sendEmail(user.email, 'Welcome!');  // Blocks request!
  res.json({ success: true });  // Slow response (500ms-5s)
});
```

**Problem:** User experiences slow response times. If SMTP server is down, entire request fails.

**Solution:**
```javascript
// GOOD - Queue immediately, process async
app.post('/register', async (req, res) => {
  const user = createUser(req.body);
  queue.add('send-email', { email: user.email });  // Fast enqueue
  res.json({ success: true });  // Fast response (5ms)
  // Email sent in background with auto-retries
});
```

**Key Learning:** Never make users wait for I/O operations. Queue them instead.

---

### 2. ❌ No Retry Logic for Failed Emails

**Mistake:**
```javascript
// BAD - Single attempt, no retry
transporter.sendMail(options, (err) => {
  if (err) {
    console.log('Failed, oh well');  // Email lost forever!
    return;
  }
  email.status = 'sent';
});
```

**Problem:** Network glitches, temporary SMTP outages, rate limits = lost emails. No accountability.

**Solution:**
```javascript
// GOOD - Exponential backoff retry
if (sendFailed) {
  job.attempts++;
  if (job.attempts < job.maxAttempts) {
    const delay = 5000 * Math.pow(2, job.attempts - 1);  // 5s, 10s, 20s...
    scheduleRetry(job, delay);
  } else {
    moveToDLQ(job);  // Max retries exceeded, save for manual review
  }
}
```

**Key Learning:** Always implement exponential backoff. Retrying immediately on failure wastes resources.

---

### 3. ❌ Ignoring Bounce Callbacks

**Mistake:**
```javascript
// BAD - Queue keeps sending to invalid emails
// Email bounces but nothing happens
// Keep queuing to same bounced address
```

**Problem:** Waste resources. Damage sender reputation. ISPs block your servers.

**Solution:**
```javascript
// GOOD - Integrate bounce webhook
app.post('/api/bounces/webhook', (req, res) => {
  const { email, bounceType } = req.body;
  
  if (bounceType === 'hard_bounce') {
    // Hard bounce = permanently invalid
    blockEmail(email);  // Never send to this again
    moveRelatedJobsToDLQ(email);
  } else if (bounceType === 'soft_bounce') {
    // Soft bounce = temporary issue (mailbox full)
    // Retry is OK
  }
});
```

**Key Learning:** Track bounces and adjust behavior. Hard bounces = block forever.

---

### 4. ❌ No Retry Strategy for Different Failure Types

**Mistake:**
```javascript
// BAD - Same retry logic for all errors
if (emailFailed) {
  retry();  // Retry immediately regardless of reason
}

// Problems:
// - Rate limit errors: Retrying in seconds = more rate limits
// - Invalid email: Retrying forever = waste
// - Server down: Exponential backoff needed
```

**Solution:**
```javascript
// GOOD - Different strategies per error
if (error.code === 'RATE_LIMIT') {
  // Wait longer - ISP is throttling
  scheduleRetry(job, 60000);  // Wait 1 minute
} else if (error.code === 'INVALID_EMAIL') {
  // Don't retry - hard bounce
  moveToDLQ(job);
} else if (error.code === 'TIMEOUT') {
  // Server issue - exponential backoff
  scheduleRetry(job, 5000 * Math.pow(2, attempts));
}
```

**Key Learning:** Error handling must be intelligent and provider-specific.

---

### 5. ❌ Processing Queue Too Aggressively

**Mistake:**
```javascript
// BAD - Process every single job immediately
startProcessing() {
  setInterval(() => {
    processQueue();  // Every 100ms = database suicide
  }, 100);
}
```

**Problem:** Overload email provider. Get rate limited. Waste CPU. Burn through API quotas.

**Solution:**
```javascript
// GOOD - Batched processing with rate limiting
processQueue() {
  const batchSize = 50;  // Process 50 at a time
  const jobs = getQueuedJobs(batchSize);
  
  for (const job of jobs) {
    // Add delay between sends
    setTimeout(() => sendEmail(job), delayMs);
  }
}

// Run periodically, not constantly
setInterval(processQueue, 5000);  // Every 5 seconds
```

**Key Learning:** Honor email provider rate limits. Batch processing saves resources.

---

### 6. ❌ Not Monitoring Queue Health

**Mistake:**
```javascript
// BAD - No visibility into queue
// Jobs pile up silently
// Dead letter queue grows without notice
// No indication of problems until users complain
```

**Problem:** Unaware of issues. Can't proactively debug. Users get blamed for slow emails.

**Solution:**
```javascript
// GOOD - Monitor and alert
setInterval(() => {
  const stats = {
    queued: getCount('queued'),
    processing: getCount('processing'),
    sent: getCount('sent'),
    failed: getCount('failed'),
    dlq: getDLQCount()
  };
  
  if (stats.queued > 1000) {
    alert('Queue backed up - slow processing!');
  }
  
  if (stats.dlq > 100) {
    alert('Too many dead letters - investigate!');
  }
  
  logMetrics(stats);  // Track trends
}, 60000);
```

**Key Learning:** Monitoring is as important as the code. Know when things go wrong.

---

### 7. ❌ No Dead Letter Queue

**Mistake:**
```javascript
// BAD - Delete failed jobs
if (attemptsExceeded) {
  deleteJob();  // LOST FOREVER - no audit trail
}
```

**Problem:** Can't know what failed. Can't recover later. No compliance trail.

**Solution:**
```javascript
// GOOD - Move to Dead Letter Queue
if (attemptsExceeded) {
  moveToDLQ(job, 'Max attempts exceeded');
  // Can view, analyze, and manually retry later
}

// Later: Manual review and recovery
GET /api/dlq/items
POST /api/dlq/retry/1  // Try again with fresh config
```

**Key Learning:** DLQ is your safety net. Never delete without recovery mechanism.

---

### 8. ❌ Not Testing Failure Scenarios

**Mistake:**
```javascript
// Only test the happy path
// Never simulate network failures
// Never test rate limiting
// Never test invalid emails
```

**Problem:** Failures happen in production but you've never tested your retry logic!

**Solution:**
```javascript
// Test all scenarios
test('retry on TIMEOUT error', async () => {
  mockSMTP.simulateTimeout();
  await processQueue();
  assert(job.status === 'failed');
  assert(job.attempts === 1);
  assert(job.nextRetry !== null);
});

test('move to DLQ after max attempts', async () => {
  for (let i = 0; i < 5; i++) {
    mockSMTP.simulateFail();
    await retry(job);
  }
  assert(job.status === 'deadletter');
  assert(getDLQSize() === 1);
});

test('exponential backoff delays', async () => {
  // 1st retry: 5s
  // 2nd retry: 10s  
  // 3rd retry: 20s
  const delays = [];
  for (let i = 1; i <= 3; i++) {
    const delay = calculateNextRetry(i, 5000, 'exponential');
    delays.push(delay);
  }
  assert(delays[1] > delays[0]);  // Each is longer
  assert(delays[2] > delays[1]);
});
```

**Key Learning:** Test failures more than successes. That's where bugs hide.

---

### 9. ❌ Mixing Queue Processing with Request Handling

**Mistake:**
```javascript
// BAD - Process queue in request context
app.post('/trigger', (req, res) => {
  processQueue();  // Blocks response
  res.json({ ok: true });
});
```

**Problem:** One slow email blocks all other requests. User gets poor UX.

**Solution:**
```javascript
// GOOD - Separate concerns
// Queue handler - fast
app.post('/api/queue/add', (req, res) => {
  queue.add(data);
  res.json({ jobId: 1 });  // Instant response
});

// Separate worker process
setInterval(() => {
  processQueue();  // Run independently
}, 5000);
```

**Key Learning:** Queueing ≠ Processing. Separate them completely.

---

### 10. ❌ Not Implementing Priority Levels

**Mistake:**
```javascript
// BAD - Process in received order (FIFO)
// Password reset queued 3 hours ago
// Newsletter queued 2 hours ago
// Both sent in same order - PWD reset delayed!
```

**Solution:**
```javascript
// GOOD - Priority-based processing
queue.add('password-reset', data, { priority: 10 });  // High
queue.add('newsletter', data, { priority: 1 });       // Low

processQueue() {
  const jobs = getQueuedJobs().sort((a, b) => b.priority - a.priority);
  // Process password resets before newsletters
}
```

**Key Learning:** Email importance varies. Priority queues ensure critical emails go first.

---

## Learning Outcomes

After completing this module, you should understand:

✅ Why synchronous email sending is bad  
✅ How queue-based processing scales  
✅ Exponential backoff retry strategies  
✅ Dead letter queue patterns  
✅ Bounce handling and reputation management  
✅ Queue monitoring and alerts  
✅ Priority-based job processing  
✅ Error handling for different failure types  
✅ Testing failure scenarios  

---

## Next Steps

1. **Complete all checklist items** in checklist.md
2. **Run manual tests** with cURL or React UI
3. **Deliberately break things** - test your retry logic
4. **Study theory.md** for deep architectural understanding
5. **Move to Module 03** - Push Notifications (Firebase Cloud Messaging)

---

## Files Structure

```
02-email-queuing-async-retry-bounce/
├── server.js           # Express server + routes
├── controller.js       # Queue & bounce handlers
├── middleware.js       # Auth, validation, rate limiting
├── routes.js           # API endpoint definitions
├── schema.js           # In-memory database schema
├── App.jsx             # React testing UI
├── App.css             # UI styles
├── theory.md           # Deep dive into concepts
├── README.md           # This file
├── setup.md            # Installation guide
├── package.json        # Dependencies
├── .env.example        # Environment template
└── checklist.md        # Testing checklist
```

---

## Support

- 📖 **Documentation**: See setup.md and theory.md
- 🧪 **Testing**: Use React UI at http://localhost:3000
- 🐛 **Debugging**: Check server logs and /api/queue/stats
- ❓ **Questions**: Review theory.md section and code comments

