# Theory – Audit Trail & Immutable Log

## Why an Immutable Audit Log?
Regulators (GDPR, DPDP, PCI-DSS, ISO 27001) require evidence of who accessed or processed personal data and when. An immutable log provides this evidence and prevents retroactive tampering — which would itself be a breach.

## What to Log
| Category | Events |
|----------|--------|
| Authentication | Login, logout, failed attempts, MFA |
| Data access | Read, search, export of personal data |
| Data modification | Create, update, delete of personal data |
| Consent | Granted, withdrawn, version changes |
| Erasure | Request, processing, completion, rejection |
| Admin actions | Password reset, role changes, config changes |
| Breach events | Detection, notification, resolution |
| Cross-border transfers | Data sent to third parties or other countries |

## Immutability Techniques

### 1. Database-Level (Recommended)
Revoke `UPDATE`, `DELETE`, and `TRUNCATE` privileges from the application role. Only `INSERT` and `SELECT` are permitted. Even a compromised application cannot modify logs.

### 2. Hash Chaining
Each log entry stores a SHA-256 hash of the previous entry's hash combined with its own data. This forms a blockchain-like chain — any modification to a past entry invalidates all subsequent hashes.

### 3. Write-Once Storage
Use write-once storage (e.g. AWS S3 Object Lock, WORM drives) for archival copies of audit logs.

### 4. External Timestamping
Submit a hash of each log batch to a trusted timestamping authority (RFC 3161). Proves logs existed at a given time.

## Retention Requirements
| Framework | Audit Log Retention |
|-----------|-------------------|
| GDPR | Not specified — match to processing purpose |
| PCI-DSS | 12 months (3 months immediately available) |
| ISO 27001 | Per organisation's policy |
| DPDP Act | Not yet specified |
| India IT Act | As long as lawfully required |

Best practice: retain for **3 years**, archive for **7 years**.

## References
- GDPR Article 5(2) – Accountability principle (requires audit evidence)
- GDPR Article 30 – Records of processing activities
- PCI-DSS Requirement 10 – Log and Monitor All Access
- ISO 27001:2022 Control 8.15 – Logging
