#!/usr/bin/env python3
"""Fill in setup.md files for modules 03-15"""

import os

BASE = "/Users/avishjain/Downloads/backend-mastery/05-realtime-communication"

SETUP_CONTENT = {
    "03-sse-server-sent-events": """# Server-Sent Events - Setup Guide

## Installation
```bash
npm install express cors axios
```

## Environment Variables
```env
PORT=4000
NODE_ENV=development
```

## How to run

### Server
```bash
node server.js
```

### Client
```javascript
const eventSource = new EventSource('/api/stream?userId=user1');
eventSource.addEventListener('message', (e) => console.log(e.data));
```

## How to test
```bash
# Test broadcast
curl -X POST http://localhost:4000/api/broadcast \\
  -H "Content-Type: application/json" \\
  -d '{"event":"update","data":{"msg":"hello"}}'
```""",
    
    "04-socket-auth-jwt-handshake": """# Socket Auth & JWT - Setup Guide

## Installation
```bash
npm install socket.io jsonwebtoken 
```

## Environment Variables
```env
PORT=4000
JWT_SECRET=your-secret-key
NODE_ENV=development
```

## How to run
```bash
node server.js
```

## How to test
```bash
# Get token
curl -X POST http://localhost:4000/api/login \\
  -d '{"userId":"user123"}' -H "Content-Type: application/json"

# Connect with token in client
socket = io('http://localhost:4000', {
  auth: { token: 'JWT_TOKEN_HERE' }
});
```""",

    "05-live-streaming-rooms": """# Live Streaming Rooms - Setup Guide

## Installation
```bash
npm install socket.io express
```

## Environment Variables
```env
PORT=4000
NODE_ENV=development
```

## How to run
```bash
node server.js
```

## How to test
```bash
# Create room
curl -X POST http://localhost:4000/api/rooms \\
  -d '{"id":"room1","name":"Live Stream"}' \\
  -H "Content-Type: application/json"

# List rooms
curl http://localhost:4000/api/rooms
```""",

    "06-message-queue-bullmq": """# Message Queue - Bull/BullMQ - Setup Guide

## Installation
```bash
npm install bullmq redis
npm install --save-dev @types/node
```

## Environment Variables
```env
REDIS_URL=redis://localhost:6379
PORT=4000
```

## How to run

### Start Redis
```bash
redis-server
```

### Start worker
```bash
node worker.js
```

### Start API
```bash
node server.js
```

## How to test
```bash
curl -X POST http://localhost:4000/api/jobs \\
  -d '{"type":"email","data":{"to":"user@example.com"}}' \\
  -H "Content-Type: application/json"
```""",

    "07-broadcast-alerts": """# Broadcast Alerts - Setup Guide

## Installation
```bash
npm install socket.io express
```

## Environment Variables
```env
PORT=4000
NODE_ENV=development
```

## How to run
```bash
node server.js
```

## How to test
```bash
# Broadcast alert
curl -X POST http://localhost:4000/api/broadcast \\
  -d '{"title":"Alert","message":"Test","severity":"warning"}' \\
  -H "Content-Type: application/json"
```""",

    "08-push-notifications-fcm": """# Push Notifications - Firebase FCM - Setup Guide

## Installation
```bash
npm install firebase-admin
```

## Environment Variables
```env
PORT=4000
GOOGLE_APPLICATION_CREDENTIALS=/path/to/serviceAccountKey.json
```

## How to run
```bash
node server.js
```

## Setup Firebase
1. Create Firebase project
2. Download service account key
3. Set GOOGLE_APPLICATION_CREDENTIALS

## How to test
```bash
# Send push notification
curl -X POST http://localhost:4000/api/push/send \\
  -d '{"deviceToken":"FCM_TOKEN","notification":{"title":"Hello"}}' \\
  -H "Content-Type: application/json"
```""",

    "09-typing-indicators-presence": """# Typing Indicators & Presence - Setup Guide

## Installation
```bash
npm install socket.io redis
```

## Environment Variables
```env
PORT=4000
REDIS_URL=redis://localhost:6379
```

## How to run
```bash
node server.js
```

## How to test
```javascript
socket.emit('typing:start', {roomId: 'room1'});
setTimeout(() => socket.emit('typing:stop'), 3000);

socket.on('user:typing', (data) => console.log(data));
```""",

    "10-email-queue-resend": """# Email Queue - Resend - Setup Guide

## Installation
```bash
npm install resend
```

## Environment Variables
```env
RESEND_API_KEY=your_api_key
PORT=4000
```

## How to run
```bash
node server.js
```

## How to test
```bash
curl -X POST http://localhost:4000/api/send \\
  -d '{"to":"user@example.com","subject":"Test","html":"<p>Hello</p>"}' \\
  -H "Content-Type: application/json"
```""",

    "11-ephemeral-chat-disappearing": """# Ephemeral Chat - Disappearing Messages - Setup Guide

## Installation
```bash
npm install socket.io redis
```

## Environment Variables
```env
PORT=4000
REDIS_URL=redis://localhost:6379
```

## How to run
```bash
node server.js
```

## How to test
```javascript
socket.emit('message:ephemeral', {
  content: 'Secret message',
  ttl: 60
});
```""",

    "12-webrtc-peer-to-peer": """# WebRTC - Peer-to-Peer - Setup Guide

## Installation
```bash
npm install socket.io simple-peer wrtc
```

## Environment Variables
```env
PORT=4000
STUN_SERVER=stun:stun.l.google.com:19302
TURN_SERVER=turn:turnserver.com
```

## How to run
```bash
node server.js
```

## How to test
```javascript
const peer = new SimplePeer({ initiator: true, stream });
peer.on('signal', (data) => socket.emit('signal', data));
socket.on('signal', (data) => peer.signal(data));
```""",

    "13-poll-real-time-updates": """# Poll - Real-Time Updates - Setup Guide

## Installation
```bash
npm install socket.io express
```

## Environment Variables
```env
PORT=4000
NODE_ENV=development
```

## How to run
```bash
node server.js
```

## How to test
```bash
# Create poll
curl -X POST http://localhost:4000/api/polls \\
  -d '{"question":"Favorite?","options":["A","B"]}' \\
  -H "Content-Type: application/json"

# Vote
curl -X POST http://localhost:4000/api/polls/poll1/vote \\
  -d '{"option":"A"}' \\
  -H "Content-Type: application/json"
```""",

    "14-crdt-collaborative-editing": """# CRDT - Collaborative Editing - Setup Guide

## Installation
```bash
npm install socket.io yjs y-websocket
```

## Environment Variables
```env
PORT=4000
NODE_ENV=development
```

## How to run
```bash
node server.js
```

## How to test
```javascript
const ydoc = new Y.Doc();
const ytext = ydoc.getText('shared-text');
ytext.observe(event => console.log('Changed:', event));
ytext.insert(0, 'Hello');
```""",

    "15-collaborative-whiteboard": """# Collaborative Whiteboard - Setup Guide

## Installation
```bash
npm install socket.io canvas
```

## Environment Variables
```env
PORT=4000
NODE_ENV=development
```

## How to run
```bash
node server.js
```

## How to test
Connect multiple users and draw on the shared canvas. All users see the drawings in real-time.
"""
}

for module_dir, content in SETUP_CONTENT.items():
    setup_path = f"{BASE}/{module_dir}/setup.md"
    with open(setup_path, 'w') as f:
        f.write(content)
    print(f"✓ Updated {module_dir}/setup.md")

print("\n✅ All setup.md files updated!")
