# Setup Guide – Data Retention Policies

## 1. Install Dependencies
```bash
npm install pg dotenv
```

## 2. Run DB Migration
```bash
node -e "require('dotenv').config(); const {Pool}=require('pg'); const {MIGRATION_SQL}=require('./schema'); const p=new Pool(); p.query(MIGRATION_SQL).then(()=>{console.log('Done');p.end()});"
```

## 3. Schedule the Purge Job
Add to crontab (runs daily at 2am):
```bash
crontab -e
# Add:
0 2 * * * cd /path/to/project && node 22-compliance-privacy/04-data-retention-policies/purgeJob.js >> /var/log/retention-purge.log 2>&1
```

Or use a Node scheduler:
```js
const cron = require('node-cron');
cron.schedule('0 2 * * *', () => require('./purgeJob').runPurgeJob());
```

## 4. Use the Policy Engine in Your Code
```js
const { checkRetentionDue, getAllPolicies } = require('./retentionPolicy');

// Check if a specific record is due for action
const { isDue, action, expiresAt } = checkRetentionDue('marketing_data', record.collectedAt);
if (isDue) { /* delete or anonymise */ }

// Get all policies for a dashboard
const policies = getAllPolicies();
```

## 5. Test the Purge Job
```bash
# Dry run: check what would be purged without deleting
DB_NAME=test_db node purgeJob.js
```
