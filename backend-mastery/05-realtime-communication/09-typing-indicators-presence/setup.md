# Typing Indicators & Presence - Setup Guide

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
```