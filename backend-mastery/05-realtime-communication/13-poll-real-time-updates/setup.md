# Poll - Real-Time Updates - Setup Guide

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
curl -X POST http://localhost:4000/api/polls \
  -d '{"question":"Favorite?","options":["A","B"]}' \
  -H "Content-Type: application/json"

# Vote
curl -X POST http://localhost:4000/api/polls/poll1/vote \
  -d '{"option":"A"}' \
  -H "Content-Type: application/json"
```