# Consent Management – Compliance Checklist

## Collection
- [ ] Consent requests are granular (one purpose per toggle)
- [ ] No pre-ticked boxes
- [ ] Plain language descriptions for each category
- [ ] Privacy notice version is recorded at time of consent
- [ ] Consent is not bundled with T&Cs acceptance

## Storage
- [ ] All consent events stored with: userId, category, granted, timestamp, source, IP
- [ ] Full history retained (never overwrite, only add new records)
- [ ] is_current flag maintained for latest state per category

## Withdrawal
- [ ] Users can withdraw individual consents from preference centre
- [ ] Withdrawal is as easy as giving consent
- [ ] Withdrawal triggers downstream actions (e.g. unsubscribe from mailing list)
- [ ] Withdrawal recorded in audit trail

## Downstream Enforcement
- [ ] Marketing system checks marketing_email consent before sending
- [ ] Analytics script checks analytics consent before loading
- [ ] Third-party SDKs gated behind third_party_sharing consent

## Review
- [ ] Re-consent collected when purpose changes materially
- [ ] Consent reviewed annually for relevance
- [ ] Consent records available for regulator inspection
