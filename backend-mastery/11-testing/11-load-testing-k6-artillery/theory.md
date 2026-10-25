# Load Testing with K6 & Artillery - Theory

## What is Load Testing?

Load testing simulates many concurrent users to measure system performance under stress.

### Key Metrics

- **Throughput** - Requests per second (RPS)
- **Response Time** - How long requests take (p50, p95, p99)
- **Error Rate** - % of failed requests
- **Concurrency** - Number of simultaneous users
- **Load** - Total requests over time

### Load Profile Example

```
Concurrent Users:
       │
    50 │           ╱────────╲
    40 │          ╱          ╲
    30 │         ╱            ╲
    20 │        ╱              ╲
    10 │       ╱                ╲
     0 └──────╱──────────────────╲───── Time
     0      5       10      15      20
     
     Ramp up → peak → ramp down
```

## K6 (JavaScript-based)

### Installation

```bash
brew install k6  # macOS
apt-get install k6  # Linux
# or
npm install -g k6
```

### Basic Script

```javascript
// load-test.js
import http from 'k6/http';
import { check, sleep } from 'k6';

export let options = {
  vus: 10,              // Virtual users
  duration: '30s'       // Duration
};

export default function() {
  let response = http.get('http://localhost:3000/api/users');
  
  check(response, {
    'status is 200': (r) => r.status === 200,
    'response time < 500ms': (r) => r.timings.duration < 500,
    'has data': (r) => r.body.length > 0
  });
  
  sleep(1);
}
```

### Run Test

```bash
k6 run load-test.js
```

### Output

```
Running 30s with 10 concurrent users...

✓ status is 200
✓ response time < 500ms
✓ has data

http_requests: 450 total, 15 rps
http_req_duration: p(99)=523ms
```

## Load Profiles

### Constant Load

```javascript
export let options = {
  vus: 20,            // Stay at 20 users
  duration: '1m'
};
```

### Ramp Up

```javascript
export let options = {
  stages: [
    { duration: '1m', target: 0 },    // Start
    { duration: '5m', target: 50 },   // Ramp up
    { duration: '10m', target: 50 },  // Stay
    { duration: '5m', target: 0 }     // Ramp down
  ]
};
```

### Spike Test

```javascript
export let options = {
  stages: [
    { duration: '2m', target: 10 },   // Normal
    { duration: '30s', target: 100 }, // Spike!
    { duration: '2m', target: 10 }    // Back to normal
  ]
};
```

### Stress Test

```javascript
export let options = {
  stages: [
    { duration: '2m', target: 100 },
    { duration: '5m', target: 200 },
    { duration: '2m', target: 300 },  // Until it breaks
    { duration: '2m', target: 400 },
  ]
};
```

## Thresholds

Set pass/fail criteria:

```javascript
export let options = {
  vus: 50,
  duration: '1m',
  thresholds: {
    'http_req_duration': ['p(95)<500', 'p(99)<1000'],
    'http_req_failed': ['rate<0.1'],  // < 10% errors
    'http_requests': ['count>100']
  }
};
```

## Artillery (YAML-based)

### Installation

```bash
npm install -g artillery
```

### Basic Config

```yaml
# load-test.yml
config:
  target: 'http://localhost:3000'
  phases:
    - duration: 60
      arrivalRate: 10    # 10 users per second
    - duration: 120
      arrivalRate: 20
    - duration: 60
      arrivalRate: 5

scenarios:
  - name: 'Get Users'
    flow:
      - get:
          url: '/api/users'
      - think: 2          # Wait 2 seconds
      - post:
          url: '/api/users'
          json:
            name: 'Alice'
            email: 'alice@test.com'
```

### Run Test

```bash
artillery run load-test.yml
```

## Comparison: K6 vs Artillery

| Feature | K6 | Artillery |
|---------|----|-----------|
| **Config** | JavaScript | YAML |
| **Learning** | More code | Simpler |
| **Flexibility** | Very high | Good |
| **Cloud** | Built-in | Separate |
| **Extensions** | Custom modules | Custom functions |

## Realistic Scenarios

### Think Time

Users don't run requests instantly:

```javascript
// K6
sleep(Math.random() * 5);  // 0-5 seconds

// Artillery
- think: 3
```

### Request Variation

```javascript
// K6
let userId = Math.floor(Math.random() * 1000);
http.get(`http://localhost:3000/api/users/${userId}`);

// Artillery
- get:
    url: '/api/users/{{ $randomNumber(1, 1000) }}'
```

### Error Handling

```javascript
// K6
import { check } from 'k6';

let response = http.get('http://localhost:3000/api/data');
check(response, {
  'no server errors': (r) => r.status < 500,
  'not too slow': (r) => r.timings.duration < 1000
});
```

### Ramping Strategies

```javascript
// K6 - Ramp up gradually
export let options = {
  stages: [
    { duration: '1m', target: 10 },
    { duration: '2m', target: 30 },
    { duration: '3m', target: 100 },
    { duration: '2m', target: 0 }  // Ramp down
  ]
};
```

## Interpreting Results

### Good Results

```
✓ Response time p95 < 500ms
✓ Error rate < 1%
✓ Throughput > 1000 rps
✓ No timeouts
```

### Problem Signs

```
✗ Response time increasing over time (degradation)
✗ Error rate climbing (system failing)
✗ Timeouts increasing (resource exhaustion)
✗ Memory leaks visible (sustained client growth)
```

## Best Practices

1. **Start Small** - 10 users → 100 → 1000
2. **Use Realistic Scenarios** - Include think time
3. **Test Different Endpoints** - APIs vary
4. **Monitor System** - Watch server metrics while testing
5. **Run Multiple Times** - Results vary
6. **Gradually Increase Load** - Smooth ramp-up
7. **Set Clear Thresholds** - Know when to stop
8. **Test in Staging** - Not production
9. **Analyze Failures** - Why did it break?
10. **Document Limits** - System capacity known

## Common Issues

### High Response Times

- Database queries slow
- N+1 query problem
- Memory leaks
- Connection pool exhausted

### High Error Rates

- Server out of memory
- Connection limit reached
- Timeout too short
- Database connections overwhelmed

### Timeout Errors

- Increase timeout
- Reduce load
- Server can't handle volume
- Check for deadlocks

## Capacity Planning Example

```
100 concurrent users → 50ms response time
500 concurrent users → 150ms response time
1000 concurrent users → 500ms response time
2000 concurrent users → System breaks

Conclusion: System handles 1000 concurrent users
with acceptable performance (< 500ms)
```

## Conclusion

Load testing reveals how systems behave under stress. Use K6 for complex scenarios with custom logic, Artillery for simple configuration-driven testing. Regular load testing prevents performance surprises in production.
