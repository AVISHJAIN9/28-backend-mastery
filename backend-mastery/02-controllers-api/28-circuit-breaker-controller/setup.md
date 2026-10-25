# Setup Guide - Circuit Breaker Controller

## Installation

```bash
npm install express opossum dotenv
```

## Environment Variables

```env
HTTP_PORT=5028
FAILURE_THRESHOLD=5
SUCCESS_THRESHOLD=2
TIMEOUT=30000
```

## Running

```bash
npm start
```

## Testing

```bash
# Normal request
curl http://localhost:5028/api/external

# Trigger failures
curl http://localhost:5028/api/external?fail=true

# Check circuit state
curl http://localhost:5028/api/circuit-status
```
