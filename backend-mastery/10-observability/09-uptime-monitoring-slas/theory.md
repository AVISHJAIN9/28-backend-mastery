# Uptime Monitoring & SLAs Theory

## What is Uptime?

Uptime is the percentage of time a service is available and responding correctly to requests. It's calculated as:

```
Uptime % = (Total Time - Downtime) / Total Time × 100
```

### The Nines

Higher nines = higher reliability, but exponentially more expensive.

```
99%     = 87.6 hours downtime per year    → Basic services (blogs, dashboards)
99.9%   = 8.76 hours downtime per year    → Good services (business apps)
99.99%  = 52.6 minutes downtime per year  → Enterprise services (banking, e-commerce)
99.999% = 5.26 minutes downtime per year  → Critical services (AWS, Google, payment processors)
```

**The cost multiplier:** Going from 99.9% to 99.99% typically costs 5-10x more infrastructure.

## SLO, SLA, SLI - The Pyramid

### SLI (Service Level Indicator) - Metrics

Actual, measurable metrics showing performance.

```javascript
// Availability SLI
SLI_Availability = (Successful Requests) / (Total Requests) × 100

Example:
1,000,000 requests in a day
999,900 successful (< 1 second response)
100 failed (5xx errors, timeouts)
SLI_Availability = 99.99%

// Latency SLI
SLI_Latency_P95 = (Requests under 500ms) / (Total Requests) × 100
Example: 95% of requests complete in < 500ms

// Error Rate SLI
SLI_ErrorRate = (Failed Requests) / (Total Requests) × 100
Example: 0.01% error rate
```

### SLO (Service Level Objective) - Targets

What you promise internally to meet.

```yaml
API SLOs (internal targets):
  Availability: 99.9%          # What we target
  P95 Latency: < 500ms         # 95th percentile response time
  P99 Latency: < 2000ms        # 99th percentile response time
  Error Rate: < 0.1%           # Max acceptable error rate
  Uptime: 99.95%               # Overall availability
  
Database SLOs:
  Query Response: < 100ms
  Write Success: 99.99%

Status Page SLOs:
  Page Display: < 2 seconds
  API Health: < 5 seconds (checks performed)
```

### SLA (Service Level Agreement) - Contract

What you promise to customers/users (legally binding).

```
TERMS:
"We guarantee 99.9% uptime measured monthly.

COMPENSATION:
If we fall below targets:
- 99.5% - 99.9%:    10% service credit (refund)
- 99.0% - 99.5%:    25% service credit
- 95.0% - 99.0%:    50% service credit
- < 95%:             100% service credit + manual review

MEASUREMENT:
- Excludes scheduled maintenance windows
- Excludes customer-caused outages
- Uses publicly available status page"
```

## Real-World SLA Examples

### Stripe (Payment Processor)
```
- Target: 99.99% uptime
- Compensation: Service credits
- Measured: Per region
- Impact: Multi-million dollar contracts depend on this
```

### GitHub
```
- Target: 99.9% uptime
- Measured: Globally
- Compensation: Free month of service
- Reality: Usually exceeds 99.95% uptime
```

### Your Startup
```
- Target: 99.9% uptime (start here, scale up)
- Measured: Rolling 30-day window
- Compensation: Account credits
- Reality: Do this BEFORE raising money
```

## Monitoring Strategy for Uptime

### 1. Synthetic Monitoring (Proactive)

Make requests to your own API like a user would.

```javascript
// Health check bot - runs every 60 seconds
setInterval(async () => {
  const start = Date.now();
  try {
    const response = await fetch('https://api.example.com/health', {
      timeout: 5000  // Max 5 second wait
    });
    
    const duration = Date.now() - start;
    
    if (response.status === 200) {
      metrics.recordHealthCheck('success', duration);
      logger.debug('Health check passed', { duration });
    } else {
      metrics.recordHealthCheck('failure', duration);
      logger.error('Health check failed', { status: response.status });
      alerting.sendAlert('API returned non-200 status');
    }
  } catch (error) {
    metrics.recordHealthCheck('error', Date.now() - start);
    logger.error('Health check failed', { error: error.message });
    alerting.sendAlert('API unreachable', { error });
  }
}, 60000);
```

### 2. Real User Monitoring (Reactive)

Track actual user requests.

