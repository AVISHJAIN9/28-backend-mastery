# Push Notifications Module - Firebase Cloud Messaging & Web Push API

## Overview

This module implements a production-ready push notification system with support for both **Firebase Cloud Messaging (FCM)** for mobile apps and **Web Push API** for browsers. Learn how to register devices, send notifications, track delivery, and measure engagement.

### What You'll Learn

- ✅ Device token registration and lifecycle management
- ✅ Sending notifications to single/multiple devices
- ✅ Platform-agnostic notification handling (FCM + Web Push)
- ✅ VAPID key generation for Web Push security
- ✅ Delivery tracking and engagement metrics
- ✅ Error handling and invalid token cleanup
- ✅ Rate limiting to prevent notification spam
- ✅ Real-world patterns and production best practices

### Key Features

| Feature | Description |
|---------|-------------|
| **Multi-Platform** | FCM (Android/iOS) + Web Push (Browsers) |
| **Token Management** | Register, validate, unsubscribe devices |
| **Batch Sending** | Send to 1-1000 devices in single request |
| **Delivery Tracking** | Track sent/delivered/clicked metrics |
| **Engagement Stats** | Dashboard with delivery & engagement rates |
| **Security** | JWT auth, token validation, rate limiting |
| **Error Recovery** | Automatic cleanup of invalid tokens |

---

## Quick Start

### 1. Install Dependencies

```bash
npm install express jsonwebtoken express-rate-limit winston dotenv
```

### 2. Environment Setup

Create `.env` file:

```bash
JWT_SECRET=your-secret-key-change-in-production
NODE_ENV=development
HTTP_PORT=4003
```

### 3. Generate Test JWT Token

```bash
# For testing - use this token in Authorization headers
jwt.sign({ id: 1, email: 'alice@test.com', role: 'user' }, 'your-secret-key-change-in-production')
# Returns: eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpZCI6MSwiZW1haWwiOiJhbGljZUB0ZXN0LmNvbSIsInJvbGUiOiJ1c2VyIn0.sig...
```

### 4. Start Server

```bash
node server.js
# Listening on http://localhost:4003
```

### 5. Test Registration Endpoint

```bash
curl -X POST http://localhost:4003/api/devices/register \
  -H "Authorization: Bearer YOUR_JWT_TOKEN" \
  -H "Content-Type: application/json" \
  -d '{
    "platform": "fcm",
    "token": "cNf4pT7sL9mKx3bQ6vY2aZ8wH1jE5gR4tU0dP3oN6sL"
  }'

# Response:
# {
#   "message": "Device registered successfully",
#   "deviceId": "device_1001",
#   "platform": "fcm"
# }
```

---

## API Endpoints

### Device Management

#### Register Device
```http
POST /api/devices/register
Authorization: Bearer <JWT_TOKEN>
Content-Type: application/json

# FCM Token
{
  "platform": "fcm",
  "token": "cNf4pT7sL9mKx3bQ6vY2aZ8wH1jE5gR4tU0dP3oN6sL"
}

# OR Web Push Subscription
{
  "platform": "web-push",
  "endpoint": "https://fcm.googleapis.com/fcm/send/...",
  "p256dh": "BLfm7YzV...",
  "auth": "bTKn5Y..."
}

# Response: 201 Created
{
  "message": "Device registered successfully",
  "deviceId": "device_1001",
  "platform": "fcm"
}
```

#### Get All Devices
```http
GET /api/devices
Authorization: Bearer <JWT_TOKEN>

# Response: 200 OK
{
  "userId": 1,
  "deviceCount": 3,
  "devices": [
    {
      "deviceId": "device_1001",
      "platform": "fcm",
      "status": "active",
      "createdAt": "2024-03-20T10:00:00Z",
      "lastUsed": "2024-03-20T15:30:00Z"
    },
    {
      "deviceId": "device_1002",
      "platform": "web-push",
      "status": "active",
      "createdAt": "2024-03-19T08:00:00Z",
      "lastUsed": "2024-03-20T09:00:00Z"
    }
  ]
}
```

#### Unsubscribe Device
```http
POST /api/devices/unsubscribe
Authorization: Bearer <JWT_TOKEN>
Content-Type: application/json

{
  "deviceId": "device_1001"
}

# Response: 200 OK
{
  "message": "Device unsubscribed successfully",
  "deviceId": "device_1001"
}
```

---

### Notification Sending

