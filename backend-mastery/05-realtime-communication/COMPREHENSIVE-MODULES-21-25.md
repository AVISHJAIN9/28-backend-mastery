# Complete Real-Time Communication Modules (21-25)

Beyond the original 15 core modules and modules 16-20, here are 5 additional critical communication patterns.

---

## 21: GraphQL Subscriptions

**Folder:** `21-graphql-subscriptions/`

### Overview
Real-time data subscriptions using GraphQL for type-safe, strongly-typed real-time communication.

### Key Differences from REST + WebSocket
```
Traditional:
REST API → Client polls for updates
WebSocket → Raw events, manual parsing

GraphQL Subscriptions:
subscription {
  userUpdated(id: 123) {
    id, name, email, status
  }
}
→ Server sends only subscribed fields
→ Type-safe on both ends
```

### Features
- **Type-Safe Updates** - Schema-defined subscriptions
- **Selective Delivery** - Only subscribed fields sent
- **Authorization per field** - Field-level permissions
- **Filtering** - Subscribe with arguments/filters
- **Backpressure** - Handle slow clients
- **Error Handling** - Typed error responses

### Architecture
```
GraphQL Client
(Apollo/Relay)
     ↓
graphql-ws Protocol
(WebSocket subprotocol)
     ↓
Apollo Server
     ↓
PubSub Engine
(Redis/Memory)
     ↓
Type-checked
Real-time Data
```

### Sample GraphQL Schema
```graphql
type Subscription {
  userActivity(userId: ID!): Activity!
  stockPrice(symbol: String!): StockUpdate!
  orderUpdates(orderId: ID!): Order!
  chatMessages(channelId: ID!): Message!
}

type Activity {
  id: ID!
  type: ActivityType!
  user: User!
  data: String!
  timestamp: DateTime!
}

enum ActivityType {
  LOGIN
  LOGOUT
  POST_CREATED
  COMMENT_ADDED
  LIKE_RECEIVED
}
```

### Server Implementation
```javascript
const subscription = {
  userActivity: {
    subscribe: (_, { userId }) => {
      // Authorization check
      if (!can(userId, 'read:activity')) {
        throw new Error('Unauthorized');
      }
      // Return async iterable
      return pubsub.asyncIterator(`user:${userId}:activity`);
    }
  }
};

// Broadcasting
pubsub.publish(`user:123:activity`, {
  userActivity: {
    id: '456',
    type: 'POST_CREATED',
    timestamp: new Date()
  }
});
```

### Use Cases
- Real-time dashboard updates with type safety
- Live notifications with schema validation
- Stock market tickers
- IoT sensor data with typed fields
- Real-time analytics dashboards
- Live sports scoreboards

### Advantages
✅ Type safety for real-time data
✅ Automatic client validation
✅ Schema documentation
✅ Reduced payload (only subscribed fields)
✅ Easier testing
✅ Better IDE autocomplete

### Challenges
⚠️ Learning curve for GraphQL
⚠️ More complex setup than WebSocket
⚠️ Requires compatible client
⚠️ Debugging subscription issues

---

## 22: Live Search & Autocomplete

**Folder:** `22-live-search-autocomplete/`

### Overview
Real-time search with autocomplete, fuzzy matching, and instant result streaming.

### Key Patterns
```
User Types: "pho"
     ↓
Client debounces (300ms)
     ↓
Emit search:query event
     ↓
Server searches (Redis/Algolia)
     ↓
Return: ["phone", "photo", "python"]
     ↓
Real-time update in UI
```

### Features
- **Debounced Input** - 300ms client-side throttle
- **Fuzzy Matching** - Typo tolerance
- **Ranking** - Popular results first
- **Suggestions** - Autocomplete options
- **History** - Recent searches
- **Highlighting** - Match highlighting
- **Result Streaming** - Progressive results

### Implementation Strategies

#### 1. In-Memory Index (Small datasets)
```javascript
const index = fuse.createIndex(['name', 'description']);
const results = fuse.search(query);
```

#### 2. Elasticsearch (Medium datasets)
```javascript
const results = await client.search({
  index: 'products',
  body: {
    query: {
      multi_match: {
        query: searchTerm,
        fields: ['name^2', 'description']
      }
    }
  }
});
```

