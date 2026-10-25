# Server-Sent Events - Setup Guide

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
curl -X POST http://localhost:4000/api/broadcast \
  -H "Content-Type: application/json" \
  -d '{"event":"update","data":{"msg":"hello"}}'
```