# 04 – Data Retention Policies

## Overview
Defines and enforces data retention schedules. Automatically purges or anonymises data after its defined retention period.

## Files
| File | Purpose |
|------|---------|
| `retentionPolicy.js` | Retention rules engine |
| `purgeJob.js` | Scheduled purge runner |
| `schema.js` | DB schema for retention tracking |
| `App.jsx` | Retention policy dashboard UI |
| `preview.html` | Standalone HTML preview |
| `checklist.md` | Retention compliance checklist |
| `theory.md` | Retention legal background |
| `setup.md` | Integration guide |

## Default Retention Schedule
| Data Type | Retention Period | Action |
|-----------|-----------------|--------|
| User accounts | Lifetime + 2 years | Anonymise |
| Transaction records | 7 years | Archive |
| Audit logs | 3 years | Archive |
| Marketing data | 2 years | Delete |
| Support tickets | 3 years | Anonymise |
| Application logs | 90 days | Delete |
| Session data | 30 days | Delete |
