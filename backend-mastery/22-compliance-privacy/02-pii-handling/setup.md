# Setup Guide – PII Handling

## Prerequisites
- Node.js 18+
- PostgreSQL 13+

## 1. Install Dependencies
```bash
npm install crypto pg
```

## 2. Generate Encryption Key
```js
const { generateKey } = require('./encryption');
console.log(generateKey()); // copy into .env as PII_ENCRYPTION_KEY
```

## 3. Add to .env
```
PII_ENCRYPTION_KEY=<64-char hex string from above>
```

## 4. Use Encryption in Your Models
```js
const { encryptFields, decryptFields } = require('./encryption');

// Before saving to DB:
const safeUser = encryptFields(user, ['ssn', 'aadhaar', 'creditCard']);

// After reading from DB:
const plainUser = decryptFields(dbUser, ['ssn', 'aadhaar', 'creditCard']);
```

## 5. Apply Middleware
```js
const { maskResponsePII, auditRequestPII } = require('./middleware');

// Audit all PII in incoming requests
app.use(auditRequestPII);

// Mask PII in admin list endpoints
app.get('/admin/users', maskResponsePII, listUsersHandler);
```

## 6. Use the Classifier to Scan Data
```js
const { classifyObjectFields, scanStringForPII } = require('./classifier');
const findings = classifyObjectFields({ email: 'a@b.com', name: 'John' });
console.log(findings);
// [{ field: 'email', category: 'email', value: 'a@b.com' }, ...]
```
