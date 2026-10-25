# CRDT - Collaborative Editing - Setup Guide

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
```