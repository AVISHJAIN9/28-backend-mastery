# GDPR Right to Erasure – Implementation Checklist

## Legal Requirements
- [ ] Identify all lawful bases for processing user data
- [ ] Define which data categories are subject to erasure
- [ ] Identify data that must be retained (legal obligation, public interest, etc.)
- [ ] Document retention exceptions in your Privacy Notice

## Technical Implementation
- [ ] Build erasure request submission endpoint (POST /api/erasure/request)
- [ ] Implement identity verification before processing requests
- [ ] Cascade deletions across all services/databases
- [ ] Anonymise data where full deletion is not possible
- [ ] Remove data from backups within defined schedule
- [ ] Purge cached copies (CDN, Redis, etc.)
- [ ] Remove from third-party processors / notify sub-processors

## Process & Workflow
- [ ] Acknowledge request within 72 hours (auto email)
- [ ] Complete erasure within 30 days (GDPR Art. 12(3))
- [ ] Send confirmation email upon completion
- [ ] Log request and outcome in audit trail
- [ ] Handle cases where erasure is refused (with reason)

## Testing
- [ ] Unit tests for erasure service
- [ ] Integration test: submit → verify data removed from DB
- [ ] Test backup purge process
- [ ] Test sub-processor notification flow
- [ ] Test refusal flow (e.g. legal hold)

## Documentation
- [ ] Update Privacy Notice to reference Art. 17 rights
- [ ] Document erasure procedure in ROPA
- [ ] Train staff on handling erasure requests
