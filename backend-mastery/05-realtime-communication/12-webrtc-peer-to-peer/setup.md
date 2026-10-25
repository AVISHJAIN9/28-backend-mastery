# WebRTC - Peer-to-Peer - Setup Guide

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
```