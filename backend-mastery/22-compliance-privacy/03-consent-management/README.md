# 03 – Consent Management

## Overview
This module implements a full consent management system covering collection, storage, withdrawal, and audit of user consents — compliant with GDPR Article 7 and the DPDP Act 2023.

## Files
| File | Purpose |
|------|---------|
| `consentService.js` | Core consent CRUD logic |
| `schema.js` | DB schema for consents |
| `middleware.js` | Consent-check middleware for routes |
| `App.jsx` | Consent preference centre UI |
| `preview.html` | Standalone HTML preview |
| `checklist.md` | Consent compliance checklist |
| `theory.md` | Consent legal background |
| `setup.md` | Integration guide |

## Consent Categories
- Marketing emails
- Analytics & tracking
- Third-party data sharing
- Personalisation
- Research & profiling

## API Endpoints
| Method | Path | Description |
|--------|------|-------------|
| GET | `/api/consent/:userId` | Get user's current consents |
| POST | `/api/consent/:userId` | Save/update consents |
| DELETE | `/api/consent/:userId/:category` | Withdraw specific consent |
| GET | `/api/consent/:userId/history` | Full consent audit trail |
