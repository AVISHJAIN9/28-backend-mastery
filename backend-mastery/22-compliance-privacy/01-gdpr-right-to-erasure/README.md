# 01 – GDPR Right to Erasure (Article 17)

## Overview
This module implements the **Right to Erasure** ("Right to be Forgotten") as required by GDPR Article 17. It provides an API and UI for users to request deletion of their personal data, and for admins to process those requests.

## Files
| File | Purpose |
|------|---------|
| `App.jsx` | React UI for submitting erasure requests |
| `controller.js` | Express route handlers |
| `middleware.js` | Identity checks & email notifications |
| `routes.js` | API route definitions |
| `schema.js` | DB models for erasure requests |
| `preview.html` | Standalone HTML preview |
| `.env.example` | Required environment variables |
| `checklist.md` | Compliance checklist |
| `theory.md` | Legal & conceptual background |
| `setup.md` | Integration guide |

## API Endpoints
| Method | Path | Description |
|--------|------|-------------|
| POST | `/api/erasure/request` | Submit an erasure request |
| GET | `/api/erasure/:id/status` | Check request status |
| POST | `/api/erasure/:id/process` | Process request (admin) |

## Quick Start
```bash
cp .env.example .env
# Fill in DB and SMTP credentials
npm install
node routes.js
```

## Legal References
- GDPR Article 17 – Right to Erasure
- GDPR Article 12 – Transparent information (30-day response window)
- GDPR Recital 65 – Right to erasure rationale