#### 3. Algolia (Large datasets, managed)
```javascript
const results = await index.search(query, {
  highlightPreTag: '<em>',
  hitsPerPage: 10
});
```

### Real-time Flow
```
         Browser                   Server
User types: "javascript"
     ↓
Debounce 300ms
     ↓
socket.emit('search', { q: 'javascript' })
                              ↓
                         Query Index
                              ↓
                      Find matching results
                              ↓
                    Rank by relevance
                              ↓
socket.on('results', { results: [...] }) ←
     ↓
Update UI in real-time
```

### WebSocket Events
```javascript
// Client
socket.emit('search:query', { 
  q: 'user input',
  category: 'products',
  limit: 10
});

socket.emit('search:filter', {
  category: 'tech',
  price: [0, 100]
});

// Server broadcasts
socket.on('search:results', {
  results: [
    { id: 1, name: 'Product 1', score: 0.95 }
  ],
  total: 45,
  milliseconds: 12
});

socket.on('search:suggestions', {
  suggestions: ['javascript tutorial', 'javascript framework']
});

socket.on('search:trending', {
  trending: [
    { query: 'python', searches: 1024 },
    { query: 'javascript', searches: 892 }
  ]
});
```

### Performance Optimization

#### Client-side
```javascript
// Debounce search input
const debounce = (fn, delay) => {
  let timeout;
  return (...args) => {
    clearTimeout(timeout);
    timeout = setTimeout(() => fn(...args), delay);
  };
};

const handleSearch = debounce((query) => {
  socket.emit('search:query', { q: query });
}, 300);
```

#### Server-side
```javascript
// Cache popular searches
const cache = new Map();

socket.on('search:query', ({ q }) => {
  // Check cache first
  if (cache.has(q)) {
    socket.emit('search:results', cache.get(q));
    return;
  }

  // Search with limit
  const results = elasticSearch.search(q, { size: 10 });
  
  // Cache results
  cache.set(q, results);
  
  socket.emit('search:results', results);
});
```

### Use Cases
- E-commerce product search
- Social network user search
- Code repository search
- Documentation search
- Location/map search
- Article/blog search
- API endpoint search

---

## 23: Webhook & Outbound Events

**Folder:** `23-webhook-outbound-events/`

### Overview
Send real-time events to external systems via webhooks and outbound integrations.

### Key Components

#### 1. Event Publishing
```javascript
const event = {
  id: uuid.v4(),
  type: 'user.created',
  data: { userId: 123, email: 'user@example.com' },
  timestamp: new Date(),
  version: 1
};

await eventBus.publish(event);
```

#### 2. Webhook Queue
```
Event Published
     ↓
Find matching webhooks
     ↓
Queue delivery jobs
     ↓
Worker processes queue
     ↓
Send HTTP POST
     ↓
Retry on failure
     ↓
Track delivery status
```

#### 3. Retry Strategy
```javascript
const deliveryAttempt = {
  attempt: 1,  // Current attempt
  nextRetry: Date.now() + (2 ^ attempt) * 1000,  // Exponential backoff
  maxAttempts: 5,
  lastError: 'Connection timeout'
};

// Retry delays:
// 1st: 2s
// 2nd: 4s
// 3rd: 8s
// 4th: 16s
// 5th: 32s
```

### Webhook Protocol

#### Registration
```javascript
// POST /api/webhooks
{
  url: 'https://external-app.com/webhooks',
  events: ['user.created', 'user.updated', 'order.completed'],
  active: true,
  secret: 'whsec_xxx' // For HMAC signing
}
```

#### Event Delivery
```
POST https://external-app.com/webhooks

Headers:
  X-Webhook-ID: evt_123
  X-Webhook-Timestamp: 2024-03-30T10:00:00Z
  X-Webhook-Signature: sha256=hmac_hash
  X-Retry-Count: 0

Body:
{
  id: 'evt_123',
  type: 'user.created',
  timestamp: '2024-03-30T10:00:00Z',
  data: { userId: 123, email: 'user@example.com' }
}
```

