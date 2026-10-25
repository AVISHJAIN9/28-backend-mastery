# Uptime Monitoring & SLAs

## What is this?

This module teaches you how to monitor service uptime, define and track SLAs (Service Level Agreements), measure SLOs (Service Level Objectives), and implement proper alerting. Learn to calculate uptime percentages, handle incidents, and maintain status pages.

## Why does it matter?

- **Revenue Impact:** Every hour of downtime can cost thousands of dollars
- **Customer Trust:** SLAs are legal contracts - failure = refunds + reputation damage
- **Business Planning:** Investors ask about uptime metrics before funding
- **Operational Decisions:** SLA determines your infrastructure investment level
- **Team Focus:** Clear SLOs help teams prioritize what to fix

**Real Examples:**
- AWS outage (2021): Each 1% downtime loss = millions in refunds
- GitHub outage (2021): 24-minute downtime triggered SLA credit notifications
- Stripe: 99.99% SLA is why payment companies trust them

## How it works (step by step)

### 1. Define Your SLO (Internal Target)

First, decide what you're aiming for:

```javascript
const SLO = {
  availability: 0.999,      // 99.9% - 8.76 hours/year downtime allowed
  latencyP95: 500,          // 95% of requests < 500ms
  latencyP99: 2000,         // 99% of requests < 2 seconds
  errorRate: 0.001          // Max 0.1% errors
};
```

### 2. Implement Monitoring

Track real metrics continuously:

```javascript
// Every request
app.use((req, res, next) => {
  const start = Date.now();
  res.on('finish', () => {
    const duration = Date.now() - start;
    metrics.record({
      duration,
      status: res.statusCode,
      isSuccess: res.statusCode < 400
    });
  });
  next();
});

// Run health checks every 60 seconds
setInterval(() => {
  healthCheck.run().then(passed => {
    metrics.recordHealthCheck(passed);
    if (!passed) alerting.notify('Service down!');
  });
}, 60000);
```

### 3. Calculate SLI (Actual Performance)

Measure what actually happened:

```javascript
// Monthly calculation
const sli = {
  availability: (successfulRequests / totalRequests) * 100,
  latencyP95: calculatePercentile(allRequests, 0.95),
  errorRate: (failedRequests / totalRequests) * 100
};

// Check against SLO
const meetsTarget = sli.availability >= 99.9%;
```

### 4. Create SLA (Customer Contract)

Document what you promise:

```
SERVICE LEVEL AGREEMENT

Target Uptime: 99.9% (monthly measurement)
Allowed Downtime: 43 minutes/month

Compensation:
99.5% - 99.9%: 10% credit
99.0% - 99.5%: 25% credit
< 99.0%: 50% credit
```

### 5. Alert on Violations

Notify team when metrics degrade:

```javascript
if (metrics.errorRate > 0.05) {  // > 5%
  alerting.slack('🚨 High error rate: ' + metrics.errorRate);
  alerting.pagerduty('Open incident');
}

if (!healthCheck.passed) {
  alerting.critical('Service is DOWN');
}
```

## Key concepts

### The Nines

| Uptime | Downtime/Year | Level |
|--------|---------------|-------|
| 99% | 3.6 days | Basic |
| 99.9% | 8.7 hours | Standard |
| 99.99% | 52 minutes | Enterprise |
| 99.999% | 5 minutes | Mission-critical |

### Error Budget

You get a "budget" of downtime for each month:

```
SLO: 99.9%
Days in month: 30 (2,592,000 seconds)
Allowed downtime = 2,592,000 × 0.001 = 2,592 seconds = 43 minutes

When actual downtime < 43 min → You can deploy without fear
When actual downtime ≥ 43 min → No more changes until next month!
```

### Incident Response

```
Detection: Alert fires when error rate > 5%
Response: On-call engineer acknowledged within 5 minutes
Mitigation: Team works on fix
Resolution: Service restored within target time
Postmortem: Document what happened
```

### Status Page

Users deserve to know when things are broken:

```javascript
GET /status → {
  status: 'operational' | 'degraded' | 'down',
  components: {
    api: 'operational',
    database: 'degraded',
    cdn: 'operational'
  },
  uptime24h: 99.97,
  uptime30d: 99.88,
  incidents: [...]
}
```

## Common mistakes

🚫 **Mistake 1:** Setting SLA without infrastructure to support it
- Fix: Start at 99% (comfortable for early stage), scale infrastructure for 99.9%+

🚫 **Mistake 2:** Not excluding scheduled maintenance from SLA calculations
- Fix: Explicitly exclude maintenance windows from SLA
- Example: "SLA excludes 2 hours scheduled maintenance per month"

🚫 **Mistake 3:** Measuring uptime only with synthetic checks
- Fix: Combine synthetic + real user monitoring for accuracy
- Synthetic might show "up" but users experiencing 5-second timeouts

🚫 **Mistake 4:** High SLA without incident response process
- Fix: Have runbooks, on-call, escalation before promising 99.99%
- You'll owe refunds for every violation

🚫 **Mistake 5:** Not tracking SLI in real-time
- Fix: Have a dashboard showing current SLI vs SLO target
- Update every minute, not at end of month

## Real world usage

### Scaling Example: From Startup to Enterprise

**Stage 1 - MVP (Month 0)**
```
SLA: None
SLO: 95% (focus on building)
Reality: Running on 1 server, no monitoring
```

**Stage 2 - Early Customers (Month 6)**
```
SLA: 99.5%
SLO: 99.5%
Setup: Basic monitoring, Slack alerts
Reality: Downtime = lost trust
```

**Stage 3 - Growth (Month 18)**
```
SLA: 99.9%
SLO: 99.95%
Setup: Monitoring, alerting, on-call rotation, status page
Infrastructure: Multi-region, auto-scaling
```

**Stage 4 - Enterprise (Year 3)**
```
SLA: 99.99%
SLO: 99.99%
Setup: Advanced monitoring, PagerDuty, ChatOps, automatic remediation
Infrastructure: Global redundancy, disaster recovery, chaos engineering
```

### Tech Stack

This module uses:
- **Express.js** - HTTP server
- **Winston** - Structured logging
- **Metrics** - In-memory metric tracking
- **React** - Testing UI
- **SQLite** - Optional persistence

Start with basic monitoring (synthetic health checks), graduate to real user monitoring, then distributed tracing for microservices.

## Testing the Module

1. **View Metrics:** Real-time dashboard of uptime/errors/latency
2. **Trigger Incidents:** Simulate failures and see alerting
3. **Status Page:** See how status updates in real-time
4. **SLA Calculation:** Watch SLI update as traffic patterns change
5. **Historical Data:** View monthly SLA compliance

## Files in this module

- `server.js` - Express server with monitoring endpoints
- `controller.js` - Business logic & metrics calculations
- `routes.js` - API endpoints for monitoring
- `middleware.js` - Request tracking & logging
- `App.jsx` - React testing UI
- `theory.md` - Detailed concepts
- `checklist.md` - Learning checklist
