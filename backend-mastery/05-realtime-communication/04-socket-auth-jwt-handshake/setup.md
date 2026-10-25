# Socket Auth & JWT - Setup Guide

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
curl -X POST http://localhost:4000/api/login \
  -d '{"userId":"user123"}' -H "Content-Type: application/json"

# Connect with token in client
socket = io('http://localhost:4000', {
  auth: { token: 'JWT_TOKEN_HERE' }
});
```