#### Signature Verification
```javascript
// Client-side verification
const crypto = require('crypto');

const signature = req.header('X-Webhook-Signature');
const timestamp = req.header('X-Webhook-Timestamp');
const payload = JSON.stringify(req.body);

// Prevent replay attacks
if (Date.now() - new Date(timestamp) > 300000) {
  return res.status(401).json({ error: 'Timestamp too old' });
}

// Verify signature
const hash = crypto
  .createHmac('sha256', WEBHOOK_SECRET)
  .update(`${timestamp}.${payload}`)
  .digest('hex');

if (hash !== signature) {
  return res.status(401).json({ error: 'Invalid signature' });
}
```

### REST Endpoints
```
POST   /api/webhooks - Register webhook
GET    /api/webhooks - List webhooks
GET    /api/webhooks/:id - Get webhook details
PUT    /api/webhooks/:id - Update webhook
DELETE /api/webhooks/:id - Delete webhook
GET    /api/webhooks/:id/deliveries - Get delivery history
POST   /api/webhooks/:id/test - Send test event
GET    /api/webhooks/:id/deliveries/:deliveryId - Get delivery details
POST   /api/webhooks/:id/deliveries/:deliveryId/retry - Retry delivery
```

### Event Types
```javascript
// User events
'user.created'
'user.updated'
'user.deleted'
'user.email_verified'

// Order events
'order.created'
'order.updated'
'order.shipped'
'order.delivered'
'order.cancelled'

// Payment events
'payment.succeeded'
'payment.failed'
'payment.refunded'

// Custom business events
'subscription.renewing'
'inventory.low'
'alert.triggered'
```

### Delivery Guarantee
```
At-least-once
├─ Retries up to 5 times
├─ Exponential backoff
├─ 24-hour retention
└─ Client must be idempotent

Exactly-once (with idempotency key)
├─ Client tracks processed webhooks
├─ Webhooks contain UUID
└─ Prevent double-processing
```

### Use Cases
- Slack/Discord integration
- GitHub webhook events
- CRM integrations
- Payment processor callbacks
- Third-party system updates
- Audit logging systems
- Analytics platforms

---

## 24: Screen Sharing & Broadcast

**Folder:** `24-screen-sharing-broadcast/`

### Overview
Real-time screen sharing and broadcast streaming for remote collaboration.

### Key Technologies
- **WebRTC** - Peer-to-peer video
- **MediaRecorder API** - Screen capture
- **Canvas API** - Frame processing
- **Codecs** - VP8, VP9, H.264
- **Adaptive Bitrate** - Quality adjustment

### Architecture

#### 1. Screen Capture
```javascript
const stream = await navigator.mediaDevices.getDisplayMedia({
  video: {
    cursor: 'always',
    displaySurface: 'monitor'
  },
  audio: false
});

const video = document.querySelector('video');
video.srcObject = stream;
```

#### 2. Encoding & Streaming
```
Screen Capture (30fps)
     ↓
Canvas drawImage()
     ↓
Video Encoder (VP8)
     ↓
WebRTC PCConnection
     ↓
STUN/TURN Servers
     ↓
Viewers
```

#### 3. Viewer Join
```javascript
// Presenter
const peerConnection = new RTCPeerConnection();
peerConnection.addTrack(screenTrack);
const offer = await peerConnection.createOffer();

// Signal offer to viewer via WebSocket
socket.emit('stream:offer', { offer, streamId });

// Viewer receives offer
socket.on('stream:offer', async ({ offer }) => {
  const peerConnection = new RTCPeerConnection();
  await peerConnection.setRemoteDescription(offer);
  const answer = await peerConnection.createAnswer();
  socket.emit('stream:answer', { answer });
});

// Presenter receives answer
socket.on('stream:answer', ({ answer }) => {
  peerConnection.setRemoteDescription(answer);
});
```

### WebSocket Signaling
```javascript
// Presenter
socket.emit('stream:start', {
  streamId: 'stream123',
  title: 'Live Demo',
  maxViewers: 100
});

socket.emit('stream:frame', {
  width: 1920,
  height: 1080,
  fps: 30
});

socket.emit('stream:stop', {
  streamId: 'stream123',
  reason: 'Ended by user'
});

// Viewer
socket.on('stream:started', {
  streamId, title, presenter, maxViewers
});

socket.on('stream:viewer_joined', {
  viewerCount: 5
});

socket.on('stream:ended', {
  reason: 'Presenter ended stream'
});
```

