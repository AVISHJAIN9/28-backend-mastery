# Graceful Shutdown - Setup & Testing

## Installation

```bash
npm init -y
npm install express
npm install -g pm2
```

## Express Server Setup

See controller.js for full example.

## Manual Testing

```bash
# Start server
node controller.js

# In another terminal, send SIGTERM
kill -SIGTERM <pid>

# Observe: Server shuts down gracefully
```

## PM2 Configuration

```bash
pm2 start app.js --max-memory-restart 500M
```

## Docker Testing

```bash
docker build -t app .
docker run app
docker stop <container> # Sends SIGTERM
```
