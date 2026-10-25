# Setup Guide – GDPR Compliance Basics

## 1. Install Dependencies
```bash
npm install pg uuid dotenv
```

## 2. Evaluate Lawful Basis
```js
const { suggestLawfulBasis, getLawfulBasis } = require('./lawfulBasis');

// Get a suggestion based on processing description
const suggestions = suggestLawfulBasis('send marketing emails to opted-in users');
// → ['consent']

// Get full details
const basis = getLawfulBasis('consent');
console.log(basis.requirements); // ['Freely given', 'Specific', ...]
```

## 3. Build Your ROPA
```js
const { addROPAEntry, exportROPA, SAMPLE_ROPA_ENTRIES } = require('./ropa');

// Bootstrap with sample entries
for (const entry of SAMPLE_ROPA_ENTRIES) {
  await addROPAEntry(entry);
}

// Export for DPO review
const ropa = await exportROPA();
```

## 4. Screen for DPIA Requirement
```js
const { screenForDPIA, generateDPIATemplate } = require('./dpia');

const screen = screenForDPIA('AI-based profiling to predict user churn using health data');
if (screen.required) {
  console.log('DPIA required. Triggers:', screen.triggers);
  const template = generateDPIATemplate({ name: 'Churn Prediction Model' });
}
```

## 5. Breach Notification Workflow
```js
const { recordBreach, markAuthorityNotified, requiresSubjectNotification } = require('./breachNotification');

// When a breach is detected:
const breach = await recordBreach({
  description: 'Unauthorised access to user email database',
  dataCategories: ['email', 'name'],
  estimatedSubjectsAffected: 1500,
  riskLevel: 'high',
  discovered_by: 'security_team',
});

console.log(`Notify authority by: ${breach.notifyAuthorityBy}`); // 72 hours

if (requiresSubjectNotification(breach.riskLevel)) {
  // Send notification to affected users
}

// After notifying the ICO/DPA:
await markAuthorityNotified(breach.breachId, { referenceNumber: 'ICO-2026-001' });
```

## 6. Run DB Migration for Breach Records
```sql
CREATE TABLE IF NOT EXISTS breach_incidents (
  id                         UUID PRIMARY KEY,
  description                TEXT NOT NULL,
  data_categories            TEXT[],
  estimated_subjects         INTEGER,
  risk_level                 TEXT NOT NULL,
  discovered_by              TEXT,
  root_cause                 TEXT,
  discovered_at              TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  notify_authority_by        TIMESTAMPTZ NOT NULL,
  authority_notified_at      TIMESTAMPTZ,
  authority_notification     JSONB,
  subjects_notified_at       TIMESTAMPTZ,
  subjects_notification_method TEXT,
  subjects_notified_count    INTEGER,
  status                     TEXT NOT NULL DEFAULT 'open',
  created_at                 TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

CREATE TABLE IF NOT EXISTS ropa_entries (
  id                         UUID PRIMARY KEY,
  name                       TEXT NOT NULL,
  purpose                    TEXT NOT NULL,
  lawful_basis               TEXT NOT NULL,
  data_categories            TEXT[],
  data_subject_categories    TEXT[],
  recipients                 TEXT,
  retention_period           TEXT,
  cross_border_transfers     JSONB DEFAULT '[]',
  technical_measures         TEXT,
  dpia_required              BOOLEAN DEFAULT false,
  dpia_completed             BOOLEAN DEFAULT false,
  created_at                 TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  updated_at                 TIMESTAMPTZ NOT NULL DEFAULT NOW()
);
```