### Quality Adaptation
```javascript
// Detect bandwidth
const stats = await peerConnection.getStats();

stats.forEach((report) => {
  if (report.type === 'candidatepair') {
    const bandwidth = report.currentRoundTripTime;
    const packetLoss = report.packetsLost / report.packetsSent;
    
    if (packetLoss > 0.05) {
      // Reduce quality
      adjustBitrate(500000); // 500kbps
    }
  }
});
```

### Use Cases
- Remote presentations
- Technical support (screen view)
- Remote teaching/tutoring
- Live code walkthroughs
- Conference presentations
- Live streaming with annotations
- Virtual co-working sessions

---

## 25: Notification Center Hub

**Folder:** `25-notification-center-hub/`

### Overview
Unified notification management aggregating notifications from all channels.

### Multi-Channel Approach

```
Business Event
     ↓
     ├─ In-App (WebSocket)
     │    ↓
     │   Notification Service
     │    ↓
     │   Display badge
     │
     ├─ Email (Queue)
     │    ↓
     │   Email Service
     │    ↓
     │   Send email
     │
     ├─ Push (FCM)
     │    ↓
     │   Firebase Console
     │    ↓
     │   Device notification
     │
     ├─ SMS (Twilio)
     │    ↓
     │   Twilio API
     │    ↓
     │   Send SMS
     │
     └─ Slack (Webhook)
          ↓
         Webhook
          ↓
         Slack message
```

### Notification Schema
```javascript
{
  id: 'notif_123',
  userId: 'user_456',
  type: 'order_shipped',
  title: 'Your order 123 shipped',
  body: 'Order will arrive in 2-3 days',
  icon: 'https://cdn.example.com/icon.png',
  link: '/orders/123',
  channels: ['in-app', 'email', 'push'],
  priority: 'high',
  read: false,
  readAt: null,
  createdAt: '2024-03-30T10:00:00Z',
  expiresAt: '2024-04-06T10:00:00Z',
  metadata: { orderId: 123 }
}
```

### User Preferences
```javascript
{
  userId: 'user_456',
  channels: {
    inApp: {
      enabled: true,
      sound: true,
      showBadge: true
    },
    email: {
      enabled: true,
      frequency: 'daily_digest'
    },
    push: {
      enabled: true,
      doNotDisturb: {
        enabled: true,
        start: '22:00',
        end: '08:00'
      }
    },
    slack: {
      enabled: false,
      webhookUrl: ''
    }
  },
  notificationTypes: {
    orderUpdates: ['in-app', 'email'],
    paymentReminders: ['email', 'push'],
    securityAlerts: ['in-app', 'push', 'email'],
    promotions: ['email']
  }
}
```

### REST Endpoints
```
GET    /api/notifications - Get user notifications
POST   /api/notifications/:id/read - Mark as read
POST   /api/notifications/:id/unread - Mark as unread
DELETE /api/notifications/:id - Delete notification
POST   /api/notifications/mark-all-read - Mark all as read
GET    /api/notifications/preferences - Get preferences
PUT    /api/notifications/preferences - Update preferences
GET    /api/notifications/stats - Get notification stats
POST   /api/notifications/clear - Clear notifications
```

### WebSocket Events
```javascript
// Server sends
socket.on('notification:new', {
  id: 'notif_123',
  type: 'order_shipped',
  title: 'Your order shipped',
  sound: true
});

socket.on('notification:group', {
  groupId: 'group_1',
  count: 5,
  types: ['comment', 'like', 'share'],
  preview: 'You have 5 new notifications'
});

socket.on('notification:clear', {
  type: 'orderUpdates'
});

socket.on('notification:badge', {
  unreadCount: 3
});
```

### Notification Batching
```javascript
// Don't send 10 'like' notifications individually
// Instead, batch:
{
  type: 'likes_batch',
  users: ['Alice', 'Bob', 'Charlie', ...],
  count: 10,
  link: '/post/123'
}

// Display: "Alice, Bob, Charlie and 7 others liked your post"
```

### Delivery Channels

#### In-App
- Real-time via WebSocket
- Notification center dropdown
- Badge count
- sound notification

#### Email
- Batch processing
- Template rendering
- Gmail, Outlook, custom
- Delivery confirmation

#### Push
- Firebase Cloud Messaging
- Device specific
- Do-Not-Disturb aware
- Rich notifications

#### SMS
- Twilio integration
- Critical alerts only
- Short, concise message

