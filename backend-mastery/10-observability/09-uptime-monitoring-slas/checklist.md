# Uptime Monitoring & SLAs - Learning Checklist

## Foundation Concepts
- [ ] Understand what SLI (Service Level Indicator) is and what it measures
- [ ] Understand what SLO (Service Level Objective) is and why it matters
- [ ] Understand what SLA (Service Level Agreement) is and legal implications
- [ ] Know the difference between "the nines" (99%, 99.9%, 99.99%, 99.999%)
- [ ] Calculate downtime budget for a given SLO target
- [ ] Understand error budget concept and when to deploy

## Monitoring Implementation
- [ ] Record request metrics (duration, status code, success/failure)
- [ ] Calculate availability/uptime percentage
- [ ] Calculate latency percentiles (P50, P95, P99)
- [ ] Identify and track error rates
- [ ] Implement health check endpoints
- [ ] Set up periodic health check jobs (synthetic monitoring)
- [ ] Track real user monitoring (actual request metrics)

## Incident Management
- [ ] Record incidents with timestamps and severity
- [ ] Calculate incident duration and impact
- [ ] Resolve and document incidents
- [ ] Classify incident types (API error, database error, etc.)
- [ ] Track incident history and trends
- [ ] Create postmortem structure

## Alerting & Notifications
- [ ] Define error rate alerting threshold (e.g., > 5%)
- [ ] Define latency alerting threshold (e.g., P95 > 5 seconds)
- [ ] Alert when service goes down (immediate critical)
- [ ] Alert on SLA violations approaching
- [ ] Create escalation procedures (5 min → 10 min → 15 min)

## Status Page
- [ ] Create public status page (/status endpoint)
- [ ] Show overall system status (operational, degraded, down)
- [ ] Display real-time metrics (uptime, latency, error rate)
- [ ] List recent incidents
- [ ] Show component health (API, database, CDN, etc.)
- [ ] Update status in real-time as situation changes

## SLA Calculations
- [ ] Calculate monthly uptime percentage
- [ ] Compare actual SLI against SLO target
- [ ] Determine SLA compliance status (COMPLIANT or VIOLATION)
- [ ] Calculate service credits owed (if applicable)
- [ ] Track and plan for error budget usage

## Production Readiness
- [ ] Document SLA terms for customers
- [ ] Set up monitoring dashboards (Grafana, DataDog)
- [ ] Configure incident notification channels (Slack, PagerDuty)
- [ ] Create incident response runbook
- [ ] Train team on on-call procedures
- [ ] Test failover and recovery scenarios

## Advanced Topics
- [ ] Understand distributed tracing for microservices
- [ ] Implement chaos engineering testing
- [ ] Set up multi-region failover
- [ ] Implement automatic remediation
- [ ] Use APM tools (DataDog, New Relic, AppDynamics)

## Testing Scenarios
- [ ] Simulate API errors and verify alerting
- [ ] Simulate database errors and impact on SLI
- [ ] Verify health check works when service is down
- [ ] Test status page updates in real-time
- [ ] Verify SLA calculation accuracy
- [ ] Test incident resolution and recovery tracking

## Code Understanding
- [ ] Understand MetricsStore class and how it tracks metrics
- [ ] Understand IncidentSimulator and how it works
- [ ] Review controller.js business logic
- [ ] Review middleware.js request tracking
- [ ] Understand routes and API endpoints
- [ ] Review schema.js validation and SLO presets

## Real-World Application
- [ ] Calculate what SLO your service should have
- [ ] Design monitoring and alerting for your service
- [ ] Plan incident response procedures
- [ ] Create status page for your service
- [ ] Document SLA for stakeholders
- [ ] Set up maintenance windows and exclusions
- [ ] Calculate run-rate SLI during the month

- [ ] Written middleware
- [ ] Tested manually
- [ ] Written tests
- [ ] Reviewed edge cases
