# Firebase Cloud Messaging - Theory

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