#### Send to Single Device
```http
POST /api/notifications/send
Authorization: Bearer <JWT_TOKEN>
Content-Type: application/json

{
  "deviceId": "device_1001",
  "title": "New Message",
  "body": "You have a new message from Alice",
  "data": {
    "conversationId": "conv_123",
    "senderId": "user_456"
  },
  "actions": "[\\"reply\\", \\"archive\\"]"
}

# Response: 200 OK
{
  "message": "Notification sent successfully",
  "notificationId": "notif_1001",
  "status": "sent"
}
```

#### Send Batch Notifications
```http
POST /api/notifications/batch
Authorization: Bearer <JWT_TOKEN>
Content-Type: application/json

{
  "deviceIds": ["device_1001", "device_1002", "device_1003"],
  "title": "System Update",
  "body": "Version 2.0 available now",
  "data": {
    "updateUrl": "https://example.com/download"
  }
}

# Response: 200 OK
{
  "message": "Batch notifications sent",
  "sent": 3,
  "failed": 0,
  "notificationIds": ["notif_1001", "notif_1002", "notif_1003"]
}
```

#### Get Notification Logs
```http
GET /api/notifications/logs?limit=50&status=delivered
Authorization: Bearer <JWT_TOKEN>

# Response: 200 OK
{
  "userId": 1,
  "total": 50,
  "logs": [
    {
      "id": "notif_1001",
      "deviceId": "device_1001",
      "platform": "fcm",
      "title": "New Message",
      "body": "You have a message",
      "status": "delivered",
      "sentAt": "2024-03-20T15:30:00Z",
      "deliveredAt": "2024-03-20T15:30:01Z",
      "clickedAt": null
    }
  ]
}
```

#### Track Notification Action
```http
POST /api/notifications/notif_1001/action
Authorization: Bearer <JWT_TOKEN>
Content-Type: application/json

{
  "action": "reply"
}

# Response: 200 OK
{
  "message": "Action recorded",
  "notificationId": "notif_1001",
  "status": "clicked",
  "action": "reply"
}
```

---

### Analytics

#### Get Engagement Statistics
```http
GET /api/stats
Authorization: Bearer <JWT_TOKEN>

# Response: 200 OK
{
  "userId": 1,
  "stats": {
    "sent": 1250,
    "delivered": 1190,
    "clicked": 357,
    "bounced": 60,
    "deliveryRate": 95.2,
    "engagementRate": 30.0
  }
}
```

---

## Common Mistakes & Solutions

### Mistake 1: Using Same Token After App Reinstall

**Problem:**
```javascript
// User reinstalls app - old token invalid
app.post('/send', (req, res) => {
  // Fails silently - user never gets notified
  admin.messaging().send({ token: oldToken, ... });
});
```

**Solution:**
```javascript
// Handle token refresh events
// Mobile app listens for token refresh
messaging.onTokenRefresh(() => {
  const newToken = messaging.getToken();
  fetch('/api/devices/update', {
    method: 'POST',
    body: JSON.stringify({ newToken })
  });
});

// Backend cleans up old tokens
app.delete('/api/devices/token/:oldToken', (req, res) => {
  db.devices.deleteOne({ token: req.params.oldToken });
});
```

### Mistake 2: Sending Notifications Without Checking Platform

**Problem:**
```javascript
// WRONG: Tries to send FCM message on web subscription
const device = await db.devices.findOne({ _id: deviceId });
await admin.messaging().send({
  token: device.token,  // But device is web-push!
  notification: { ... }
});
```

**Solution:**
```javascript
// RIGHT: Branch on platform
const device = await db.devices.findOne({ _id: deviceId });

if (device.platform === 'fcm') {
  await admin.messaging().send({
    token: device.token,
    notification: { title, body },
    data: data
  });
} else if (device.platform === 'web-push') {
  await webpush.sendNotification(
    JSON.parse(device.subscription),
    JSON.stringify({ title, body, data })
  );
}
```

### Mistake 3: Not Handling Delivery Failures

**Problem:**
```javascript
// No error handling - invalid tokens pile up
for (const device of devices) {
  await sendNotification(device, message);
}
// Database full of dead tokens!
```

**Solution:**
```javascript
// RIGHT: Handle errors and cleanup
for (const device of devices) {
  try {
    await sendNotification(device, message);
  } catch (error) {
    if (error.code === 'messaging/invalid-registration-token') {
      // Token is dead, remove it
      await db.devices.deleteOne({ token: device.token });
      logger.info('Removed invalid token', { deviceId: device._id });
    } else {
      // Other errors - log and continue
      logger.error('Notification failed', { error, deviceId: device._id });
    }
  }
}
```

### Mistake 4: Registering Same Token Multiple Times

