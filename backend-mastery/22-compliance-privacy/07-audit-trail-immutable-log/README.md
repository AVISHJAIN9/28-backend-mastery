# 07 – Audit Trail & Immutable Log

## Overview
An immutable, append-only audit log for compliance events. Records who did what, when, and to which data — with cryptographic chaining to detect tampering.

## Files
| File | Purpose |
|------|---------|
| `auditLogger.js` | Core audit log writer with hash chaining |
| `auditVerifier.js` | Verify chain integrity (detect tampering) |
| `middleware.js` | Express middleware for auto-logging |
| `schema.js` | DB schema for audit log |
| `App.jsx` | Audit log viewer UI |
| `preview.html` | Standalone HTML preview |
| `checklist.md` | Audit trail compliance checklist |
| `theory.md` | Immutability patterns and legal requirements |
| `setup.md` | Integration guide |

## How the Chain Works
Each log entry stores the SHA-256 hash of the previous entry. If any entry is modified or deleted, the chain verification will fail — providing tamper evidence.

## Event Types Logged
- `data.access` — User or admin accessed personal data
- `data.export` — Data exported from the system
- `consent.granted` / `consent.withdrawn`
- `erasure.requested` / `erasure.completed`
- `auth.login` / `auth.logout` / `auth.failed`
- `admin.action` — Any privileged admin operation
- `breach.detected` / `breach.notified`
