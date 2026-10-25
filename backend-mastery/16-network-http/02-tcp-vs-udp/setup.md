# Module 02: TCP vs UDP - Setup Guide

## Dependencies
```bash
npm install
```

## Configuration
```bash
cp .env.example .env
# Edit .env if needed, default port is 5802
```

## Running
```bash
npm run dev
```

## Testing

### Get TCP Info
```bash
curl http://localhost:5802/api/tcp-info
```

### Get UDP Info
```bash
curl http://localhost:5802/api/udp-info
```

### Compare Protocols
```bash
curl http://localhost:5802/api/compare
```

### Simulate Packet Loss
```bash
curl -X POST http://localhost:5802/api/simulate-loss \
  -H "Content-Type: application/json" \
  -d '{"packetLossPercentage": 5, "delayMs": 10}'
```

### View Metrics
```bash
curl http://localhost:5802/api/metrics
```

## Learning Path
1. Understand 3-way handshake (TCP)
2. Compare connection models
3. Run packet loss simulation
4. Choose protocol for scenarios

