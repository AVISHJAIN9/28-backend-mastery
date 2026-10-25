# Anonymisation & Pseudonymisation – Checklist

## Anonymisation
- [ ] Anonymisation reviewed against ICO / EDPB guidance
- [ ] Re-identification risk assessed (k-anonymity ≥ 5 for published data)
- [ ] Suppression applied to all direct identifiers
- [ ] Quasi-identifiers generalised or bucketed
- [ ] Anonymised datasets tested against re-identification attack
- [ ] Legal sign-off that data is genuinely anonymous before removing GDPR controls

## Pseudonymisation
- [ ] Pseudonym mapping table access-controlled (separate service/schema)
- [ ] Mapping table encrypted at rest
- [ ] Pseudonymisation key rotation process defined
- [ ] Depseudonymisation requires separate authorisation
- [ ] Pseudonymisation keys NOT stored alongside pseudonymised data

## Process
- [ ] Test data always pseudonymised before sharing with developers
- [ ] Analytics pipelines use anonymised/pseudonymised data only
- [ ] ML training datasets anonymised
- [ ] Breach impact assessment includes pseudonymisation as mitigating factor
