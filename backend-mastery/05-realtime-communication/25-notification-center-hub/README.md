# 25: Notification Center Hub

## Module Under Construction

Unified notification management center aggregating notifications from all channels.

### What You'll Learn
- Notification aggregation
- Multi-channel notification system
- User notification preferences
- Notification grouping and batching
- Read/unread tracking
- Notification expiration
- Priority levels

### Key Features
- In-app notification center
- Email notifications
- Push notifications
- SMS notifications
- Slack/Teams integration
- Notification preferences panel
- Do-not-disturb modes
- Notification history

### Use Cases
- User notification dashboard
- Real-time notification inbox
- Consolidated alert center
- Notification preferences UI
- Cross-channel notification strategy
- Notification delivery analytics

### Notification Flow
```
Event Triggered
     ↓
Notification Service
     ↓
├─ In-App (WebSocket)
├─ Email (Queue)
├─ SMS (Provider)
├─ Push (FCM)
└─ Slack (Webhook)
     ↓
User Preferences Applied
     ↓
Delivered to User
```

### REST API
```
GET    /api/notifications - Get user notifications
PUT    /api/notifications/:id/read - Mark as read
DELETE /api/notifications/:id - Delete notification
GET    /api/notifications/preferences - Get preferences
PUT    /api/notifications/preferences - Update preferences
GET    /api/notifications/stats - Get notification stats
```

### WebSocket Events
```javascript
socket.on('notification:new', { id, type, data })
socket.on('notification:group', { groupId, count })
socket.on('notification:clear', { type })
```

### Notification Schema
```
{
  id, userId, type,
  title, body, icon,
  read, readAt,
  channel: ['in-app', 'email', 'push'],
  priority: ['low', 'normal', 'high'],
  expiresAt, createdAt
}
```

---

**Module:** 25 of 25  
**Difficulty:** Medium  
**Prerequisites:** Modules 1-10, Multi-channel experience
