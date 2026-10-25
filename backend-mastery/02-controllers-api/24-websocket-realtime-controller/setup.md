# Setup Guide - WebSocket Controller

## Installation

```bash
npm install express ws socket.io dotenv
```

## Environment Variables

```env
HTTP_PORT=5024
WS_PORT=5024
NODE_ENV=development
```

## Running

```bash
npm start
```

## Testing

```bash
# Connect to WebSocket
wscat -c ws://localhost:5024/socket

# Send message
> {"type":"message","data":"hello"}

# Receive broadcast
< {"type":"broadcast","data":"message sent"}
```
