# 06 – Data Anonymisation & Pseudonymisation

## Overview
This module implements data anonymisation and pseudonymisation techniques to reduce privacy risk while retaining data utility.

## Files
| File | Purpose |
|------|---------|
| `anonymise.js` | Anonymisation functions (k-anonymity, generalisation, suppression) |
| `pseudonymise.js` | Pseudonymisation with reversible tokenisation |
| `App.jsx` | Interactive anonymisation demo UI |
| `preview.html` | Standalone HTML preview |
| `checklist.md` | Checklist |
| `theory.md` | Theory and techniques |
| `setup.md` | Integration guide |

## Key Distinction
| | Anonymisation | Pseudonymisation |
|--|--------------|-----------------|
| Reversible? | No | Yes (with key) |
| GDPR scope | Outside GDPR | Still personal data |
| Risk reduction | Maximum | Significant |
| Data utility | May be reduced | High |
