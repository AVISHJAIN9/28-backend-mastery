# Audit Trail – Compliance Checklist

## Log Coverage
- [ ] Authentication events logged (login, logout, failures)
- [ ] All personal data access logged
- [ ] Data export events logged
- [ ] Consent changes logged
- [ ] Erasure requests and completions logged
- [ ] Admin and privileged actions logged
- [ ] Breach events logged

## Immutability
- [ ] UPDATE and DELETE revoked from app DB role on audit_log table
- [ ] Hash chaining implemented and verified
- [ ] Chain integrity check runs automatically (daily cron)
- [ ] Alert configured if chain verification fails
- [ ] Archival copies on write-once storage

## Access Control
- [ ] Audit logs accessible only to authorised personnel
- [ ] Audit log access itself is logged (meta-audit)
- [ ] Separation of duties: those who can read logs cannot modify system

## Retention
- [ ] Retention period defined (recommended: 3 years active, 7 years archive)
- [ ] Automated purge of logs older than retention period
- [ ] Archive format documented for future retrieval

## Review
- [ ] Audit logs reviewed weekly for anomalies
- [ ] Automated alerting for suspicious patterns (multiple failed logins, mass data export)
- [ ] Annual audit log review completed and documented
