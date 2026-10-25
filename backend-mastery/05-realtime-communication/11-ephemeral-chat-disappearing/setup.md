# Ephemeral Chat - Disappearing Messages - Setup Guide

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
```