#!/usr/bin/env python3
"""Update theory.md files for modules 06-15"""

BASE = "/Users/avishjain/Downloads/backend-mastery/05-realtime-communication"

THEORY_06_15 = {
    "06-message-queue-bullmq": """# Message Queue - Bull/BullMQ Theory

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
""",

    "07-broadcast-alerts": """# Broadcast Alerts - Theory

## Alert System Architecture

### Components
1. **Alert Generator** - Creates alerts (system, rules, manual)
2. **Alert Queue** - Stores pending alerts
3. **Distributor** - Routes to relevant users
4. **Persistence** - Stores alert history
5. **Client UI** - Displays alerts

### Flow
```
Trigger Event → Generate Alert
            ↓
       Queue Alert
            ↓
    Determine Recipients
            ↓
    Broadcast via Socket.io
            ↓
   Display on Clients
            ↓
   User acknowledges/dismisses
```

## Alert Channels

### System-Wide Alerts
```javascript
io.emit('alert', {
  type: 'system',
  title: 'Maintenance',
  message: 'Server maintenance 2-3am',
  severity: 'warning'
});
// Reaches: All connected users
```

### Targeted Alerts
```javascript
io.to(`user_${userId}`).emit('alert', {
  type: 'personal',
  title: 'Password expires',
  message: 'Change password within 7 days',
  severity: 'info'
});
// Reaches: Specific user
```

### Role-Based Alerts
```javascript
io.to('role:admin').emit('alert', {
  type: 'admin',
  title: 'Failed login attempt',
  message: 'From IP 192.168.1.1',
  severity: 'warning'
});
// Reaches: All users in admin role
```

## Severity Levels

### Info (Blue)
- Non-urgent information
- Feature announcements
- General updates
- Action: Auto-dismiss after 10s

### Warning (Yellow)
- Important but not critical
- Maintenance windows
- Expired credentials approaching
- Action: Requires acknowledgment

### Error (Red)
- Critical failure occurred
- Action needed
- System degraded
- Action: Requires action/fix

### Critical (Dark Red)
- Immediate action required
- System unavailable
- Security breach
- Action: Stays until resolved

## Alert Storage

### In-Memory Queue
```
Fast but lost on restart
Good for real-time notifications
```

### Persistent Storage
```
Database (MongoDB/PostgreSQL)
- Track all alerts ever created
- User acknowledgment history
- Alert analytics
- Compliance logging
```

### Redis Alerts
```
Recent alerts (last 24 hours)
Fast retrieval
Auto-expire old alerts
```

## Alert Delivery Guarantees

### Best Effort (Current)
```
Alert sent to online users
Offline users miss it
```

### At Least Once
```
Store alert
Deliver to online users
Redeliver on reconnection
Mark as read
```

### Exactly Once (Hard)
```
Track delivery per user
Guarantee single delivery
Acknowledge on client
Very complex
```

## Alert Deduplication

### Problem
Same alert sent multiple times

### Solution
```javascript
const alertId = crypto.createHash('md5')
  .update(JSON.stringify(alert))
  .digest('hex');

// Check if already sent
if (sentAlerts.has(alertId)) return;
sentAlerts.add(alertId);

// Send alert
io.emit('alert', { ...alert, id: alertId });
```

## User Preferences

### Alert Subscriptions
```
User preferences:
✅ System alerts
✅ Security alerts
❌ Marketing alerts
✅ Critical only
```

### Quiet Hours
```
Do not show alerts: 9pm - 7am
Still queue them, deliver at 7am
```

### Delivery Channels
```
- In-app notification
- Email
- SMS
- Push notification
- Slack webhook
```

## Best Practices

✅ Include action buttons
✅ Timestamp all alerts
✅ Store alert history
✅ Implement alert grouping
✅ Use appropriate severity
✅ Test alert system
✅ Monitor alert frequency
✅ Implement rate limiting
✅ Archive old alerts
✅ Allow user preferences
""",

    "08-push-notifications-fcm": """# Firebase Cloud Messaging - Theory

## FCM Architecture

### Components
1. **FCM Server** - Firebase infrastructure
2. **Device** - Runs the app with FCM SDK
3. **App Server** - Your backend
4. **Message** - Payload to send


### Message Flow
```
Your Server
   ↓
FCM API (send_message)
   ↓
FCM Servers (route to device)
   ↓
Device receives via APNs (iOS) / GCM (Android)
   ↓
App processes notification
```

## Token Management

### Device Token
```
Unique identifier for app instance
Changes if:
- User uninstalls app
- App updates (sometimes)
- User clears app data
- You explicitly refresh it

Must store latest token on server
```

### Token Refresh
```javascript
// iOS/Android SDK auto-refreshes
// Listen for changes

messaging.onTokenRefresh((token) => {
  // Send new token to server
  fetch('/api/device/token', {
    method: 'POST',
    body: JSON.stringify({ token })
  });
});
```

## Notification Payloads

### Data Message
```javascript
{
  data: {
    score: '100',
    invStatus: 'active'
  }
}

// Custom handling in app
onMessage((message) => {
  console.log(message.data.score);
});
```

### Notification Message
```javascript
{
  notification: {
    title: 'New Order',
    body: 'Order #123 placed'
  }
}

// Native notification displayed
// No custom app code needed
```

### Both (Recommended)
```javascript
{
  notification: {
    title: 'New Message',
    body: 'Message from John'
  },
  data: {
    messageId: '456',
    conversationId: '789'
  }
}

// Native notification shown
// App handles data payload
```

## Sending Messages

### Single Device
```
POST https://fcm.googleapis.com/v1/projects/{project}/messages:send

{
  "message": {
    "token": "bk3RNw...",
    "notification": {
      "title": "Hello",
      "body": "World"
    }
  }
}
```

### Topic (Broadcast)
```javascript
admin.messaging().sendToTopic('news', {
  notification: {
    title: 'Breaking News',
    body: 'Important update'
  }
});

// All users subscribed to 'news' get message
```

### Topic Subscription
```javascript
// Subscribe device to topic
admin.messaging().subscribeToTopic('device_token', 'news');

// Unsubscribe
admin.messaging().unsubscribeFromTopic('device_token', 'news');

// Subscribe multiple
admin.messaging().subscribeToTopic(
  ['token1', 'token2', 'token3'],
  'news'
);
```

## Delivery Guarantees

### No Guarantee
```
May not deliver if:
- Device offline
- App force-closed
- No storage on device
- Server quota exceeded
```

### Retry Always
```
FCM retries for ~24 hours
Eventually delivers when device online
Not suitable for time-sensitive data
```

## Android vs iOS Specifics

### Android
```
- If app closed: Notification in tray
- If app open: onMessageReceived() called
- Data always delivered to app
- Can subscribe to topics
```

### iOS
```
- If app closed: User sees notification
- If app open: UNUserNotificationCenter delegate
- Data only with notification wrapper
- Topics via APNs
```

## Rate Limiting

### Throttling
```
By device: ~10 messages/second
By topic: No limit (FCM handles)
By project: Quotas set in console

High frequency → delays
Burst → queued

Use exponential backoff for retries
```

## Testing

### Development
```
Use test tokens
Firebase console includes test messaging
Real devices recommended
```

### Testing Payloads
```
Valid:
{ "notification": {...} }

Invalid:
{ "notification": {}, "data": {} }  // Empty notification
{ "to": "token" }                  // Old format

Use FCM validation tools
```

## Best Practices

✅ Always handle token refresh
✅ Validate topic names
✅ Use both notification and data
✅ Implement retry logic
✅ Monitor delivery rates
✅ Test on real devices
✅ Respect user preferences
✅ Add unsubscribe option
✅ Implement TTL for messages
✅ Track analytics
""",

    "09-typing-indicators-presence": """# Typing Indicators & Presence - Theory

## Typing Indicators

### Purpose
Show to other users that someone is actively typing.

### Basic Flow
```
User starts typing
   ↓
Client emits 'typing:start'
   ↓
Server broadcasts to room
   ↓
Others see "User is typing..."
   ↓
User stops typing / pauses 3s
   ↓
Client emits 'typing:stop'
   ↓
"typing" indicator disappears
```

### Debouncing
```
Problem: Emit on every keystroke = excessive events
Solution: Debounce emission

KeyPress 1 → Emit 'typing:start'
KeyPress 2 → No emit (within 2s)
KeyPress 3 → No emit (within 2s)
Pause 3s → Emit 'typing:stop'

Result: 1 start + 1 stop per typing session
```

### Implementation
```javascript
let typingTimeout;

input.addEventListener('keypress', () => {
  if (!isTyping) {
    socket.emit('typing:start', {room: 'chat_1'});
    isTyping = true;
  }
  
  clearTimeout(typingTimeout);
  typingTimeout = setTimeout(() => {
    socket.emit('typing:stop', {room: 'chat_1'});
    isTyping = false;
  }, 3000);
});
```

## User Presence

### Status Types
```
Online: User connected and active
Away: Connected but inactive (30+ min)
Offline: Not connected
Idle: Connected but browser unfocused
Do Not Disturb: User set manually
```

### Tracking Presence
```javascript
// On connect
socket.on('connect', () => {
  io.to(`presence:${userId}`).emit('status:online');
  setStatus('online');
});

// Heartbeat (detect inactivity)
document.addEventListener('mousemove', () => {
  idle = false;
  lastActivity = Date.now();
});

setInterval(() => {
  if (Date.now() - lastActivity > 30 * 60 * 1000) {
    setStatus('away');
  }
}, 60000);

// On disconnect
socket.on('disconnect', () => {
  setStatus('offline');
});
```

### Storage Options

#### Memory (Fast)
```
const presence = new Map();
presence.set('user_123', {
  status: 'online',
  lastSeen: Date.now()
});

Pros: Instant access
Cons: Lost on restart
```

#### Redis (Recommended)
```
SETEX presence:user_123 3600 online
GET presence:user_123

Pros: Persistent, accessible cluster-wide
Cons: Network overhead (~5ms)
```

#### Database (Slow)
```
UPDATE users SET last_seen = NOW()

Pros: Permanent history
Cons: Too slow for real-time
```

## Last Seen Tracking

### Update Last Seen
```
On every message sent
On every page/view
On periodic heartbeat (every 5 min)

Trade-off: Accuracy vs Frequency
```

### Displaying "Last Seen"
```
Online → "Online"
Away → "Active 30m ago"
Offline < 1 day → "Seen 2h ago"
Offline > 1 day → "Seen yesterday"
Offline > 1 week → "Seen 5 days ago"
```

## Presence Rooms

### Pattern
```javascript
// Each user has personal presence room
socket.join(`presence:${userId}`);

// Broadcast status changes
io.to(`presence:${userId}`).emit('status:change', {
  status: 'online',
  timestamp: Date.now()
});

// Others listen for changes
socket.on('status:change', (data) => {
  updateUserStatus(data.userId, data.status);
});
```

## Scalability Concerns

### Issue
With 100k users, broadcast to all presence rooms is expensive.

### Solution 1: Only Track Friends
```
Only track presence of people in user's friend list
Reduces broadcast scope significantly
```

### Solution 2: Presence Room Sampling
```
Sample presences every 30 seconds
Not real-time but sufficient
```

### Solution 3: Redis Presence Pub/Sub
```
Redis handles presence routing
Application doesn't broadcast everything
```

## Privacy Considerations

### Who Can See My Presence?
```
Option 1: Friends only
Option 2: Users in same group
Option 3: Only admins
Option 4: Public (everyone)
```

### Implementation
```javascript
socket.on('status:change', (newStatus) => {
  // Check user's visibility settings
  const visibility = getCurrentUser().presenceVisibility;
  
  // Only broadcast to allowed users
  const allowedUsers = getAllowedUsers(userId, visibility);
  allowedUsers.forEach(uid => {
    io.to(`presence:${uid}`).emit('status:change', {
      userId, newStatus
    });
  });
});
```

## Performance Metrics

### Typing Indicators
```
Per user: ~500 bytes per "typing" state
10k users typing: ~5MB overhead
```

### Presence
```
Per user: ~100 bytes
100k users: ~10MB
```

## Best Practices

✅ Debounce typing events
✅ Use 3-5 second typing timeout
✅ Track last activity
✅ Store presence in Redis
✅ Update "last seen" periodically
✅ Respect privacy settings
✅ Use presence rooms
✅ Clean up stale presence data
✅ Test with many users
✅ Monitor presence latency
""",

    "10-email-queue-resend": """# Email Queue - Resend Theory

## Email Delivery Flow

### Traditional (Blocking)
```
User signs up
   ↓
Send welcome email (5-10 sec)
   ↓
User waits for email
   ↓
Return response

Problem: Slow, user frustrated
```

### Queued (Non-Blocking)
```
User signs up
   ↓
Queue email job (instant)
   ↓
Return response immediately
   ↓
Background worker sends email
   ↓
User gets email within seconds

Benefit: Fast, responsive
```

## Email Provider: Resend

### What is Resend?
- Modern email API
- Easy to use
- Good deliverability
- Built for developers
- RESTful API

### Resend vs SendGrid vs AWS SES
```
Feature        | Resend | SendGrid | AWS SES
Price/1000     | $1     | $1       | $0.10
API Complexity | Simple | Complex  | Very complex
Deliverability | Good   | Excellent| Good
Support        | Good   | Excellent| Basic
```

## Email Queue Architecture

### Components
```
1. Email Template → 2. Job Creator → 3. Queue → 4. Worker → 5. Resend API
   (HTML/Text)        (add to queue)   (Redis)  (sends)    (delivers)
```

### Job Structure
```javascript
{
  id: 'email_123',
  type: 'welcome_email',
  template: 'welcome',
  to: 'user@example.com',
  data: {
    name: 'John',
    link: 'https://example.com/activate'
  },
  status: 'pending',
  createdAt: Date.now()
}
```

## Email Templates

### Simple Template
```html
<h1>Welcome {{name}}!</h1>
<p>Click <a href="{{link}}">here</a> to activate.</p>
```

### Template Engine (Handlebars)
```javascript
const template = fs.readFileSync('welcome.hbs', 'utf8');
const compiledTemplate = Handlebars.compile(template);

const html = compiledTemplate({
  name: 'John',
  link: 'https://example.com/verify?token=abc'
});
```

### Template Types
```
Transactional:
- Welcome
- Password reset
- Order confirmation
- Invoice

Marketing:
- Newsletter
- Promotion
- Event announcement

Notification:
- Alert
- Mention
- Activity update
```

## Sending Strategy

### Batching
```
Collect emails for 10 seconds
Batch send 100 emails at once
More efficient than 1-by-1
```

### Rate Limiting
```
Resend: 1000 emails/minute limit
Strategy: Space out sends
          Queue handles automatically
```

### Retry Logic
```
Attempt 1: Immediately
Attempt 2: Wait 1min (if failed)
Attempt 3: Wait 10min (if failed)
Attempt 4: Wait 1hour (if failed)
After 4: Move to failed queue
```

## Delivery Verification

### Bounce Handling
```
Hard Bounce: Email invalid, never retry
Soft Bounce: Temporary issue, retry

Examples:
Hard: user@invalid.com (invalid domain)
Soft: Mailbox full (retry later)
```

### Unsubscribe Links (Legal)
```html
<footer>
  <a href="https://example.com/unsubscribe?token={{token}}">
    Unsubscribe
  </a>
  <p>© 2024 Example Corp</p>
</footer>
```

MUST include for marketing emails (CAN-SPAM Act)

## Tracking

### Click Tracking
```
Original: <a href="https://example.com">Link</a>
Tracked:  <a href="https://email-tracking.com/click?id=123">Link</a>

User clicks → Tracked → Redirects to original
```

### Open Tracking
```
Add invisible pixel: <img src="https://tracking.com/open?id=123">
Pixel loaded = email opened
```

### Performance Tracking
```
Metrics:
- Delivery rate
- Open rate
- Click rate
- Bounce rate
- Unsubscribe rate
```

## Best Practices

✅ Always queue, never send directly
✅ Include unsubscribe link
✅ Use clear from name
✅ A/B test subject lines
✅ Implement retry logic
✅ Monitor bounce rates
✅ Track engagement
✅ Test before sending
✅ Include plain text version
✅ Respect user preferences
""",

    "11-ephemeral-chat-disappearing": """# Ephemeral Chat - Self-Destructing Messages Theory

## What is Ephemeral?

Messages that automatically disappear after a set time period.

### Examples
```
"This message will self-destruct in 5 seconds"
Duration: 5 seconds after view
Platforms: Signal, Telegram, Snapchat
```

## Implementation Strategies

### Server-Side TTL (Recommended)
```
1. Message created with TTL
2. Stored in Redis with expiry
3. Auto-deleted after TTL
4. Client shows countdown
5. Server never shows expired message

Pro: Guaranteed deletion
Con: Client not aware until refresh
```

### Client-Side Timer
```
1. Message received
2. Client starts countdown timer
3. UI shows remaining time (10, 9, 8...)
4. On timeout, remove from UI
5. Cannot retrieve after timeout

Pro: Real-time countdown
Con: User could screenshot first
```

### Hybrid Approach
```
1. Server stores with Redis TTL
2. Client shows countdown
3. Client removes from UI on timeout
4. Server auto-deletes on TTL
5. Double protection
```

## TTL Options

### Fixed Duration
```
All messages 30 seconds
User can't change
```

### User-Selected
```
User chooses: 5s, 10s, 30s, 1m, 5m, etc.
Different for each message
```

### Per-Conversation
```
Conversation setting: "All messages disappear in 30s"
Applies to all messages in conversation
```

## View-Once vs Time-Based

### View Once
```
Message disappears after user reads it (once)
Stays until user opens conversation
Then disappears immediately
Good for: Confidential info
```

### Time-Based
```
Message disappears after X seconds
Whether user read or not
Good for: Temporary info
```

### Both
```
Disappears if:
- User read it AND 30 seconds passed
- OR 10 minutes passed (unread or read)
Whichever comes first
Good for: Security + convenience
```

## Privacy Features

### No History
```
No message archive
No export option
No screenshot permission
Can't reply to old messages
```

### Read Receipts
```
Show if message read
User knows message was seen
Can warn before disappearing
```

### Delete for Everyone
```
User can delete message before TTL
Removed from all recipients
Notifies others it was deleted
```

## Technical Implementation

### Redis Storage
```javascript
const messageId = `msg_${Date.now()}`;
const ttl = 30; // seconds

await redis.setex(
  messageId,
  ttl,
  JSON.stringify(messageData)
);

// Message auto-deleted after 30 seconds
```

### Client Countdown
```javascript
let remaining = ttl;
const interval = setInterval(() => {
  remaining--;
  updateUI(`Disappears in ${remaining}s`);
  
  if (remaining <= 0) {
    clearInterval(interval);
    removeFromUI();
  }
}, 1000);
```

### Server Cleanup
```javascript
socket.on('message:ephemeral', (msg) => {
  const id = generateId();
  
  // Store with TTL
  redis.setex(id, msg.ttl, JSON.stringify(msg));
  
  // Broadcast to room
  io.to(msg.room).emit('message', {
    ...msg,
    expiresAt: Date.now() + msg.ttl * 1000
  });
  
  // Schedule cleanup
  setTimeout(() => {
    io.to(msg.room).emit('message:expired', {id});
  }, msg.ttl * 1000);
});
```

## Anti-Patterns

### Problem: Screenshots
```
User takes screenshot of ephemeral message
Message still exists in image
No technical solution
Only policy-based (legal warning)
```

### Problem: Relay Attacks
```
User1: Sends ephemeral message to User2
User2: Screenshots and sends raw message to User3
Original TTL bypassed

Solution: Only technical: disable copy/screenshot
```

## Use Cases

### 1. Confidential Information
```
Passwords, tokens, keys
Auto-disappear after reading
Developer sharing credentials
```

### 2. Sensitive Communications
```
Personal information
Medical data
Legal discussions
```

### 3. Temporary Links
```
Login tokens
File download links
OTP codes
```

### 4. Casual Chat
```
Jokes you don't want saved
Temporary plans/meetings
Quick messages
```

## Compliance

### Data Retention
```
Ephemeral ≠ not-logged
Server might log for compliance
Only message, not content typically
```

### GDPR
```
"Right to be forgotten"
Ephemeral helps but doesn't guarantee
Still need deletion policies
```

## Performance

### Monitoring TTL
```
Millions of messages with TTL
Redis efficiently handles expiry
Cleanup automated
No manual intervention
```

### Storage
```
Only active messages in Redis
Expired messages auto-removed
Memory bounded
```

## Best Practices

✅ Show clear expiry timer
✅ Warn before deletion
✅ Store with TTL in robust system
✅ Test expiry mechanism
✅ Document that screenshots are possible
✅ Provide delete-before-expiry option
✅ Monitor for bugs in expiry
✅ Don't rely on client-side only
✅ Implement server-side cleanup
✅ Test edge cases (connection loss, etc)
""",

    "12-webrtc-peer-to-peer": """# WebRTC - Peer-to-Peer Communication Theory

## What is WebRTC?

Web Real-Time Communication - browser technology for:
- Audio calls
- Video conferences
- Screen sharing
- Data channels
- P2P connections

## Direct P2P Connection

### Why P2P?
```
Traditional: Client ↔ Server ↔ Client (bandwidth x2)
P2P: Client ↔ Client (bandwidth x1, low latency)

Benefits:
- Lower latency (no server hop)
- Lower bandwidth
- More private (data doesn't traverse server)
- Scales better (no server bottleneck)
```

## WebRTC Architecture

### Signaling
```
Problem: Browsers don't know each other's IP/port
Solution: Exchange signaling messages via server

1. Caller creates offer (session description)
2. Sends offer to Callee via signaling server
3. Callee creates answer
4. Sends answer back to Caller
5. Both have session description
6. Ready for media
```

### ICE (Interactive Connectivity Establishment)
```
Problem: Network traversal, firewalls, NAT
Solution: Find route to reach peer

1. Gather local candidates (IP addresses)
2. Get STUN server candidates (public IP)
3. Send candidates to peer via signaling
4. Test connectivity:
   - Direct connection (best)
   - TURN relay (fallback)
5. Use best route
```

## Offer/Answer Model

### Step 1: Create Offer
```javascript
// Caller
const peerConnection = new RTCPeerConnection();
const offer = await peerConnection.createOffer();
await peerConnection.setLocalDescription(offer);

// Send offer to callee via signaling
socket.emit('signal:offer', {
  to: calleeId,
  offer: offer
});
```

### Step 2: Receive Offer & Create Answer
```javascript
// Callee
socket.on('signal:offer', async (data) => {
  const peerConnection = new RTCPeerConnection();
  await peerConnection.setRemoteDescription(
    new RTCSessionDescription(data.offer)
  );
  
  const answer = await peerConnection.createAnswer();
  await peerConnection.setLocalDescription(answer);
  
  // Send answer back
  socket.emit('signal:answer', {
    to: data.from,
    answer: answer
  });
});
```

### Step 3: ICE Candidates
```javascript
// Both sides send ICE candidates
peerConnection.addEventListener('icecandidate', (event) => {
  if (event.candidate) {
    socket.emit('signal:icecandidate', {
      candidate: event.candidate
    });
  }
});

// Receive and add ICE candidates
socket.on('signal:icecandidate', (data) => {
  peerConnection.addIceCandidate(
    new RTCIceCandidate(data.candidate)
  );
});
```

## STUN & TURN Servers

### STUN (Session Traversal Utilities for NAT)
```
Purpose: Find your public IP address
Query: "What's my public IP?"
Response: 203.0.113.45:51234

Cost: Free (usually)
Examples: stun.l.google.com, stun.services.mozilla.com
```

### TURN (Traversal Using Relays around NAT)
```
Purpose: Relay data if P2P fails
Path: Client1 → TURN Server ← Client2

Used as fallback when:
- Both behind different NATs
- Restrictive firewalls
- Corporate networks

Cost: Pay per GB relayed (~$1-5 per GB)
```

## Media Streams

### Adding Constraints
```javascript
const constraints = {
  audio: {
    echoCancellation: true,
    noiseSuppression: true,
    autoGainControl: true
  },
  video: {
    width: { ideal: 1280 },
    height: { ideal: 720 },
    frameRate: { ideal: 30 }
  }
};

const stream = await navigator.mediaDevices
  .getUserMedia(constraints);
```

### Adding Tracks
```javascript
const audioTrack = stream.getAudioTracks()[0];
const videoTrack = stream.getVideoTracks()[0];

peerConnection.addTrack(audioTrack, stream);
peerConnection.addTrack(videoTrack, stream);

// Receive remote tracks
peerConnection.addEventListener('track', (event) => {
  remoteVideo.srcObject = event.streams[0];
});
```

## Connection States

### ICE Connection States
```
new → checking → connected → completed → disconnected
└─→ failed
└─→ closed

connected = can send/receive data
failed = cannot establish connection
```

### Connection Health
```javascript
peerConnection.addEventListener('connectionstatechange', () => {
  switch (peerConnection.connectionState) {
    case 'connected':
      console.log('Call established');
      break;
    case 'disconnected':
      console.log('Call disconnected');
      recover();
      break;
    case 'failed':
      console.log('Call failed');
      endCall();
      break;
  }
});
```

## Data Channels

### Arbitrary Data Transfer
```javascript
const dataChannel = peerConnection.createDataChannel('chat');

dataChannel.addEventListener('message', (event) => {
  console.log('Message:', event.data);
});

dataChannel.send('Hello from sender');
```

## Performance Metrics

### Gathering ICE Candidates
```
Time: 1-5 seconds typically
Depends on:
- Network configuration
- Number of available candidates
- STUN/TURN server speed

If takes > 30s, likely connection failure
```

### Latency
```
P2P direct: 10-50ms (excellent)
P2P relayed: 50-100ms (good)
Server-based: 100-300ms (acceptable)
```

## Security

### DTLS (Datagram Transport Layer Security)
```
All peer connections encrypted
Certificates automatically generated
No need for manual certificate setup
```

### Limitations
```
Audio/video streams encrypted
Signaling server unencrypted (HTTPS recommended)
Peer discovery via server (privacy concern)
```

## Best Practices

✅ Use STUN/TURN configuration
✅ Handle ice candidate trickling
✅ Monitor connection state
✅ Implement reconnection logic
✅ Test with restrictive networks
✅ Handle media permissions
✅ Implement timeout fallbacks
✅ Log connection metrics
✅ Test on real devices
✅ Handle browser incompatibilities
""",

    "13-poll-real-time-updates": """# Real-Time Polls - Theory

## Poll Lifecycle

```
1. Poll Created
   ├─ Define question
   ├─ Add options
   ├─ Set expiry
   └─ Open for voting

2. Voting
   ├─ Users cast votes (one per user)
   ├─ Votes counted immediately
   ├─ Results updated live
   └─ Other users see changes

3. Poll Closed
   ├─ Time expired
   ├─ Organizer closed
   └─ Final results frozen
```

## Vote Tracking

### Simple Counter
```javascript
const poll = {
  options: {
    'Option A': 5,
    'Option B': 3,
    'Option C': 2
  }
};

// Pro: Simple
// Con: Can't prevent double voting
```

### Voter Validation
```javascript
const poll = {
  options: {
    'Option A': 5,
    'Option B': 3
  },
  voters: Set(['user1', 'user2', 'user3'...]),
  votes: Map({
    'user1': 'Option A',
    'user2': 'Option B'
  })
};

// Pro: Prevents cheating
// Con: More memory
```

## Real-Time Updates

### Server Broadcasting
```javascript
socket.on('poll:vote', (pollId, option, userId) => {
  const poll = polls.get(pollId);
  
  if (poll.voters.has(userId)) {
    return socket.emit('error', 'Already voted');
  }
  
  poll.voters.add(userId);
  poll.votes.set(userId, option);
  poll.options[option]++;
  
  // Broadcast to all poll viewers
  io.to(`poll:${pollId}`).emit('poll:updated', {
    options: poll.options,
    totalVotes: poll.voters.size
  });
});
```

### Live Percentage Calculation
```javascript
function getPercentages(poll) {
  const total = poll.voters.size;
  const percentages = {};
  
  for (const [option, count] of Object.entries(poll.options)) {
    percentages[option] = total > 0 
      ? ((count / total) * 100).toFixed(1)
      : 0;
  }
  
  return percentages;
}

// Broadcast with percentages
io.to(`poll:${pollId}`).emit('poll:results', {
  options: poll.options,
  percentages: getPercentages(poll),
  totalVotes: poll.voters.size
});
```

## Preventing Fraud

### One Vote Per User
```
Track userId in voters set
Check before accepting vote
Reject if already voted
```

### Rate Limiting
```
Limit votes per IP/user per minute
Prevent rapid vote switching
```

### Validation
```
- Verify user logged in
- Check poll still open
- Validate option exists
- Verify vote timestamp reasonable
```

## Poll States

### Active
```
Accepting votes
Results visible
Can join anytime
```

### Closed
```
No more votes accepted
Results final
Voting disabled
```

### Archived
```
Poll completed hours/days ago
Results only
Can't interact
```

## Poll Types

### Public Poll
```
Anyone can see
Anyone can vote
Results public
```

### Private Poll
```
Invited users only
Results private
Can't find via search
```

### Anonymous Poll
```
Vote recorded
Voter identity hidden
Only admins see who voted
```

## Real-Time Challenges

### Problem: Poll Overflow
```
1 million users voting
Broadcasts every vote update to all
= 1 million websocket messages

Solution:
- Batch updates (combine updates)
- Throttle broadcasts (every 100 votes)
- Use rooms to limit scope
```

### Problem: Vote Changing
```
User changes mind, votes for different option
Old vote count decreases, new vote increases
Need to track old vote to decrement

Solution:
- Store user's previous vote
- When new vote comes in, decrement old option
```

## Results Display

### Live Leaderboard
```
Rank by votes
Top option first
Show percentage
Show vote count
```

### Pie Chart
```
Visual representation
Percentage per option
Total votes
```

### Bar Chart
```
Option on Y-axis
Vote count on X-axis
Updates in real-time
```

## Expiry Handling

### Time-Based Expiry
```javascript
setTimeout(() => {
  poll.active = false;
  io.to(`poll:${pollId}`).emit('poll:closed', {
    options: poll.options
  });
}, poll.expiryTime);
```

### Vote Counting After Close
```
No new votes accepted
Results calculated
Poll moved to archived
Results queryable by history
```

## Best Practices

✅ Prevent double voting
✅ Show real-time results
✅ Implement expiry
✅ Batch updates on high load
✅ Save poll results to database
✅ Allow anonymous voting option
✅ Show total votes count
✅ Calculate percentages server-side
✅ Validate all votes before counting
✅ Test with large user base
""",

    "14-crdt-collaborative-editing": """# CRDT Theory - Conflict-Free Collaborative Editing

## The Challenge

```
User1: Creates document "Hello"
         ↓
User1: Adds " World"  → "Hello World"
User2: (offline)       (no sync)
       ↓
User2: Adds " from me" → "Hello from me"
       ↓
Reconnect: Both have different content
Which is correct???
```

## CRDT (Conflict-free Replicated Data Type)

CRDT allows updates from multiple sources to automatically merge to same state without conflicts.

### Key Properties
```
1. Commutative: Order doesn't matter
   A + B = B + A

2. Idempotent: Duplicates are safe
   Apply operation twice = same result

3. Convergent: All replicas reach same state
   Eventually consistent across network
```

## Operational Transformation

### Position-Based
```
Document: "Hello"
Operation: Insert "X" at position 3
Result: "HeXllo"

Problem: If User2 deletes position 0, positions shift
User1's position 3 now points to wrong location
```

### Solution: Transform Operations
```
User1: Insert "X" at 3 → "HeXllo"
User2: Delete position 0 → "ello"

Transform User2's delete:
- Since User1 inserted before position, shift by 1
- Delete position 0 in context of "HeXllo" = "eXllo"

Both reach same state: "eXllo"
```

## Implementation Example

### Simple String CRDT
```javascript
class CRDT {
  constructor() {
    this.text = '';
    this.operations = [];
  }
  
  insert(pos, char, userId, timestamp) {
    const op = { type: 'insert', pos, char, userId, timestamp };
    this.operations.push(op);
    this.rebuild();
  }
  
  delete(pos, userId, timestamp) {
    const op = { type: 'delete', pos, userId, timestamp };
    this.operations.push(op);
    this.rebuild();
  }
  
  rebuild() {
    // Sort by timestamp
    const sorted = this.operations.sort((a,b) => 
      a.timestamp - b.timestamp
    );
    
    // Apply all operations in order
    this.text = '';
    sorted.forEach(op => {
      if (op.type === 'insert') {
        this.text = this.text.slice(0, op.pos)
                   + op.char
                   + this.text.slice(op.pos);
      } else if (op.type === 'delete') {
        this.text = this.text.slice(0, op.pos)
                   + this.text.slice(op.pos + 1);
      }
    });
  }
}
```

## Advantages

✅ No conflict resolution needed
✅ Works offline
✅ Automatically converges
✅ Fault tolerant
✅ P2P friendly

## Disadvantages

❌ Complex to implement
❌ More memory (track all ops)
❌ Harder to reason about
❌ Performance overhead

## Vector Clocks

### Problem
```
How to order concurrent operations?
User1: Insert "A"
User2: Insert "B" (same position, same time)
Which wins?
```

### Solution: Vector Clock
```
Timestamp each operation with:
[userId, localCounter]

User1's ops: [1, 1], [1, 2], [1, 3]
User2's ops: [2, 1], [2, 2]

Total order: Compare (userId, counter)
[1,1] < [1,2] < [2,1] < [2,2] < [1,3]
```

## Real-World CRDTs

### Yjs
```
Popular CRDT library
Supports rich text, arrays, maps
Works with WebSocket
Example: ˙Figma, Notion use similar tech
```

### Automerge
```
JSON-like CRDT
Works offline
Good for apps with local editing
```

## Performance

### Memory
```
Stores all operations ever
1000 edits = store 1000 operations
Can snapshot and compact
```

### CPU
```
Rebuild document every change
Scales O(n) with operation count
With 10k operations, rebuild = ~10ms

Optimization: Incremental rebuild
```

## Scaling

### Problem
With 1000 concurrent users, 10k operations/sec
Each rebuild = 10ms
= 100 CPU seconds/second (not scalable)

### Solution
Use simpler OT (Operational Transform)
or limit concurrency

## Testing

```javascript
// Test convergence
const crdt1 = new CRDT();
const crdt2 = new CRDT();

crdt1.insert(0, 'A', 'user1', 1);
crdt2.insert(0, 'B', 'user2', 2);

// Exchange operations
crdt1.apply(crdt2.operations);
crdt2.apply(crdt1.operations);

// Both should have same text
assert(crdt1.text === crdt2.text);
```

## Best Practices

✅ Use proven CRDT library (Yjs, Automerge)
✅ Don't implement from scratch
✅ Snapshot periodically to save space
✅ Test with simulated network delay
✅ Monitor memory usage
✅ Test offline/online transitions
✅ Implement tombstones for deletions
✅ Version your CRDT format
✅ Handle corrupt/corrupt documents
✅ Log for debugging conflicts
""",

    "15-collaborative-whiteboard": """# Collaborative Whiteboard - Theory

## Real-Time Drawing System

### Challenges
```
1. Multiple users drawing simultaneously
2. Network latency (100-500ms)
3. Rendering performance
4. Shape coordination
5. Undo/redo with multiple users
```

## Drawing Coordination

### Approach: Event-Based
```
User1 draws line
   ↓
Create draw event:
{
  type: 'line',
  startX, startY,
  endX, endY,
  color, width
}
   ↓
Send to server
   ↓
Server broadcasts to all
   ↓
All clients draw the line
```

### Event Lossy?
```
Network can drop events
Solution: Resend entire drawing state on join
New user: Reconnect → Receive all existing shapes
```

## Canvas Rendering

### Update Rate
```
Client draws 60 FPS (if smooth)
Send coordinates to server:
- Could send 60x per second = 60 events
- Bandwidth intensive
- Processing overhead

Better: Send on mouse up
- One event per draw
- Low bandwidth
- Slight lag but acceptable
```

### Rendering Optimization
```
Option 1: Redraw everything each frame (simple)
- 1000 shapes, 60 FPS = 60k draw calls
- Too slow

Option 2: Append new shapes (efficient)
- Draw backgrounds once
- Append new shapes incrementally
- 60 FPS smooth

Option 3: Canvas layers
- Layer per user
- Combine on render
- Easy to hide/show users
```

## Shape Types

### Primitive Shapes
```
Line: startX, startY, endX, endY
Circle: centerX, centerY, radius
Rectangle: topLeftX, topLeftY, width, height
Text: text, x, y, fontSize, fontFamily
Path: array of points
```

### Shape Structure
```javascript
{
  id: 'shape_123',
  type: 'line',
  startX: 10, startY: 20,
  endX: 100, endY: 150,
  color: '#000000',
  strokeWidth: 2,
  opacity: 1,
  userId: 'user_1',
  createdAt: timestamp,
  zIndex: 10
}
```

## Cursor Tracking

### Show Other Users' Cursors
```
User moves mouse
   ↓
Emit cursor position (throttled, every 100ms)
   ↓
Server broadcasts to room
   ↓
Others see cursor position
   ↓
Draw cursor with label
```

### Throttling Cursor Events
```
Without throttle: 60 events/second
With throttle: 10 events/second (every 100ms)
UI still responsive, bandwidth reduced
```

## Undo/Redo in Collaboration

### Problem
```
Server: [Shape1, Shape2, Shape3]
User1: Undo → [Shape1, Shape3]
User2: Draws Shape4 → [Shape1, Shape2, Shape3, Shape4]

When synced: [Shape1, Shape3, Shape4]
User1 or User2 confused?
```

### Solution: CRDT-Based
```
Each shape has unique ID
Track which user deleted
Undo only affects user's shapes
Other users' shapes stay
```

### Solution: Stack-Based
```
Keep operation history
User1 undo: Remove from User1's operation
Rebuild document from all operations
```

## Performance Metrics

### Drawing Performance
```
Smooth drawing: <16ms per frame (60 FPS)
Network: 100-500ms latency
Typical: Draw locally, sync to others
```

### Memory Usage
```
1000 shapes in memory
Each shape: ~500 bytes
Total: ~500 KB

In 2 hours, 10k shapes:
= ~5 MB per whiteboard session
```

### Network Bandwidth
```
Per draw event: 200-500 bytes
1 draw/second: 200 bytes/sec
1k users: 200 KB/sec per whiteboard
Acceptable for collaborative app
```

## Layers & Z-Index

### Layering System
```
z-index: Controls which shape on top
Higher z-index = on top
Ascending order when rendering
```

### Bring to Front
```
Used when: Shape drawn over another
Solution: Increase z-index
- Current max z-index: 100
- Set new shape z-index: 101
- Now appears on top
```

## Saving & Export

### Save to Database
```javascript
await database.save({
  whiteboardId,
  shapes: whiteboard.shapes,
  timestamp: Date.now()
});
```

### Export as Image
```javascript
const canvas = document.getElementById('board');
const image = canvas.toDataURL('image/png');
download(image, 'whiteboard.png');
```

### Export as PDF
```
Use library: jsPDF, pdfkit
Draw shapes on PDF
Include metadata (user, timestamp)
```

## Real-Time Challenges

### Connection Lost
```
User drawing, connection drops
Solution:
1. Show "reconnecting..." message
2. Buffer local draws
3. On reconnect, send buffered draws
```

### Concurrent Deletes
```
User1: Deletes shape A
User2: Trying to draw on shape A
Solution:
- Send delete event
- All clients remove shape
- User2's draw event ignored (shape gone)
```

## Best Practices

✅ Throttle cursor updates
✅ Throttle shape broadcasts
✅ Show user indicators (colors, labels)
✅ Implement layer management
✅ Allow shape grouping
✅ Implement grid/snap-to-grid
✅ Keyboard shortcuts (Ctrl+Z)
✅ Prevent concurrent moves
✅ Test with high latency
✅ Save periodically to database
✅ Implement clear canvas
✅ Add lock on shapes
""",
}

def write(module_dir, content):
    path = f"{BASE}/{module_dir}/theory.md"
    with open(path, 'w') as f:
        f.write(content)
    print(f"✅ {module_dir} → {len(content)} chars")

for mod, content in THEORY_06_15.items():
    write(mod, content)

print(f"\n✅ All 10 additional theory.md files updated!")
