# Setup Guide – GDPR Right to Erasure

## Prerequisites
- Node.js 18+
- PostgreSQL 13+
- SMTP server (or use Mailtrap for dev)

## 1. Install Dependencies
```bash
npm install express pg uuid nodemailer
```

## 2. Configure Environment
```bash
cp .env.example .env
```
Fill in your database credentials, SMTP settings, and grace period.

## 3. Run Database Migration
Connect to your PostgreSQL instance and run:
```sql
CREATE TABLE IF NOT EXISTS erasure_requests (
  id UUID PRIMARY KEY,
  user_id TEXT NOT NULL,
  reason TEXT NOT NULL,
  status TEXT NOT NULL DEFAULT 'pending',
  scheduled_at TIMESTAMPTZ NOT NULL,
  completed_at TIMESTAMPTZ,
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

CREATE INDEX idx_erasure_user_id ON erasure_requests(user_id);
CREATE INDEX idx_erasure_status ON erasure_requests(status);
```

## 4. Mount Routes in Your App
```js
const express = require('express');
const app = express();

app.use(express.json());
app.use(authMiddleware); // Your existing auth middleware

const erasureRouter = require('./22-compliance-privacy/01-gdpr-right-to-erasure/routes');
app.use('/api/erasure', erasureRouter);
```

## 5. Schedule Automated Processing
Set up a cron job or scheduled task to process due erasure requests:
```bash
# Run daily at 2am
0 2 * * * node /path/to/scripts/process-due-erasures.js
```

## 6. Test the Flow
1. POST `/api/erasure/request` with `{ userId, reason }`
2. Check email for acknowledgement
3. GET `/api/erasure/:id/status`
4. POST `/api/erasure/:id/process` (admin)
5. Verify data anonymised in DB
