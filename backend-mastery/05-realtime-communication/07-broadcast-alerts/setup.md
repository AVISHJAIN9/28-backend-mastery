# Broadcast Alerts - Setup Guide

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
curl -X POST http://localhost:4000/api/broadcast \
  -d '{"title":"Alert","message":"Test","severity":"warning"}' \
  -H "Content-Type: application/json"
```