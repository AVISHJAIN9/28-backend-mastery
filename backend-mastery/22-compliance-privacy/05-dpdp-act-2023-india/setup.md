# Setup Guide – DPDP Act 2023

## 1. Install Dependencies
```bash
npm install pg uuid dotenv
```

## 2. Run DB Migration
```js
const { Pool } = require('pg');
const { MIGRATION_SQL } = require('./schema');
const pool = new Pool();
await pool.query(MIGRATION_SQL);
```

## 3. Mount Rights Request API
```js
const { submitDPDPRequest, getDPDPRequests } = require('./dpdpService');

// Submit a rights request
router.post('/dpdp/request', async (req, res) => {
  const result = await submitDPDPRequest(req.user.id, req.body.type, req.body.payload);
  res.json(result);
});

// List requests for a user
router.get('/dpdp/requests', async (req, res) => {
  res.json(await getDPDPRequests(req.user.id));
});
```

## 4. Serve Multilingual Consent Notices
```js
const { generateConsentNotice } = require('./consentNotice');

router.get('/consent-notice', (req, res) => {
  const lang = req.query.lang || 'en';
  res.json(generateConsentNotice(lang, '1.0', 'Your Company Name'));
});
```

## 5. Check Cross-Border Transfer Eligibility
```js
const { isTransferPermitted } = require('./dpdpService');

if (!isTransferPermitted(destinationCountry)) {
  throw new Error(`Cross-border transfer to ${destinationCountry} not permitted under DPDP Act`);
}
```

## 6. Appoint a Grievance Officer
Add to your website's Privacy Policy:
```
Grievance Officer: [Name]
Email: grievance@yourcompany.com
Response time: 7 days as required by DPDP Act 2023
```