**Problem:**
```javascript
// Without unique constraint, duplicates pile up
// User opens app 100 times = 100+ identical tokens in DB
// Notifications sent 100+ times to same device!
```

**Solution:**
```javascript
// Database index with unique constraint
db.devices.createIndex(
  { token: 1, endpoint: 1 },
  { unique: true, sparse: true }
);

// App logic: update if exists, insert if new
app.post('/register', (req, res) => {
  db.devices.updateOne(
    { userId: req.user.id, token: req.body.token },
    {
      $set: {
        userId: req.user.id,
        token: req.body.token,
        lastSeen: new Date()
      }
    },
    { upsert: true }
  );
});
```

### Mistake 5: Not Rate Limiting Notification Endpoints

**Problem:**
```javascript
// Attacker registers device and floods with notifications
// Drains battery, uses data, annoys users
app.post('/send', verifyToken, (req, res) => {
  // NO rate limit!
  sendNotification(req.body.deviceId, req.body.message);
});

// Attacker: for (let i=0; i<10000; i++) fetch(/send)
```

**Solution:**
```javascript
// RIGHT: Rate limit
const sendLimiter = rateLimit({
  windowMs: 60 * 1000,      // 1 minute window
  max: 50,                   // 50 requests per minute
  keyGenerator: req => req.user.id, // Per user
  message: 'Too many notifications sent'
});

app.post('/send', verifyToken, sendLimiter, (req, res) => {
  sendNotification(req.body.deviceId, req.body.message);
});
```

### Mistake 6: Ignoring Subscription Difference in Web Push

**Problem:**
```javascript
// FCM structure doesn't work for Web Push
const message = {
  notification: { title, body },
  data: { orderId }
};

// Web Push expects different format
await webpush.sendNotification(subscription, JSON.stringify(message));
// Client receives: { notification: { ... }, data: { ... } }
// But service worker expects: { title, body, data:  { ... } }
```

**Solution:**
```javascript
// RIGHT: Different formats for each platform
if (device.platform === 'fcm') {
  // FCM separates notification from data
  payload = {
    notification: { title, body },
    data: JSON.stringify({ orderId, type: 'order' })
  };
} else {
  // Web Push puts everything in payload
  payload = JSON.stringify({
    title,
    body,
    icon: 'icon.png',
    tag: 'order',
    data: { orderId, type: 'order' }
  });
}
```

---

## Testing Guide

### 1. Register Test Device

```bash
curl -X POST http://localhost:4003/api/devices/register \
  -H "Authorization: Bearer eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9..." \
  -H "Content-Type: application/json" \
  -d '{
    "platform": "fcm",
    "token": "cNf4pT7sL9mKx3bQ6vY2aZ8wH1jE5gR4tU0dP3oN6sL"
  }' | jq
```

**Expected:** Device registered response with `deviceId`

### 2. List All Devices

```bash
curl http://localhost:4003/api/devices \
  -H "Authorization: Bearer eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9..." | jq
```

**Expected:** Array of registered devices with IDs

### 3. Send Notification

```bash
curl -X POST http://localhost:4003/api/notifications/send \
  -H "Authorization: Bearer eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9..." \
  -H "Content-Type: application/json" \
  -d '{
    "deviceId": "device_1001",
    "title": "Test Notification",
    "body": "This is a test message"
  }' | jq
```

**Expected:** Notification sent response with `notificationId`

### 4. View Notification Logs

```bash
curl "http://localhost:4003/api/notifications/logs?limit=10" \
  -H "Authorization: Bearer eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9..." | jq
```

**Expected:** Array of notifications with status and timestamps

### 5. View Engagement Stats

```bash
curl http://localhost:4003/api/stats \
  -H "Authorization: Bearer eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9..." | jq
```

**Expected:** Delivery and engagement rates

### 6. Track Notification Click

```bash
curl -X POST http://localhost:4003/api/notifications/notif_1001/action \
  -H "Authorization: Bearer eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9..." \
  -H "Content-Type: application/json" \
  -d '{ "action": "opened" }' | jq
```

**Expected:** Action recorded response

---

## Error Codes Reference

