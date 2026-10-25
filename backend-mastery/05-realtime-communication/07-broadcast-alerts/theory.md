# Broadcast Alerts - Theory

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
