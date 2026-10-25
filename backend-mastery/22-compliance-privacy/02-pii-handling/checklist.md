# PII Handling – Compliance Checklist

## Data Discovery
- [ ] Inventory all data sources containing PII
- [ ] Classify PII by category and risk level
- [ ] Document in Record of Processing Activities (ROPA)

## Collection
- [ ] Collect only necessary PII (data minimisation)
- [ ] Obtain valid lawful basis for each PII type
- [ ] Show clear privacy notice at collection point

## Storage
- [ ] Encrypt PII at rest (AES-256 minimum)
- [ ] Encrypt PII in transit (TLS 1.2+)
- [ ] Apply field-level encryption to high-risk PII
- [ ] Store PII in dedicated, access-controlled tables

## Access
- [ ] Implement role-based access control (RBAC)
- [ ] Log all access to sensitive PII fields
- [ ] Mask PII in non-production environments
- [ ] Restrict API responses to mask PII where possible

## Retention & Deletion
- [ ] Define retention periods per PII type
- [ ] Implement automated purging of expired data
- [ ] Anonymise instead of delete where required

## Incident Response
- [ ] PII breach detection mechanism in place
- [ ] 72-hour breach notification process defined
- [ ] Affected individuals notification template ready
