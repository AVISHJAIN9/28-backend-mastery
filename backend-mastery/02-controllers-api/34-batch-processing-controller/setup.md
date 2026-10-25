# Setup Guide - Batch Processing

## Installation

```bash
npm install bull express redis dotenv
```

## Queue Setup

```bash
# Start Redis
redis-server
```

## Running

```bash
npm start
```

## Testing

```bash
# Submit job
curl -X POST http://localhost:5034/api/jobs \\
  -d '{"type":"export","filename":"data.csv"}'

# Check status
curl http://localhost:5034/api/jobs/:jobId
```
