# Module 10: Chaos Engineering - Kill Services

## Overview

**Chaos Engineering** is the practice of intentionally introducing failures into production systems to test resilience and discover weaknesses. This module demonstrates how to inject failures like service outages and latency to validate system behavior under stress.

## 🎯 Problem Statement

**Without Chaos Testing:**
- ❌ Unknown failure modes in production
- ❌ Cascading failures detected too late
- ❌ No confidence in failover mechanisms
- ❌ Surprising outages in unexpected scenarios

## ✅ Solution: Controlled Chaos

Inject planned failures to verify:
- Circuit breakers work correctly
- Fallbacks activate as expected
- Clients handle errors gracefully
- Recovery mechanisms function properly

## 🏗️ Implementation

### Service Status Management

```javascript
const services = {
  userService: { status: 'UP', latency_ms: 100, error_rate: 0 },
  paymentService: { status: 'UP', latency_ms: 200, error_rate: 0 }
};

const killService = async (req, res) => {
  services[serviceName].status = 'DOWN';
  // Clients should catch this and use fallbacks
};
```

### Failure Injection

1. **Service Kill**: Set status to DOWN
2. **Latency Injection**: Add artificial delays
3. **Error Rate**: Simulate partial failures
4. **Monitoring**: Log all chaos operations

## 🎬 Quick Start

```bash
npm install
npm start
# Server runs on http://localhost:6810
```

### Test Operations

```bash
# Kill a service
curl -X POST http://localhost:6810/api/kill \
  -H "Content-Type: application/json" \
  -d '{"service_name":"userService"}'

# Inject latency
curl -X POST http://localhost:6810/api/latency \
  -H "Content-Type: application/json" \
  -d '{"service_name":"paymentService","latency_ms":5000}'

# Check service status
curl http://localhost:6810/api/status

# Restore all services
curl -X POST http://localhost:6810/api/reset
```

## 📋 API Endpoints

### POST /api/kill
Kill a service (set status to DOWN)
```json
{
  "service_name": "userService"
}
```

### POST /api/restore
Restore a service (set status to UP)
```json
{
  "service_name": "userService"
}
```

### POST /api/latency
Inject latency into a service
```json
{
  "service_name": "paymentService",
  "latency_ms": 5000
}
```

### GET /api/status
Get all service statuses

### POST /api/reset
Reset all services to UP status

## 🔍 Real-World Use Cases

### 1. Netflix Chaos Engineering
- Kill random instances in production
- Test auto-scaling triggers
- Validate failover behavior
- Built "Chaos Monkey" tool

### 2. Amazon AWS
- Fault injection testing (FIT)
- Game days with induced failures
- Validate disaster recovery plans
- Test backup strategies

### 3. Google SRE
- Chaos engineering part of standard practice
- Fire drills for incident response
- Test monitoring and alerting
- Validate runbooks

## ✅ Best Practices

1. **Start Small**: Begin with non-critical services
2. **Monitor Everything**: Track all metrics during chaos
3. **GameDays**: Schedule chaos experiments
4. **Runbooks**: Have clear incident response procedures
5. **Permission**: Only in staging/controlled environments
6. **Gradual Escalation**: Increase failure severity over time

## ❌ Common Mistakes

- Running chaos in production without permission
- Not having rollback procedures
- Insufficient monitoring during tests
- Testing without incident response plan
- Ignoring results and learnings

## 🎓 Learning Outcomes

After this module, you should understand:
- ✅ How to systematically test system resilience
- ✅ Failure modes in distributed systems
- ✅ Service degradation handling
- ✅ Chaos engineering best practices
- ✅ Building resilient microservices

---

**Related Patterns**: Graceful Degradation, Circuit Breakers, Fault Injection