```javascript
// Middleware to track real requests
app.use((req, res, next) => {
  const start = Date.now();
  
  res.on('finish', () => {
    const duration = Date.now() - start;
    const isSuccess = res.statusCode < 400;
    
    metrics.recordRequest({
      method: req.method,
      path: req.path,
      status: res.statusCode,
      duration,
      isSuccess,
      timestamp: new Date()
    });
    
    // Alert if too many errors in short time
    const errorRate = metrics.getErrorRate();
    if (errorRate > 0.05) {  // > 5% errors
      alerting.sendAlert('High error rate detected', { errorRate });
    }
  });
  
  next();
});
```

### 3. Distributed Tracing

Track requests across microservices.

```javascript
// In microservices setup
const startSpan = (operationName) => {
  return {
    operationName,
    startTime: Date.now(),
    spans: [],
    
    addSpan(serviceName, duration, status) {
      this.spans.push({ serviceName, duration, status });
    },
    
    totalDuration() {
      return Date.now() - this.startTime;
    }
  };
};

// Service A calls Service B
const trace = startSpan('getUserWithOrders');
const userStart = Date.now();
const user = await serviceA.getUser(id);
trace.addSpan('serviceA.getUser', Date.now() - userStart, 'success');

const ordersStart = Date.now();
const orders = await serviceB.getOrders(id);
trace.addSpan('serviceB.getOrders', Date.now() - ordersStart, 'success');

logger.info('Trace complete', {
  trace: trace.operationName,
  totalDuration: trace.totalDuration(),
  spans: trace.spans
});
```

## Calculating Downtime and SLIs

### Monthly Calculation Example

```
Total time in month (February 2026): 28 days × 24 hours × 60 min = 40,320 minutes

SLO Target: 99.9% uptime
Allowed downtime: 40,320 min × (1 - 0.999) = 40.32 minutes

Real performance:
- Incidents: 
  * 02/05: Database outage 15 minutes
  * 02/18: Deployment issue 8 minutes
  Total downtime: 23 minutes

Actual uptime: (40,320 - 23) / 40,320 = 99.943%
Status: ✓ WITHIN SLO (better than 99.9%)

SLA credit: NONE (exceeded target)
```

### Alerting Thresholds

```yaml
ALERT:
  ErrorRate > 1%: Warning
  ErrorRate > 5%: Critical
  P95Latency > 2000ms: Warning
  P95Latency > 5000ms: Critical
  API_Down: Immediate Critical
  
ESCALATION:
  1st Alert (5 min): Slack notification
  2nd Alert (10 min): PagerDuty (on-call engineer)
  3rd Alert (15 min): Manager + escalation
```

## Status Page Implementation

Users should see real-time status.

```javascript
app.get('/status', (req, res) => {
  const now = Date.now();
  const metrics = getMetrics();
  
  // Determine overall status
  let status = 'operational';
  if (metrics.errorRate > 0.05) status = 'degraded';
  if (metrics.isDown) status = 'down';
  
  res.json({
    status,  // operational, degraded, down
    timestamp: new Date().toISOString(),
    components: {
      api: { status: metrics.isDown ? 'down' : 'operational', lastCheck: metrics.lastCheck },
      database: { status: metrics.dbDown ? 'down' : 'operational' },
      cdn: { status: 'operational' }
    },
    metrics: {
      uptime24h: metrics.uptime24h,
      uptime30d: metrics.uptime30d,
      latencyP95: metrics.latencyP95,
      errorRate: metrics.errorRate
    },
    incidents: getRecentIncidents()
  });
});
```

## Tools & Services

- **Uptime Monitoring:** Pingdom, UptimeRobot, StatusCake
- **Incident Management:** PagerDuty, Opsgenie, VictorOps
- **Status Pages:** StatusPage.io, Atlassian Status, Cachet
- **Metrics Collection:** Prometheus, Grafana, DataDog
- **Alerting:** AlertManager, PagerDuty, Slack
  
  uptime.recordRequest({
    isSuccess,
    duration,
    timestamp: new Date()
  });
};

app.use((req, res, next) => {
  const startTime = Date.now();
  
  res.on('finish', () => {
    const duration = Date.now() - startTime;
    trackRequest(req.method, req.path, duration, res.statusCode);
  });
  
  next();
});
```

## Downtime Classification

### Planned Downtime

Scheduled maintenance that you control.

```
Excluded from SLA calculations:

