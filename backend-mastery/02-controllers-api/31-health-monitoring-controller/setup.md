# Setup Guide - Health Monitoring Controller

## Installation

```bash
npm install express prom-client dotenv
```

## Environment Variables

```env
HTTP_PORT=5031
PROMETHEUS_PORT=9090
```

## Running

```bash
npm start
```

## Testing

```bash
# Liveness check
curl http://localhost:5031/health/live

# Readiness check
curl http://localhost:5031/health/ready

# Metrics
curl http://localhost:5031/metrics
```