| Code | Status | Meaning | Solution |
|------|--------|---------|----------|
| `NO_TOKEN` | 401 | Missing Authorization header | Add `Authorization: Bearer <token>` |
| `INVALID_TOKEN` | 401 | Expired or invalid JWT | Get new token |
| `INVALID_PLATFORM` | 400 | Platform not 'fcm' or 'web-push' | Fix platform value |
| `INVALID_FCM_TOKEN` | 400 | Token too short or invalid format | Verify token from Firebase |
| `INVALID_ENDPOINT` | 400 | Web Push endpoint missing | Include endpoint from subscription |
| `MISSING_SUBSCRIPTION_KEYS` | 400 | Web Push p256dh or auth missing | Get keys from subscription.keys |
| `INVALID_KEY_FORMAT` | 400 | Keys not base64 encoded | Ensure base64 encoding |
| `INVALID_TITLE` | 400 | Title missing or empty | Add non-empty title |
| `INVALID_BODY` | 400 | Body missing or empty | Add non-empty body |
| `TITLE_TOO_LONG` | 400 | Title exceeds 200 chars | Shorten to ≤200 chars |
| `BODY_TOO_LONG` | 400 | Body exceeds 4000 chars | Shorten to ≤4000 chars |
| `DEVICE_NOT_FOUND` | 404 | Device ID doesn't exist | Register device first |
| `DEVICE_INACTIVE` | 400 | Device unsubscribed | Register new device |
| `FORBIDDEN` | 403 | Device belongs to different user | Use your own devices |
| `TOO_MANY_DEVICES` | 400 | Batch > 1000 devices | Split into smaller batches |
| `INTERNAL_ERROR` | 500 | Server error | Check logs |

---

## Architecture Diagram

```
┌─────────────────────────────────────┐
│      Client Application             │
│  (Mobile App / Web Browser)         │
└──────────────┬──────────────────────┘
               │
         ┌─────▼─────┐
         │ Platform  │
         │ SDK       │
         │(FCM/WP)   │
         └─────┬─────┘
               │
    ┌──────────┤
    │          │
    │    ┌─────▼────────────────┐
    │    │ Device Token Store   │
    │    │ per user:            │
    │    │ - Platform           │
    │    │ - Token/Endpoint     │
    │    │ - Subscription info  │
    │    └─────┬────────────────┘
    │          │
    │    ┌─────▼──────────────────────┐
    │    │  API Endpoints             │
    │    │  /api/devices/*            │
    │    │  /api/notifications/*      │
    │    │  /api/stats                │
    │    └─────┬──────────────────────┘
    │          │
    │    ┌─────▼──────────────┐
    │    │  Middleware        │
    │    │  - Auth            │
    │    │  - Validation      │
    │    │  - Rate Limiting   │
    │    └─────┬──────────────┘
    │          │
    │    ┌─────▼──────────────┐
    │    │  Notification      │
    │    │  Controller        │
    │    │  - Send            │
    │    │  - Batch           │
    │    │  - Track           │
    │    └─────┬──────────────┘
    │          │
    └──────────┼──────────────┐
               │              │
        ┌──────▼────┐   ┌─────▼──────┐
        │ Firebase   │   │ Web Push   │
        │ Cloud      │   │ Service    │
        │ Messaging  │   │            │
        └────────────┘   └────────────┘
```

---

## Real-World Use Cases

### E-Commerce: Order Notifications
- Register device on app install
- Send notification when order ships
- Track if user opened notification
- Adjust notification frequency based on engagement

### Social Apps: Friend Requests
- Use batch endpoint to notify multiple mutual friends
- Include action buttons (Accept/Decline)
- Track which actions users take
- Increase notifications for active users

### Messaging: Chat Alerts
- Send notification only if app isn't open
- Use tags to replace old chat notifications
- Track message read rates
- Implement notification batching for quiet hours

---

## Production Checklist

- [ ] Replace in-memory storage with MongoDB/PostgreSQL
- [ ] Implement token refresh/rotation every 90 days
- [ ] Add monitoring/alerting for delivery rates
- [ ] Configure VAPID keys for Web Push
- [ ] Implement retry logic with exponential backoff
- [ ] Add database indexes for userId + token
- [ ] Set up audit logging for sensitive operations
- [ ] Implement graceful failures when notification fails
- [ ] Test error handling for invalid tokens
- [ ] Set notification rate limits per user tier
- [ ] Configure CORS for web push domain
- [ ] Implement notification scheduling for quiet hours

---

## Further Learning

- [Firebase Cloud Messaging Docs](https://firebase.google.com/docs/cloud-messaging)
- [Web Push API Specification](https://www.w3.org/TR/push-api/)
- [VAPID Specification](https://datatracker.ietf.org/doc/html/draft-thomson-webpush-vapid)
- [Service Workers API](https://developer.mozilla.org/en-US/docs/Web/API/Service_Worker_API)
- [Notification API](https://developer.mozilla.org/en-US/docs/Web/API/Notification)