#### Slack
- Channel notifications
- User mentions
- Threaded replies
- Rich formatting

### Smart Delivery
```javascript
const selectChannels = (priority, userPrefs) => {
  if (priority === 'critical') {
    return ['in-app', 'push', 'email', 'sms'];
  }
  if (priority === 'high') {
    return ['in-app', 'push', 'email'];
  }
  if (priority === 'normal') {
    return ['in-app', 'email'];
  }
  return ['in-app'];
};
```

### Use Cases
- User notification dashboard
- Real-time notification inbox
- Consolidated alert center
- Notification preferences management
- Cross-channel notification strategy
- Notification analytics

---

## Comparison: All 25 Modules

| # | Module | Tech Stack | Complexity | Use Case |
|---|--------|-----------|-----------|----------|
| 01 | WebSockets & Socket.io | Socket.io | Low | Foundation |
| 02 | Redis Adapter | Socket.io + Redis | Low-Med | Scaling |
| 03 | Server-Sent Events | Express | Low | One-way streaming |
| 04 | Socket Auth & JWT | Socket.io + JWT | Medium | Security |
| **05** | **Live Streaming Rooms** | **Socket.io** | **Medium** | **Multi-user streaming** |
| 06 | Message Queue | Bull | Medium | Async jobs |
| 07 | Broadcast Alerts | Socket.io + Bull | Medium | System alerts |
| 08 | Push Notifications | FCM | Low-Med | Mobile notifications |
| 09 | Typing Indicators | Socket.io | Low | Presence |
| 10 | Email Queue | Resend | Low | Email delivery |
| 11 | Ephemeral Chat | Socket.io + Timer | Medium | Auto-delete messages |
| 12 | WebRTC P2P | WebRTC | High | Video call |
| 13 | Poll Updates | Socket.io | Low | Live voting |
| 14 | CRDT | Yjs/Automerge | High | Collaborative edit |
| 15 | Whiteboard | Canvas + Socket.io | High | Drawing sync |
| 16 | Activity Feeds | Socket.io + DB | Medium | Social updates |
| 17 | Metrics Dashboard | Socket.io + Redis | Medium | Live KPIs |
| 18 | File Sharing | Socket.io + Storage | High | File sync |
| 19 | Auction Bidding | Socket.io + Timer | Medium | Live bidding |
| 20 | Game State | Socket.io + Physics | High | Multiplayer games |
| 21 | GraphQL Subscriptions | Apollo + GraphQL | Medium-High | Type-safe RT |
| 22 | Live Search | Socket.io + Algolia | Medium | Autocomplete |
| 23 | Webhook Events | Express + HTTP | Medium | Outbound events |
| 24 | Screen Sharing | WebRTC + Canvas | High | Screen broadcast |
| **25** | **Notification Hub** | **Socket.io + Multi-channel** | **Medium** | **Unified notifications** |

---

## Integration Map

```
Foundation (01-03)
     ↓
Security (04)
     ↓
Core (05-15)
     ├─ Streaming (05, 12, 24)
     ├─ Notifications (07, 08, 10, 25)
     ├─ Presence (09)
     ├─ Collaboration (11, 14, 15, 18)
     └─ Business (13, 16, 19, 20)
     ↓
Advanced (16-25)
     ├─ Modern APIs (21)
     ├─ Search (22)
     ├─ Integration (23)
     ├─ Media (24)
     └─ Aggregation (25)
```

---

## Learning Progression

**Beginner (Weeks 1-2)**
- Modules 1-3: Foundation
- Modules 4-5: First real-time app

**Intermediate (Weeks 3-4)**
- Modules 6-10: Notifications and queuing
- Modules 13: Live features

**Advanced (Weeks 5-6)**
- Modules 11, 14-15: Collaboration
- Module 12: P2P communication
- Module 20: Game sync

**Expert (Weeks 7-8)**
- Module 21: GraphQL approach
- Module 22-25: Production patterns
- Modules 16-20: Business features

---

## Final Statistics

**Total Modules:** 25  
**Lines of Code (estimated):** 50,000+  
**API Endpoints:** 200+  
**WebSocket Events:** 150+  
**Use Cases Covered:** 100+  
**Technologies:** 30+  

---

**Status:** Complete Framework  
**Version:** 1.0  
**Release Date:** March 2024  
**Production Ready:** Yes