Example:
"We will perform maintenance Sunday 2am-4am UTC
- System will be unavailable
- This downtime does NOT count against SLA
- If we exceed 4am, any extra time DOES count"
```

### Unplanned Downtime

Unexpected outages.

```
Included in SLA calculations (negative impact)

Causes:
- Database crash
- Memory leak
- Deployment gone wrong
- Regional network outage
- Security incident requiring shutdown
```

## Tracking Uptime Metrics

### Observability Stack

```javascript
const UptimeMonitor = {
  successCount: 0,
  failureCount: 0,
  
  recordSuccess() {
    this.successCount++;
    this.updateMetrics();
  },
  
  recordFailure() {
    this.failureCount++;
    this.triggerAlert();
    this.updateMetrics();
  },
  
  getUptimePercent() {
    const total = this.successCount + this.failureCount;
    return (this.successCount / total) * 100;
  },
  
  getUptimePercent1Hour() {
    const logsFromLastHour = this.getLogs(Date.now() - 3600000);
    const success = logsFromLastHour.filter(l => l.success).length;
    return (success / logsFromLastHour.length) * 100;
  },
  
  getUptimePercentDay() {
    // Same pattern, 24 hours
  }
};
```

### Status Page Dashboard

```javascript
// Public status page showing uptime

app.get('/status', async (req, res) => {
  const metrics = await getUptimeMetrics();
  
  res.json({
    status: metrics.uptime > 99.9 ? 'operational' : 'degraded',
    uptime: {
      last_hour: 99.95,
      last_day: 99.92,
      last_month: 99.88,
      last_quarter: 99.85
    },
    incidents: [
      {
        date: '2026-03-28',
        duration: '15 minutes',
        status: 'resolved',
        severity: 'minor',
        description: 'Database connection timeout'
      }
    ]
  });
});
```

## Real-World Monitoring Setup

### Multi-Region Monitoring

```javascript
const regions = {
  'us-east': 'https://api.us-east.example.com/health',
  'us-west': 'https://api.us-west.example.com/health',
  'eu-central': 'https://api.eu.example.com/health',
  'asia-pacific': 'https://api.ap.example.com/health'
};

// Check each region every 30 seconds
Object.entries(regions).forEach(([region, url]) => {
  setInterval(async () => {
    const startTime = Date.now();
    
    try {
      const response = await fetch(url, { timeout: 5000 });
      const duration = Date.now() - startTime;
      
      metrics.record({
        region,
        status: 'up',
        latency: duration,
        timestamp: new Date()
      });
    } catch (error) {
      metrics.record({
        region,
        status: 'down',
        error: error.message,
        timestamp: new Date()
      });
      
      sendAlert({
        severity: 'critical',
        message: `${region} region is down`,
        region
      });
    }
  }, 30000);
});
```

### SLO Tracking

```javascript
class SLOTracker {
  constructor(sloTargets) {
    this.targets = sloTargets;
    this.metrics = {
      availability: [],
      latency: [],
      errorRate: []
    };
  }
  
  recordRequest(request) {
    this.metrics.availability.push({
      time: Date.now(),
      success: request.status < 400
    });
    
    this.metrics.latency.push({
      time: Date.now(),
      duration: request.duration
    });
  }
  
  checkSLOs() {
    const availability = this.calculateAvailability();
    const latencyP95 = this.calculatePercentile(95);
    const errorRate = this.calculateErrorRate();
    
    const report = {
      availability: {
        target: this.targets.availability,
        actual: availability,
        met: availability >= this.targets.availability
      },
      latency: {
        target: this.targets.latency,
        actual: latencyP95,
        met: latencyP95 <= this.targets.latency
      },
      errorRate: {
        target: this.targets.errorRate,
        actual: errorRate,
        met: errorRate <= this.targets.errorRate
      }
    };
    
    if (!report.availability.met || !report.latency.met) {
      sendSlackAlert({
        title: 'SLO Violation',
        metrics: report
      });
    }
    
    return report;
  }
}

const tracker = new SLOTracker({
  availability: 99.9,
  latency: 500,      // 500ms p95
  errorRate: 0.1     // 0.1% error rate
});

