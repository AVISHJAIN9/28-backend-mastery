# Theory – GDPR Right to Erasure (Article 17)

## What is the Right to Erasure?
The Right to Erasure (also called the "Right to be Forgotten") gives individuals the right to request that their personal data be deleted. It is enshrined in **Article 17 of the GDPR**.

## When Must You Erase Data?
An organisation must erase personal data when:
1. The data is **no longer necessary** for the purpose it was collected
2. The individual **withdraws consent** (and no other lawful basis applies)
3. The individual **objects** to processing and there are no overriding legitimate grounds
4. The data has been **unlawfully processed**
5. Erasure is required to comply with a **legal obligation**
6. The data was collected in relation to an **offer of information society services to a child**

## When Can You Refuse?
Erasure is NOT required when processing is necessary for:
- Exercising freedom of expression and information
- Compliance with a legal obligation
- Public health interests (Art. 9(2)(h) and (i))
- Archiving, research, or statistical purposes
- Establishing, exercising, or defending legal claims

## Timelines (Art. 12)
- **Acknowledge** within: 72 hours (best practice)
- **Complete or refuse** within: 1 month
- **Extension**: Up to 2 additional months for complex/multiple requests (notify the individual)

## Technical Considerations
- **Cascading deletes**: Ensure data is removed from all databases, microservices, caches, and logs
- **Backups**: Data must be removed from backups within the normal backup rotation cycle
- **Anonymisation**: Where deletion is impractical, anonymise so data can no longer be attributed to an individual
- **Sub-processors**: Notify all third-party processors to also erase the data

## GDPR References
- Article 17 – Right to erasure
- Article 12 – Transparent information and communication
- Article 4(1) – Definition of personal data
- Recital 65 – Rationale for the right to erasure
- Recital 66 – Measures to erase in online environments
