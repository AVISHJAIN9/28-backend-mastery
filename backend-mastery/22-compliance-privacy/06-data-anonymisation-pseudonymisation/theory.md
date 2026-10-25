# Theory – Anonymisation & Pseudonymisation

## Anonymisation
Truly anonymised data falls **outside the scope of GDPR** (Recital 26). Anonymisation means data can no longer be attributed to an identified or identifiable person — even by the data controller.

### Techniques
| Technique | Description | Example |
|-----------|------------|---------|
| Suppression | Remove a field entirely | Remove name field |
| Generalisation | Replace specific value with a range/category | Age 34 → "30-39" |
| Noise addition | Add random perturbation | Salary 85,000 → 87,400 |
| Aggregation | Report group statistics, not individual values | Average salary by department |
| Data swapping | Swap values between records | Shuffle postcodes |
| Synthetic data | Generate statistically similar fake data | Generate new records from model |

### k-Anonymity
A dataset is k-anonymous if every record is indistinguishable from at least k-1 others based on quasi-identifiers. Aim for k ≥ 5 for published datasets.

## Pseudonymisation
Pseudonymised data IS still personal data under GDPR (Art. 4(5)), because re-identification is possible with the mapping key. However, it is a recommended security measure (Art. 25, 32) and reduces breach impact.

### Techniques
| Technique | Description | Reversible |
|-----------|------------|-----------|
| Tokenisation | Replace value with random token (stored in mapping table) | Yes |
| Encryption | Encrypt with a key | Yes |
| HMAC | Hash with secret salt | No (one-way) |
| Format-preserving encryption | Encrypts maintaining format (e.g. card numbers) | Yes |

## When to Use Which
- **Anonymise**: Analytics, ML training data, published datasets, research
- **Pseudonymise**: Internal analytics, test data, data shared with processors, breach risk reduction

## References
- GDPR Recital 26 – Anonymisation
- GDPR Article 4(5) – Pseudonymisation definition
- GDPR Article 25 – Data protection by design (pseudonymisation recommended)
- GDPR Article 32 – Security measures (pseudonymisation recommended)
- ICO Anonymisation Code of Practice
