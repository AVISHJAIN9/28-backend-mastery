# Push Notifications: Firebase Cloud Messaging & Web Push API

## Table of Contents
1. [Push Notifications Fundamentals](#push-notifications-fundamentals)
2. [Firebase Cloud Messaging (FCM)](#firebase-cloud-messaging-fcm)
3. [Web Push API with VAPID](#web-push-api-with-vapid)
4. [Device Token Lifecycle](#device-token-lifecycle)
5. [Notification Delivery Tracking](#notification-delivery-tracking)
6. [Real-World Applications](#real-world-applications)
7. [Common Mistakes & Prevention](#common-mistakes--prevention)
8. [Best Practices](#best-practices)

---

## Push Notifications Fundamentals

### What Are Push Notifications?

Push notifications are out-of-band messages sent from a server to client applications without the user explicitly requesting them at that moment. Unlike pull notifications where clients periodically check for new messages, push notifications are delivered immediately, making them ideal for time-sensitive information.

### Push vs Pull Model

**Pull Model (Polling):**
- Client repeatedly asks server "Do you have updates for me?"
- High latency - updates arrive after polling interval
- Wasteful - many requests return nothing
- Battery draining on mobile devices
- Examples: Email clients before push, RSS readers

**Push Model (Notifications):**
- Server sends data to client immediately when available
- Low latency - ~100ms delivery
- Efficient - only sends when needed
- Better battery life
- Used by: Firebase, Apple Push Notification Service (APNs), Web Push

### Notification Architecture

```
┌─────────────────┐
│  Application    │
│   Backend       │
└────────┬────────┘
         │
         │ POST /send-notification
         │ { deviceToken, title, body }
         │
┌────────▼────────────────────┐
│  Push Notification Service  │
│  (FCM / Web Push)           │
└────────┬────────────────────┘
         │
    ┌────┴────┬─────────┐
    │          │         │
  ┌─▼─┐    ┌──▼──┐   ┌──▼──┐
  │iOS│    │Android│  │Web│
  └───┘    └──────┘   └────┘
```

### Key Components

1. **Sender (Your Backend):** Initiates notifications via REST API
2. **Push Service (FCM/Web Push):** Stores device tokens and routes messages
3. **Device/Browser:** Receives and displays notifications to user

---

## Firebase Cloud Messaging (FCM)

### What is FCM?

Firebase Cloud Messaging is Google's platform for reliably delivering messages to mobile devices and web browsers. It handles the infrastructure needed to queue, route, and deliver millions of notifications.

### How FCM Works

**Registration Flow:**
```
1. Mobile App calls FirebaseMessaging.getToken()
2. Firebase generates unique device token (152+ chars)
3. App sends token to backend via /register endpoint
4. Backend stores token in database
```

**Sending Flow:**
```
1. Backend calls FCM API: POST https://fcm.googleapis.com/send
2. Includes: device token, title, body, data
3. FCM routes message to device
4. Device receives notification via FCM connection
5. System displays notification in notification center
```

### FCM Message Structure

```javascript
// Request to FCM API
{
  "to": "device_token_here",
  "notification": {
    "title": "New Message",
    "body": "You have a new message",
    "sound": "default",
    "badge": "1"
  },
  "data": {
    "conversationId": "123",
    "senderId": "456",
    "customKey": "customValue"
  },
  "ttl": 2419200  // 28 days in seconds
}

// Device receives and displays
{
  "from": "123456789@gcm.googleapis.com",
  "notification": {
    "title": "New Message",
    "body": "You have a new message",
    "sound": "default",
    "badge": "1"
  },
  "data": {
    "conversationId": "123",
    "senderId": "456",
    "customKey": "customValue"
  }
}
```

### FCM Token Lifecycle

**Token Validity:**
- New token generated each time app is installed
- Token remains valid until:
  - User uninstalls app
  - App clears its data
  - App updates (sometimes)
  - User disables notifications
  - 1 year+ of no use (FCM may invalidate)

**Token Refresh:**
- FCM SDK refreshes tokens periodically
- Apps must catch `onTokenRefresh` event
- Must send new token back to backend
- Invalid tokens cause "NotRegistered" errors

**When to Request New Token:**
```javascript
// Android/iOS
FirebaseMessaging.getInstance().getToken(task -> {
  if (task.isSuccessful()) {
    String token = task.getResult();
    sendTokenToBackend(token); // New registration
  }
});

// Web
messaging.getToken({
  vapidKey: publicKeyString
}).then(token => {
  sendTokenToBackend(token);
});
```

### FCM Limitations

- Title: 240 characters max
- Body: 4000 characters max  
- Data payload: 4096 bytes max
- Notification delivery not guaranteed (best effort)
- No delivery receipt by default

### Setting Up FCM

**Requirements:**
1. Firebase project (firebase.google.com)
2. Service account credentials (for backend)
3. Firebase SDK (for clients)
4. Device token from client

**Backend Setup (Node.js):**
```javascript
const admin = require('firebase-admin');

// Initialize with service account
admin.initializeApp({
  credential: admin.credential.cert({
    type: "service_account",
    project_id: "your-project",
    private_key: "-----BEGIN PRIVATE KEY-----...",
    client_email: "firebase-adminsdk@your-project.iam.gserviceaccount.com"
  })
});

// Send message
await admin.messaging().send({
  token: deviceToken,
  notification: {
    title: "Hello!",
    body: "This is a test"
  }
});
```

---

## Web Push API with VAPID

### What is Web Push?

Web Push API is the browser standard for sending notifications to web applications. Unlike FCM which requires Firebase, Web Push works with any backend using open standards (VAPID keys, encrypted payloads).

### Voluntary Application Server Identification (VAPID)

VAPID solves a critical problem: **How does a push service know the server sending the message is legitimate?**

Before VAPID, anyone could send notifications if they had a device token. VAPID adds cryptographic proof:

**VAPID Keys:**
- Generated as public/private key pairs (ECDSA P-256)
- Public key: sent to browser during subscription
- Private key: kept secret on backend
- Backend signs requests with private key
- Push service verifies signature with public key

### Web Push Flow

```
1. Browser: Request subscription
   GET /serviceworker.js
   → registers Service Worker

2. Service Worker: Generate subscription
   registration.pushManager.subscribe({
     userVisibleOnly: true,
     applicationServerKey: publicKey
   })

3. Browser: Return subscription object
   {
     endpoint: "https://push-service.example.com/v1/notif/...",
     keys: {
       p256dh: "base64-encoded-key",
       auth: "base64-encoded-key"
     }
   }

4. Client: Store subscription, send to backend
   POST /api/subscribe { subscription }

5. Backend: Send push message
   POST endpoint
   headers: {
     "Crypto-Key": base64(p256dh),
     "Encryption": base64(auth),
     "Authorization": "vapid t=JWT,k=publicKey"
   }
   body: encrypt(payload, subscription.keys)

6. Push Service: Forward to client

7. Browser: Deliver to Service Worker
   self.addEventListener('push', event => {
     const data = event.data.json();
     self.registration.showNotification(data.title);
   });
```

### Encryption in Web Push

Web Push requires message encryption (AES-128-GCM) even over HTTPS:

```javascript
// Encryption process
1. Browser shares p256dh and auth keys during subscription
2. Backend uses Diffie-Hellman to derive shared secret
3. Encrypts payload with shared secret using AES-128-GCM
4. Sends encrypted payload to push service
5. Push service forwards to browser (only push service sees encrypted data)
6. Browser decrypts using shared secret
7. Service Worker receives plaintext
```

**Why encrypt?**
- Push service employees can't read messages
- User privacy even from service operators
- Prevents man-in-the-middle attacks on push service

### Web Push Message Structure

```javascript
// Subscribe (client-side)
const subscription = await registration.pushManager.subscribe({
  userVisibleOnly: true,
  applicationServerKey: urlB64ToUint8Array(publicKey)
});

// Send (backend)
const webpush = require('web-push');

webpush.setVapidDetails(
  'mailto:admin@example.com',
  PUBLIC_KEY,
  PRIVATE_KEY
);

await webpush.sendNotification(subscription, JSON.stringify({
  title: 'New Message',
  body: 'You have a message',
  icon: '/images/icon.png',
  badge: '/images/badge.png',
  tag: 'message',           // Group notifications with same tag
  requireInteraction: true, // Keep notification until user closes
  actions: [
    { action: 'reply', title: 'Reply' },
    { action: 'archive', title: 'Archive' }
  ]
}));
```

### VAPID Key Generation

```bash
# Generate private key
openssl ecparam -name prime256v1 -genkey -noout -out private_key.pem

# Extract public key
openssl ec -in private_key.pem -pubout -outform DER | \
  openssl dgst -sha256 -binary | base64 -w 0

# For Node.js web-push library
const vapidKeys = webpush.generateVAPIDKeys();
console.log('Public:', vapidKeys.publicKey);
console.log('Private:', vapidKeys.privateKey);
```

### Web Push Limitations

- Works in modern browsers only (no IE11)
- Service Worker required
- User must explicitly grant permission
- Token: 3-4KB (large compared to FCM)
- Delivery not guaranteed but more reliable than FCM

### Supported Browsers

- Chrome/Edge: Yes (Firebase backend)
- Firefox: Yes (Mozilla Push Service)
- Safari: Limited (macOS Notifications only in 16+)
- Safari iOS: Not supported

---

## Device Token Lifecycle

### Token Generation

**Mobile (FCM):**
```
App Installation
       ↓
Firebase SDK initializes
       ↓
FCM generates unique 152+ char token
       ↓
Firebase calls onTokenRefresh() callback
       ↓
App captures token and sends to backend
       ↓
Backend stores in devices collection indexed by userId
```

**Web (Web Push):**
```
Service Worker registered
       ↓
User grants notification permission
       ↓
Browser subscribes: pushManager.subscribe()
       ↓
Browser gets subscription object (3-4KB)
       ↓
App sends subscription to backend
       ↓
Backend stores stringified subscription
```

### Token Validation

When validating device tokens:

**FCM Token Validation:**
```javascript
// Length check
if (!token || token.length < 100) return false;

// Character validation
if (!/^[a-zA-Z0-9_-]+$/.test(token)) return false;

// Actual validity: send test notification
try {
  await admin.messaging().send({ token });
} catch (error) {
  if (error.code === 'messaging/invalid-registration-token') {
    // Token is invalid, remove from database
    await db.collection('devices').deleteOne({ token });
  }
}
```

**Web Push Token Validation:**
```javascript
// Check endpoint is HTTPS URL
if (!subscription.endpoint.startsWith('https://')) return false;

// Check required keys exist and are base64
const { p256dh, auth } = subscription.keys;
if (!p256dh || !auth) return false;

// Validate base64 format
const isValidBase64 = (str) => {
  try {
    Buffer.from(str, 'base64');
    return true;
  } catch {
    return false;
  }
};

if (!isValidBase64(p256dh) || !isValidBase64(auth)) return false;
```

### Token Invalidation

Tokens become invalid for several reasons:

**Auto-Invalidation:**
- UserUninstalls app
- Device factory reset
- Firebase detects 1+ year unused
- Browser clears data / uninstalls extension

**Manual Invalidation:**
- User disables notifications in settings
- User unsubscribes device
- Backend receives 410 error (gone)

**Handling Invalid Tokens:**
```javascript
function handleSendError(error, token) {
  if (error.code === 'messaging/invalid-registration-token') {
    // Remove from database
    db.devices.deleteOne({ token });
  } else if (error.code === 'messaging/registration-token-not-registered') {
    // Also remove
    db.devices.deleteOne({ token });
  } else if (error.code === 'messaging/third-party-auth-error') {
    // FCM credentials invalid - investigate
  }
}
```

### Token Storage Best Practices

**Schema:**
```javascript
{
  userId: ObjectId,
  platform: "fcm" | "web-push",
  token: string,           // FCM token
  endpoint: string,        // Web Push endpoint
  p256dh: string,         // Web Push key
  auth: string,           // Web Push key
  createdAt: Date,
  lastUsed: Date,         // Update on each notification
  userAgent: string,      // Device info
  ipAddress: string,      // Last request IP
  status: "active" | "unsubscribed",
  unsubscribedAt?: Date
}
```

**Indexing:**
```javascript
db.devices.createIndex({ userId: 1, createdAt: -1 });
db.devices.createIndex({ token: 1 }, { unique: true });
db.devices.createIndex({ endpoint: 1 }, { unique: true });
```

---

## Notification Delivery Tracking

### Delivery Acknowledgment

Unlike email or SMS, push notifications don't provide delivery confirmation natively. Solutions:

**1. Assume Delivery**
```javascript
// Simplest: mark as sent
await db.notifications.updateOne(
  { _id: notificationId },
  { 
    status: 'sent',
    sentAt: new Date()
  }
);
// Risk: Never know if actually delivered
```

**2. Client-Side Callback**
```javascript
// Service Worker (client)
self.addEventListener('push', event => {
  event.waitUntil(
    self.registration.showNotification(data.title).then(() => {
      // Notify server of delivery
      fetch('/api/notifications/delivery', {
        method: 'POST',
        body: JSON.stringify({
          notificationId: data.id,
          status: 'delivered'
        })
      }).catch(e => console.error('Delivery report failed:', e));
    })
  );
});

// Backend handler
app.post('/api/notifications/delivery', (req, res) => {
  db.notifications.updateOne(
    { _id: ObjectId(req.body.notificationId) },
    { 
      status: 'delivered',
      deliveredAt: new Date()
    }
  );
});
```

**3. Time-Based Assumption**
```javascript
// Mark as delivered after X seconds if sent
setTimeout(async () => {
  const notif = await db.notifications.findOne({ _id: notificationId });
  if (notif.status === 'sent') {
    await db.notifications.updateOne(
      { _id: notificationId },
      { 
        status: 'delivered',
        deliveredAt: new Date()
      }
    );
  }
}, 5000); // 5 seconds
```

### Engagement Tracking

Track user interactions with notifications:

**Click Tracking:**
```javascript
// Service Worker (client)
self.addEventListener('notificationclick', event => {
  event.notification.close();

  // Notify server of click
  fetch('/api/notifications/' + event.notification.tag + '/click', {
    method: 'POST',
    body: JSON.stringify({ action: event.action })
  });

  // Handle notification action
  event.waitUntil(
    clients.matchAll({ type: 'window' }).then(clientList => {
      // Focus or open window
    })
  );
});

// Backend handler
app.post('/api/notifications/:id/click', (req, res) => {
  db.notifications.updateOne(
    { _id: ObjectId(req.params.id) },
    {
      status: 'clicked',
      clickedAt: new Date(),
      action: req.body.action
    }
  );
  res.json({ success: true });
});
```

**Dissmissal Tracking:**
```javascript
// In service worker
self.addEventListener('notificationclose', event => {
  fetch('/api/notifications/' + event.notification.tag + '/dismiss', {
    method: 'POST'
  });
});
```

### Metrics & Analytics

**Key Metrics:**
```javascript
// Per user
{
  userId,
  sent: 1000,           // Total sent
  delivered: 950,       // Actually reached device
  clicked: 285,         // User clicked
  dismissed: 665,       // User closed without clicking
  bounced: 50,          // Invalid tokens
  
  // Rates
  deliveryRate: 0.95,   // delivered / sent
  engagementRate: 0.30, // clicked / delivered
  dismissRate: 0.70     // dismissed / delivered
}

// Per notification
{
  _id: objectId,
  userId,
  type: 'promo',
  sendAt: Date,
  status: 'clicked',
  devicesPlatform: { fcm: 450, webPush: 150 },
  metrics: {
    sent: 600,
    delivered: 570,
    clicked: 145,
    dismissed: 425,
    errors: 30
  }
}
```

**Dashboard Queries:**
```javascript
db.notifications.aggregate([
  {
    $group: {
      _id: {
        date: { $dateToString: { format: '%Y-%m-%d', date: '$sentAt' } },
        type: '$type'
      },
      sent: { $sum: 1 },
      clicked: { $sum: { $cond: [{ $eq: ['$status', 'clicked'] }, 1, 0] } },
      delivered: { $sum: { $cond: [{ $in: ['$status', ['delivered', 'clicked']] }, 1, 0] } }
    }
  }
]);
```

---

## Real-World Applications

### E-Commerce: Order Updates

```javascript
// When order shipped
const notification = {
  title: 'Order Shipped!',
  body: 'Your order #12345 is on its way',
  data: {
    orderId: '12345',
    trackingUrl: '/order/12345/track',
    type: 'order_shipped'
  },
  tag: 'order_12345',  // Replace previous about this order
  icon: '/logo.png',
  badge: '/badge.png'
};

// Send to all user's devices
const devices = await db.devices.find({ userId });
for (const device of devices) {
  if (device.platform === 'fcm') {
    await adminMessaging.send({
      token: device.token,
      notification,
      data: notification.data
    });
  } else {
    await webpush.sendNotification(
      JSON.parse(device.subscription),
      JSON.stringify(notification)
    );
  }
}
```

### Social: Friend Requests

```javascript
// When user receives friend request
const notification = {
  title: 'New Friend Request',
  body: 'Alice wants to be your friend',
  data: {
    fromUserId: 'alice_id',
    fromName: 'Alice',
    type: 'friend_request'
  },
  tag: 'friend_request_alice',
  requireInteraction: true,  // Keep until dismissed
  actions: [
    { action: 'accept', title: 'Accept' },
    { action: 'decline', title: 'Decline' }
  ]
};

// Service worker handles actions
self.addEventListener('notificationclick', event => {
  if (event.action === 'accept') {
    fetch('/api/friends/accept', {
      method: 'POST',
      body: JSON.stringify({ fromUserId: 'alice_id' })
    });
  }
});
```

### Messaging: Chat Notifications

**Challenge:** User might have multiple chats open, some on desktop/mobile

```javascript
// Batching approach
const unreadMessages = await db.messages.find({
  recipientId: userId,
  read: false
});

if (unreadMessages.length === 1) {
  // Single message: show conversation
  notification = {
    title: unreadMessages[0].senderName,
    body: unreadMessages[0].text,
    tag: 'conversation_' + unreadMessages[0].conversationId
  };
} else {
  // Multiple: show digest
  notification = {
    title: 'New Messages',
    body: `You have ${unreadMessages.length} unread messages`,
    tag: 'messages_digest'
  };
}
```

---

## Common Mistakes & Prevention

### Mistake #1: Not Handling Token Invalidity

**The Problem:**
```javascript
// WRONG: Assumes token always works
app.post('/send', (req, res) => {
  const { token, message } = req.body;
  admin.messaging().send({
    token,
    notification: { body: message }
  });
  res.json({ sent: true });
  // What if token is invalid? No error handling!
});
```

**The Solution:**
```javascript
// RIGHT: Handle errors and clean up
app.post('/send', async (req, res) => {
  const { token, message } = req.body;
  
  try {
    await admin.messaging().send({
      token,
      notification: { body: message }
    });
    res.json({ sent: true });
  } catch (error) {
    if (error.code === 'messaging/invalid-registration-token') {
      // Remove invalid token
      await db.devices.deleteOne({ token });
      return res.status(410).json({
        error: 'Device token invalid',
        removed: true
      });
    }
    throw error;
  }
});
```

### Mistake #2: Sending Unencrypted Tokens Over HTTP

**The Problem:**
```javascript
// WRONG: Token sent unencrypted
fetch('http://backend.example.com/register', {
  method: 'POST',
  body: JSON.stringify({
    deviceToken: fcmToken  // Sniffable on HTTP!
  })
});
```

**The Solution:**
```javascript
// RIGHT: Use HTTPS and secure transmission
fetch('https://backend.example.com/register', {
  method: 'POST',
  headers: {
    'Authorization': 'Bearer ' + jwtToken,
    'Content-Type': 'application/json'
  },
  body: JSON.stringify({
    platform: 'fcm',
    token: fcmToken
  })
});
```

### Mistake #3: Same Notification to All Devices

**The Problem:**
```javascript
// WRONG: Sends duplicate to both app and web
const devices = await db.devices.find({ userId });
for (const device of devices) {
  await sendNotification(device, notification);
}
// User sees "New message" twice - once on phone, once in browser
```

**The Solution:**
```javascript
// RIGHT: Dedup or consolidate
// Option 1: Use tags to replace
notification.tag = 'new_message';  // Latest replaces older ones

// Option 2: Send only to one device if multiple devices online
const onlineDevices = devices.filter(d => d.lastSeenAt > Date.now() - 30000);
const targetDevice = onlineDevices.length > 0 
  ? onlineDevices[0]  // Only send to most recently active
  : devices[0];       // Or most recently registered
```

### Mistake #4: Storing Tokens Without User Association

**The Problem:**
```javascript
// WRONG: No access control
db.devices.insertOne({
  token: fcmToken
  // No userId! Anyone who finds the token can use it
});
```

**The Solution:**
```javascript
// RIGHT: Verify ownership
db.devices.insertOne({
  userId: ObjectId(req.user.id),  // User who registered it
  platform: 'fcm',
  token: fcmToken,
  registeredAt: new Date(),
  registeredIp: req.ip,
  userAgent: req.headers['user-agent']
});

// Later enforcement
app.post('/send/:deviceId', verifyToken, (req, res) => {
  const device = await db.devices.findOne({
    _id: ObjectId(req.params.deviceId),
    userId: ObjectId(req.user.id)  // Verify ownership
  });
  
  if (!device) {
    return res.status(403).json({ error: 'Not your device' });
  }
  // Send...
});
```

### Mistake #5: No Rate Limiting on Notification Endpoints

**The Problem:**
```javascript
// WRONG: Open to abuse
app.post('/notifications/send', verifyToken, (req, res) => {
  // Attacker phones sends 10k notifications per minute
  // Drains other users' batteries
});
```

**The Solution:**
```javascript
// RIGHT: Rate limit with different levels
const strictLimit = rateLimit({
  windowMs: 60 * 1000,  // 1 minute
  max: 10,              // 10 per minute
  keyGenerator: (req) => req.user.id  // Per user
});

const batchLimit = rateLimit({
  windowMs: 60 * 60 * 1000,  // 1 hour  
  max: 5,                     // 5 batch requests per hour
  keyGenerator: (req) => req.user.id
});

app.post('/send', verifyToken, strictLimit, (req, res) => {
  // Single notification
});

app.post('/send-batch', verifyToken, batchLimit, (req, res) => {
  // Batch send (more restricted)
});
```

### Mistake #6: Ignoring Platform Differences

**The Problem:**
```javascript
// WRONG: Uses FCM structure for Web Push
const notification = {
  notification: {
    title: 'Test',
    body: 'Test'
  },
  data: {
    orderId: '123',
    //...
  }
};

// Send to Web Push subscription - format mismatch!
await webpush.sendNotification(subscription, JSON.stringify(notification));
```

**The Solution:**
```javascript
// RIGHT: Different payloads for different platforms
if (device.platform === 'fcm') {
  await admin.messaging().send({
    token: device.token,
    notification: {
      title: 'Test',
      body: 'Test'
    },
    data: {
      orderId: '123'
    }
  });
} else {
  await webpush.sendNotification(
    JSON.parse(device.subscription),
    JSON.stringify({
      title: 'Test',
      body: 'Test',
      data: { orderId: '123' }\n    })
  );
}
```

---

## Best Practices

### 1. **Graceful Degradation**

```javascript
// If notification fails, still update the app state
app.post('/orders/:id/ship', (req, res) => {
  const result = db.orders.updateOne(
    { _id: ObjectId(req.params.id) },
    { status: 'shipped', shippedAt: new Date() }
  );

  // Send notification but don't block response
  sendNotification(order.userId, 'Order shipped')
    .catch(err => logger.error('Notification failed', err));
  
  // Return immediately to client
  res.json(result);
});
```

### 2. **Batch Delivery for Reliability**

```javascript
// Queue notifications instead of sending immediately
const Bull = require('bull');
const notificationQueue = new Bull('notifications');

notificationQueue.process(async (job) => {
  const { device, notification } = job.data;
  return await sendNotification(device, notification);
});

// With retries
notificationQueue.add(
  { device, notification },
  {
    attempts: 3,
    backoff: {
      type: 'exponential',
      delay: 2000
    }
  }
);
```

### 3. **Per-User Notification Preferences**

```javascript
const preferences = await db.userPreferences.findOne({ userId });

// Check if user enabled this notification type
if (!preferences.notifications.promotional) {
  // Don't send marketing notifications
  return;
}

// Check quiet hours
const now = new Date().getHours();
if (preferences.quietHours?.start <= now && now < preferences.quietHours?.end) {
  // Queue for later or send as in-app only
}
```

### 4. **Logging and Monitoring**

```javascript
// Log every notification
app.post('/send', async (req, res) => {
  const notifId = uuid();
  
  logger.info('Notification sent', {
    notificationId: notifId,
    userId: req.user.id,
    type: req.body.type,
    deviceCount: req.body.deviceIds.length,
    timestamp: new Date()
  });

  // Also send to monitoring service
  metrics.increment('notifications.sent', {
    type: req.body.type,
    platform: req.body.platform
  });
});
```

### 5. **Testing Notifications**

```javascript
// Test endpoint 
app.post('/test-notification', verifyToken, (req, res) => {
  const devices = await db.devices.find({ userId: req.user.id });
  
  const notification = {
    title: 'Test Notification',
    body: 'This is a test from ' + new Date().toLocaleTimeString(),
    data: { type: 'test' }
  };

  sendToDevices(devices, notification);
  res.json({ 
    message: 'Test sent to ' + devices.length + ' devices'
  });
});
```
