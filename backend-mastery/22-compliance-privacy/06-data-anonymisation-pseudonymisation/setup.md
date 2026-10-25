# Setup Guide – Anonymisation & Pseudonymisation

## 1. Install Dependencies
```bash
npm install pg crypto dotenv
```

## 2. Set Environment Variables
```
ANONYMISATION_SALT=your-random-salt-here-32-chars
DB_HOST=localhost
DB_PORT=5432
DB_NAME=compliance_db
DB_USER=postgres
DB_PASSWORD=your_password
```

## 3. Run Pseudonym Mapping Table Migration
```sql
CREATE TABLE IF NOT EXISTS pseudonym_mappings (
  token          TEXT PRIMARY KEY,
  original_value TEXT NOT NULL,
  field_type     TEXT NOT NULL,
  created_at     TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  UNIQUE(original_value, field_type)
);
-- Restrict access:
REVOKE ALL ON pseudonym_mappings FROM PUBLIC;
GRANT SELECT, INSERT, DELETE ON pseudonym_mappings TO pseudonym_service_role;
```

## 4. Anonymise a Dataset for Analytics
```js
const { anonymiseDataset } = require('./anonymise');

const rawUsers = await db.query('SELECT * FROM users');
const anonUsers = anonymiseDataset(rawUsers.rows);
// Safe to use in analytics, ML training, or export
```

## 5. Pseudonymise Records Before Sharing with a Processor
```js
const { pseudonymiseRecord } = require('./pseudonymise');

const record = await db.findUser(userId);
const safe = await pseudonymiseRecord(record, ['email', 'phone', 'name']);
await sendToProcessor(safe); // processor never sees real PII
```

## 6. Reverse Pseudonymisation (Authorised Service Only)
```js
const { depseudonymise } = require('./pseudonymise');

const { value, fieldType } = await depseudonymise('PSE_A3F9B2C1D8...');
```

## 7. Clean Up Mappings on Erasure
```js
const { deletePseudonymMappings } = require('./pseudonymise');

// Called as part of erasure workflow
await deletePseudonymMappings([user.email, user.phone, user.name]);
```
