# Module 11: Load Testing - Setup Guide

## Quick Start (5 minutes)

```bash
# Install dependencies
npm install

# Start server
npm run dev

# Run K6 test
k6 run load-test.js

# Or Artillery
artillery run load-test.yml
```

## Step-by-Step Setup

### 1. Install K6 (Option A)

**macOS:**
```bash
brew install k6
```

**Linux:**
```bash
# Ubuntu
sudo apt-get install k6

# Or download from k6.io
```

**Unix/npm:**
```bash
npm install -g k6
```

### 2. Install Artillery (Option B)

```bash
npm install -g artillery
# or
npm install --save-dev artillery
```

### 3. Verify Installation

**K6:**
```bash
k6 version
```

**Artillery:**
```bash
artillery -v
```

## K6 Setup

### Basic Script

**load-test.js:**

```javascript
import http from 'k6/http';
import { check, sleep } from 'k6';

export let options = {
  vus: 10,        // 10 virtual users
  duration: '30s' // for 30 seconds
};

export default function() {
  let response = http.get('http://localhost:4011/api/users');
  
  check(response, {
    'status is 200': (r) => r.status === 200,
    'response time < 500ms': (r) => r.timings.duration < 500,
    'has body': (r) => r.body.length > 0
  });
  
  sleep(1);
}
```

### Run K6 Test

```bash
k6 run load-test.js
```

Output:
```
rendering http://localhost:4011/api/users for 30s @ 10 VUs.

  ✓ status is 200
  ✓ response time < 500ms
  ✓ has body

http_requests: 300 total, 10 rps
http_req_duration: p(95)=250ms, p(99)=450ms
```

## Artillery Setup

### Basic Config

**load-test.yml:**

```yaml
config:
  target: 'http://localhost:4011'
  phases:
    - duration: 30
      arrivalRate: 10  # 10 users per second
      name: 'Ramp up'
    - duration: 60
      arrivalRate: 20
      name: 'Peak load'
    - duration: 30
      arrivalRate: 5
      name: 'Cool down'

scenarios:
  - name: 'User API'
    flow:
      - get:
          url: '/api/users'
      - think: 2
      - post:
          url: '/api/users'
          json:
            name: 'Alice'
            email: 'alice@test.com'
```

### Run Artillery

```bash
artillery run load-test.yml
```

Output:
```
All VUs finished in 120s

Summary report @ 12:34:56 GMT
  Scenario: User API
    0.00s - 120.00s
  
  http.codes.200: 1200
  http.codes.201: 600
  http.response_time:
    min: 50
    max: 2500
    mean: 450
```

## Load Profiles

### Ramp Up Pattern (K6)

```javascript
export let options = {
  stages: [
    { duration: '2m', target: 0 },   // Start
    { duration: '5m', target: 50 },  // Gradual ramp
    { duration: '10m', target: 50 }, // Stay at peak
    { duration: '5m', target: 0 }    // Ramp down
  ]
};
```

### Ramp Up Pattern (Artillery)

```yaml
phases:
  - duration: 120
    arrivalRate: 0
    name: 'Wait'
  - duration: 300
    arrivalRate: 5
    rampTo: 50
    name: 'Ramp up'
  - duration: 600
    arrivalRate: 50
    name: 'Peak'
  - duration: 300
    arrivalRate: 50
    rampTo: 0
    name: 'Ramp down'
```

### Spike Test

```javascript
export let options = {
  stages: [
    { duration: '2m', target: 10 },   // Normal
    { duration: '30s', target: 100 }, // Spike!
    { duration: '2m', target: 10 }    // Back
  ]
};
```

### Stress Test

```javascript
export let options = {
  stages: [
    { duration: '2m', target: 100 },
    { duration: '5m', target: 200 },
    { duration: '2m', target: 300 },
    { duration: '2m', target: 400 }   // Until system breaks
  ]
};
```

## Thresholds

### K6 Thresholds

```javascript
export let options = {
  thresholds: {
    'http_req_duration': ['p(95)<500', 'p(99)<1000'],
    'http_req_failed': ['rate<0.1'],      // < 10% errors
    'http_requests': ['count>100'],
    'checks': ['rate>0.95']               // 95% pass rate
  }
};
```

### Artillery Thresholds

```yaml
config:
  thresholds:
    - name: 'Response time p95'
      value: 500
      relativeChange: false
    - name: 'responses.2xx'
      value: 100
      relativeChange: true
```

## Realistic Scenarios

### Think Time (K6)

```javascript
export default function() {
  http.get('http://localhost:4011/api/users');
  sleep(Math.random() * 5);  // Random 0-5 seconds
}
```

### Think Time (Artillery)

```yaml
flow:
  - get:
      url: '/api/users'
  - think: 3  # 3 second pause
```

### Variable Requests

```javascript
// K6
for (let i = 0; i < 10; i++) {
  let userId = Math.floor(Math.random() * 1000);
  http.get(`http://localhost:4011/api/users/${userId}`);
}
```

```yaml
# Artillery
- get:
    url: '/api/users/{{ $randomNumber(1, 1000) }}'
```

## Performance Analysis

### Good Metrics

```
✅ Response time p95 < 500ms
✅ Response time p99 < 1000ms
✅ Error rate < 1%
✅ No timeouts
✅ Throughput steady
```

### Warning Signs

```
❌ Response time increasing over time (degradation)
❌ Error rate climbing (system failing)
❌ Timeouts appearing (resource exhaustion)
❌ Throughput dropping (bottleneck hit)
```

## Debugging

### K6 with Logging

```javascript
import { check } from 'k6';

export default function() {
  let response = http.get('http://localhost:4011/api/users');
  
  if (response.status !== 200) {
    console.log(`Error: ${response.status} - ${response.body}`);
  }
  
  check(response, {
    'status 200': (r) => r.status === 200
  });
}
```

### View Request/Response

```javascript
let response = http.get('http://localhost:4011/api/users');
console.log('Status:', response.status);
console.log('Time:', response.timings.duration);
console.log('Body:', response.body.substring(0, 100));
```

## Troubleshooting

### "Too many open files"

Increase ulimit:
```bash
ulimit -n 5000
k6 run load-test.js
```

### "Connection refused"

Ensure server is running:
```bash
npm run dev  # In another terminal
```

### "High error rate"

Decrease load:
```javascript
export let options = {
  vus: 5,  // Reduced from 50
  duration: '10s'
};
```

## Capacity Planning

### Example Results

```
100 users  → 50ms response
500 users  → 150ms response
1000 users → 500ms response
2000 users → System breaks

Conclusion: Handle 1000 concurrent users
with <500ms response time
```

## Environment Setup

Create `.env`:

```env
HTTP_PORT=4011
NODE_ENV=production
LOG_LEVEL=error  # Less logging during load test
```

## Next Steps

1. ✅ Start development server
2. ✅ Run basic K6 test
3. ✅ View metrics
4. ✅ Try ramp-up profile
5. ✅ Analyze results

## Resources

- [K6 Documentation](https://k6.io/docs)
- [K6 API Reference](https://k6.io/docs/javascript-api)
- [Artillery Documentation](https://artillery.io/docs)
- [Load Testing Best Practices](https://k6.io/docs/testing-guides/)
