# Setup Guide – Consent Management

## 1. Install Dependencies
```bash
npm install pg uuid
```

## 2. Run Migration
```bash
node -e "
const { Pool } = require('pg');
const { MIGRATION_SQL } = require('./schema');
const pool = new Pool({ connectionString: process.env.DATABASE_URL });
pool.query(MIGRATION_SQL).then(() => { console.log('Done'); pool.end(); });
"
```

## 3. Mount API Routes
```js
const express = require('express');
const { getUserConsents, saveUserConsents, withdrawConsent, getConsentHistory } = require('./consentService');

router.get('/:userId', async (req, res) => res.json(await getUserConsents(req.params.userId)));
router.post('/:userId', async (req, res) => { await saveUserConsents(req.params.userId, req.body, { source: 'preference_centre', ipAddress: req.ip }); res.json({ ok: true }); });
router.delete('/:userId/:category', async (req, res) => { await withdrawConsent(req.params.userId, req.params.category); res.json({ ok: true }); });
router.get('/:userId/history', async (req, res) => res.json(await getConsentHistory(req.params.userId)));
```

## 4. Gate Routes with Consent Middleware
```js
const { requireConsent } = require('./middleware');

// Only send newsletter if user has marketing_email consent
router.post('/newsletter/send', requireConsent('marketing_email'), sendNewsletterHandler);
```

## 5. Collect Consent at Signup
```js
await saveUserConsents(newUser.id, {
  marketing_email: signupForm.marketingOptIn,
  analytics: true,   // legitimate interest – document reasoning
}, { version: '2.1', source: 'signup_form', ipAddress: req.ip });
```
