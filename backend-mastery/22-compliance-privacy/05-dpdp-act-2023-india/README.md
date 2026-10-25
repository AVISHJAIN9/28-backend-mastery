# 05 – DPDP Act 2023 (India)

## Overview
The **Digital Personal Data Protection Act 2023** is India's primary data protection law. This module covers compliance requirements, implementation patterns, and key differences from GDPR.

## Files
| File | Purpose |
|------|---------|
| `dpdpService.js` | DPDP-specific compliance logic |
| `consentNotice.js` | Multilingual consent notice generator |
| `schema.js` | DB schema for DPDP compliance records |
| `App.jsx` | DPDP compliance dashboard UI |
| `preview.html` | Standalone HTML preview |
| `checklist.md` | DPDP compliance checklist |
| `theory.md` | DPDP Act overview and key provisions |
| `setup.md` | Integration guide |

## Key DPDP Requirements
- Consent must be free, specific, informed, unconditional, and unambiguous
- Consent notices must be available in all 22 scheduled Indian languages
- Data Fiduciaries must appoint a Data Protection Officer
- Cross-border transfers only to approved countries (whitelist by Central Government)
- Data Principals have rights to: access, correction, erasure, grievance redressal, nominee
- Significant Data Fiduciaries face additional obligations
