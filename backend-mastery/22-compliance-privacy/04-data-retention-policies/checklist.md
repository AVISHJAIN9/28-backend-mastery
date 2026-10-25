# Data Retention – Compliance Checklist

## Policy Definition
- [ ] Retention schedule documented for every data category
- [ ] Legal basis for each retention period identified
- [ ] Retention policy approved by DPO/Legal
- [ ] Policy reviewed annually

## Technical Implementation
- [ ] Purge job running on schedule (daily)
- [ ] Purge job results logged in retention_audit_log
- [ ] Alerts configured for failed purge runs
- [ ] Backup purge cycle aligned with retention schedule
- [ ] Legal hold mechanism implemented

## Data Discovery
- [ ] All databases and data stores included in schedule
- [ ] Third-party processors' retention schedules verified
- [ ] Cloud storage buckets included

## Verification
- [ ] Spot-check: confirm data older than retention period has been purged
- [ ] Audit log reviewed monthly
- [ ] Annual retention audit completed
