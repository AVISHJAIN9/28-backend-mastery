# 02 – PII Handling

## Overview
This module covers best practices and code patterns for identifying, classifying, storing, and processing **Personally Identifiable Information (PII)** in a compliant manner.

## Files
| File | Purpose |
|------|---------|
| `classifier.js` | Detects and classifies PII fields |
| `masking.js` | Masking/redaction utilities |
| `encryption.js` | Field-level encryption for sensitive PII |
| `middleware.js` | Request/response PII scrubbing |
| `schema.js` | DB schema with PII annotations |
| `App.jsx` | PII data viewer with masking UI |
| `checklist.md` | PII handling compliance checklist |
| `theory.md` | What is PII and how to handle it |
| `setup.md` | Integration guide |
| `preview.html` | Standalone HTML preview |

## PII Categories Handled
- **Direct identifiers**: Name, email, phone, SSN, passport
- **Quasi-identifiers**: Date of birth, postcode, gender
- **Sensitive PII**: Health data, financial data, biometrics
- **Online identifiers**: IP address, cookie IDs, device IDs

## Quick Start
```bash
npm install crypto-js validator
```
