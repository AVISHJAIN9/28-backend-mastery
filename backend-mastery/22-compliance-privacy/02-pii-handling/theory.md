# Theory – PII Handling

## What is PII?
Personally Identifiable Information (PII) is any information that can be used to identify an individual, either alone or in combination with other data.

## Categories of PII
| Category | Examples | Risk |
|----------|---------|------|
| Direct identifiers | Name, email, phone, SSN, Aadhaar | High |
| Quasi-identifiers | DOB, postcode, gender | Medium (linkage risk) |
| Sensitive PII | Health, financial, biometric, religious data | Very High |
| Online identifiers | IP address, cookies, device IDs | Medium |

## Key Principles (GDPR Art. 5)
1. **Lawfulness, fairness, transparency** – process PII only with a legal basis
2. **Purpose limitation** – collect only for specified, explicit purposes
3. **Data minimisation** – collect only what is necessary
4. **Accuracy** – keep data up to date
5. **Storage limitation** – do not keep data longer than needed
6. **Integrity and confidentiality** – protect against unauthorised access

## Technical Safeguards
- **Encryption at rest**: Encrypt PII columns in the database
- **Encryption in transit**: Always use TLS/HTTPS
- **Field-level encryption**: For the most sensitive fields (SSN, card numbers)
- **Masking/redaction**: Show only partial data to operators
- **Pseudonymisation**: Replace direct identifiers with tokens
- **Access control**: Least-privilege access to PII

## Indian Context: DPDP Act 2023
The Digital Personal Data Protection Act 2023 mirrors many GDPR principles and specifically governs personal data of Indian citizens. See module 05 for details.