// Check SLOs every hour
setInterval(() => tracker.checkSLOs(), 3600000);
```

## Incident Response

### Uptime Timeline

```javascript
const Incident = {
  startTime: new Date('2026-03-28 14:32:00Z'),
  impact: {
    affectedSystems: ['payment-service', 'order-service'],
    customerImpact: 'Customers unable to complete purchases',
    severity: 'critical'
  },
  timeline: [
    {
      time: '14:32:00Z',
      event: 'Database CPU spike detected',
      severity: 'warning'
    },
    {
      time: '14:33:15Z',
      event: 'Payment service requests timing out',
      severity: 'critical'
    },
    {
      time: '14:33:45Z',
      event: 'Alert triggered, on-call engineer notified',
      severity: 'critical'
    },
    {
      time: '14:35:22Z',
      event: 'Root cause identified: N+1 query in payment endpoint',
      severity: 'critical'
    },
    {
      time: '14:36:10Z',
      event: 'Quick fix deployed',
      severity: 'critical'
    },
    {
      time: '14:37:00Z',
      event: 'System recovered',
      severity: 'resolved'
    }
  ],
  rootCause: 'Database query optimization regression in v2.1.3',
  resolution: 'Rolled back to v2.1.2, re-deployed v2.1.4 with fix',
  duration: '5 minutes',
  downtime: 5
};

// Uptime calculation
const uptime = (1440 * 24 - Incident.downtime) / (1440 * 24) * 100;
console.log(`Uptime impact: ${99.99 - uptime}% (${Incident.downtime} minutes)`);
```

## Alerting Strategy

### Alert Levels

```javascript
const AlertLevels = {
  INFO: 'Informational, no action needed',
  WARNING: 'Something unusual, monitoring needed',
  CRITICAL: 'Service down or severely degraded'
};

if (response.status === 503) {
  // Service Unavailable
  alert({
    level: 'CRITICAL',
    message: 'API is returning 503',
    action: 'immediate page on-call'
  });
}

if (response.status === 429) {
  // Rate Limited
  alert({
    level: 'WARNING',
    message: 'External API returning rate limits',
    action: 'check load, consider queuing'
  });
}

if (latency > 1000) {
  // Slow response
  alert({
    level: 'WARNING',
    message: 'API latency > 1s',
    action: 'check database, monitor'
  });
}
```

## Best Practices

1. **Monitor from outside** - Use synthetic checks
2. **Monitor from inside** - Capture real user metrics
3. **Set realistic SLOs** - Based on users' needs, not perfect uptime
4. **Exclude planned downtime** - From SLA calculations
5. **Measure continuously** - Every request, every region
6. **Alert appropriately** - Not too noisy, not too silent
7. **Track incidents** - Post-mortems and learnings
8. **Communicate proactively** - Status page updates
9. **Test responses** - Runbooks and incident drills

## Common Metrics to Track

```javascript
const metrics = {
  // Availability
  uptime_percent: 99.92,
  monthly_downtime_minutes: 57.6,
  
  // Performance
  p50_latency_ms: 150,
  p95_latency_ms: 450,
  p99_latency_ms: 850,
  
  // Errors
  error_rate_percent: 0.08,
  failed_requests: 800,
  
  // Business impact
  affected_customers: 1500,
  affected_transactions: 23000,
  estimated_revenue_impact: 12500
};
```

## SLA Tiers

```
Tier 1 (Free):     99.0% SLA
Tier 2 (Standard): 99.9% SLA
Tier 3 (Premium):  99.99% SLA
Tier 4 (Enterprise): 99.999% SLA (with guaranteed response time)

More reliable tier = Higher cost
```

## Calculating SLA Credits

```javascript
calculateSLACredit(uptimePercent, slaTarget) {
  if (uptimePercent >= slaTarget) return 0;  // No credit
  
  const gap = slaTarget - uptimePercent;
  
  if (gap >= 4) return 0.25;        // 25% credit (< 95%)
  if (gap >= 1) return 0.10;        // 10% credit (95-98%)
  if (gap >= 0.5) return 0.05;      // 5% credit (98-98.5%)
  
  return 0;  // No credit
}

// Example: SLO = 99.9%, Actual = 99.5%
const credit = calculateSLACredit(99.5, 99.9);  // 10%

// Tier 3 Premium: $500/month
const refund = 500 * 0.10;  // $50 refund
```

