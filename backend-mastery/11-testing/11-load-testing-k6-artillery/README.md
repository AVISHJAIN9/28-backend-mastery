# 11 - Load Testing with K6 & Artillery

## Overview
Perform load and stress testing to validate application performance and capacity.

## What You'll Learn
- **K6** - Developer-friendly load testing
- **Artillery** - Performance testing framework  
- **Load Profiles** - Ramp up, sustained, spike
- **Metrics** - Response time, throughput, errors
- **Thresholds** - Performance SLAs
- **Scripting** - Custom scenarios

## Key Concepts

### Load Testing Types
1. **Smoke Test** - Low load baseline
2. **Load Test** - Normal capacity
3. **Stress Test** - Beyond capacity
4. **Spike Test** - Sudden load
5. **Soak Test** - Long duration

### K6 Features  
- JavaScript-based
- Local execution
- Cloud testing
- Real-time metrics
- Thresholds

### Artillery Features
- YAML config
- Distributed
- Plugins
- Webhooks
- Reports

## Metrics
- **Response Time** - P50, P95, P99
- **Throughput** - RPS (requests/sec)
- **Error Rate** - Failed requests %
- **Bandwidth** - Data transfer
- **Virtual Users** - Concurrent clients

## Quick Start
```bash
# K6
k6 run script.js

# Artillery  
artillery load script.yml
```

## Test Scenarios
1. API endpoints
2. Database queries
3. Authentication
4. Search operations
5. File uploads

## Thresholds
```javascript
export const options = {
  thresholds: {
    'http_req_duration': ['p(95)<500'],
    'http_req_failed': ['<0.1'],
  },
};
```

## Best Practices
- Start small
- Ramp gradually
- Monitor resources
- Test realistic scenarios
- Identify bottlenecks
- Plan capacity
