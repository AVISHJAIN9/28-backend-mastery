# Cluster Module - Setup & Benchmarking

## Installation

```bash
npm init -y
npm install express redis
```

## Benchmarking

### With ab (Apache Bench)
```bash
ab -n 10000 -c 100 http://localhost:3000/
```

### With autocannon
```bash
npm install -g autocannon
autocannon -d 30 -c 100 http://localhost:3000/
```

## Shared Cache Setup

```javascript
const redis = require('redis');
const client = redis.createClient();
```

## Load Testing

Compare single vs multi-core performance.
