# Data Export & GDPR Portability

## The Right to Data Portability

**GDPR (EU General Data Protection Regulation)**: Users have the right to receive and reuse their personal data across services.

### GDPR Requirements
```
Article 20: Right to Data Portability
✓ Must provide data in "structured, commonly used, machine-readable format"
✓ Requested data must be provided "as soon as possible" (typically 30 days)
✓ User can request export for another service to import ("Right to be forgotten")
✓ Must be provided free (exception: excessive requests can be refused)
✓ First request per year is free (additional requests may be charged)
```

### Similar Laws
- **CCPA** (California): "Right to know, right to delete"
- **LGPD** (Brazil): "Right to data portability"
- **Australia Privacy Act**: "Australian Privacy Principles"

---

## Data Export Types

### 1. Full Data Export
```javascript
{
  type: 'FULL_DATA_EXPORT',
  user_id: 'user-1',
  included: [
    'user_profile',      // Name, email, phone, address
    'documents',         // All files created/owned
    'activity_log',      // All their actions
    'comments',          // Comments on docs
    'profile_photos',    // Attachments
    'settings',          // Preferences
    'billing_history'    // Payments, invoices
  ]
}
```

### 2. Personal Data Only (GDPR Articles 15, 20)
```javascript
{
  type: 'PERSONAL_DATA_EXPORT',
  user_id: 'user-1',
  included: [
    'user_profile',      // Direct identifiers
    'activity_log',      // When they accessed what
    'decisions_made'     // Automated decisions about them
  ],
  excluded: [
    'documents_owned_by_others', // Data about organization
    'analytics'                   // Aggregate stats
  ]
}
```

### 3. Right to Delete (GDPR Article 17)
```javascript
{
  type: 'ACCOUNT_DELETION',
  user_id: 'user-1',
  grace_period: 30, // Days to change mind
  intent: 'permanently_delete',
  action_items: [
    'export data (for user)',
    'anonymize user profile',
    'delete documents owned by user',
    'delete activity logs',
    'delete comments',
    'revoke permissions'
  ]
}
```

---

## Export Formats

### JSON (Most Common)
```json
{
  "export_date": "2025-01-15T10:30:00Z",
  "user": {
    "id": "user-1",
    "email": "alice@example.com",
    "created_at": "2023-01-01",
    "profile": {
      "first_name": "Alice",
      "last_name": "Smith",
      "avatar_url": "..."
    }
  },
  "documents": [
    {
      "id": "doc-1",
      "title": "Q1 Report",
      "created_at": "2024-05-10",
      "content": "..."
    }
  ],
  "activity": [
    {
      "timestamp": "2025-01-15T09:00:00Z",
      "action": "DOCUMENT_CREATED",
      "resource": "doc-1"
    }
  ]
}
```

### CSV (Spreadsheet Friendly)
```csv
id,email,first_name,last_name,created_at
user-1,alice@example.com,Alice,Smith,2023-01-01

# Documents
doc_id,title,content,created_at
doc-1,Q1 Report,..content..,2024-05-10
```

### Portable Format (ZIP Archive)
```
export-2025-01-15.zip
├── README.md          # How to import
├── manifest.json      # What's included + timestamps
├── user.json          # Profile
├── documents/
│   ├── doc-1.json
│   ├── doc-2.json
│   └── attachments/
│       └── image.png
├── activity.csv       # Login/action history
└── billing/
    └── invoices.pdf
```

---

## Export Request Workflow

### State Machine
```
PENDING 
  ↓ [User confirms]
PROCESSING (In progress, may take hours)
  ├─ Generate export
  ├─ Create archive
  ├─ Validate completeness
  ↓
COMPLETED (Ready to download)
  ├─ Store in S3/Cloud Storage
  ├─ Generate signed download link
  ├─ Send email with link
  ├─ Available for 7 days
  ↓
EXPIRED (Automatically deleted after 7+ days)
```

### Database Schema Pattern
```javascript
const exportRequests = {
  'export-1': {
    id: 'export-1',
    tenant_id: 'tenant-1',
    user_id: 'user-1',
    
    // Request metadata
    requested_at: '2025-01-15T10:00:00Z',
    requested_by: 'user-1', // Could be admin requesting on behalf
    
    // Export parameters
    type: 'FULL_DATA_EXPORT', // or PERSONAL_DATA_EXPORT
    format: 'json',
    
    // Status tracking
    status: 'processing', // pending, processing, completed, failed, expired
    progress: 45, // Percent
    
    // Completion details
    completed_at: null,
    download_url: null,
    file_size: null,
    expires_at: null, // Delete after this date
    
    // Error tracking
    error: null,
    attempted_count: 1,
    last_attempted: '2025-01-15T10:05:00Z'
  }
};
```

---

## Export Processing Pipeline

### Async Job Queue
```javascript
// 1. User requests export
app.post('/api/export', verifyToken, async (req, res) => {
  const request = {
    id: generateId(),
    user_id: req.user.id,
    tenant_id: req.tenant_id,
    type: req.body.type,
    format: req.body.format || 'json',
    status: 'pending',
    requested_at: new Date()
  };
  
  db.exportRequests.insert(request);
  
  // Queue async job
  jobQueue.add('export_data', {
    export_request_id: request.id
  }, { delay: 0 });
  
  res.json({ 
    success: true,
    export_id: request.id,
    message: 'Export started. Check back in a few minutes.'
  });
});

// 2. Background worker processes it
jobQueue.process('export_data', async (job) => {
  const export_id = job.data.export_request_id;
  const request = db.exportRequests.findById(export_id);
  
  try {
    // Update status
    request.status = 'processing';
    db.exportRequests.update(request);
    
    // Collect data
    const user = getUser(request.user_id);
    const documents = getDocumentsForUser(request.user_id);
    const activity = getActivityLogs(request.user_id);
    
    // Package it
    const archive = createArchive({
      user,
      documents,
      activity,
      format: request.format
    });
    
    // Upload to cloud
    const url = await uploadToS3(archive, {
      bucket: 'exports',
      key: `${request.user_id}/${export_id}.zip`,
      expiry: 7 * 86400 // 7 days
    });
    
    // Mark complete
    request.status = 'completed';
    request.download_url = url;
    request.completed_at = new Date();
    request.expires_at = new Date(Date.now() + 7 * 86400000);
    db.exportRequests.update(request);
    
    // Notify user
    sendEmail(user.email, {
      subject: 'Your data export is ready',
      body: `Download: ${url}\nExpires in 7 days`
    });
    
  } catch (error) {
    request.status = 'failed';
    request.error = error.message;
    request.attempted_count += 1;
    
    // Retry in 1 hour
    if (request.attempted_count < 3) {
      jobQueue.add('export_data', 
        { export_request_id: export_id },
        { delay: 3600000 }
      );
    }
    
    db.exportRequests.update(request);
    logger.error('Export failed', { export_id, error });
  }
});

// 3. User checks status
app.get('/api/export/:id', verifyToken, (req, res) => {
  const request = db.exportRequests.findById(req.params.id);
  
  if (request.user_id !== req.user.id) {
    return res.status(403).json({ error: 'Forbidden' });
  }
  
  res.json({
    status: request.status,
    progress: request.progress,
    ...(request.status === 'completed' && {
      download_url: request.download_url,
      expires_at: request.expires_at
    }),
    ...(request.status === 'failed' && {
      error: request.error
    })
  });
});
```

---

## Right to Deletion (Erasure)

### Deletion Request Flow
```
User requests deletion
  ↓
30-day grace period (time to change mind)
  ├─ User can cancel anytime
  ├─ Data is hidden but not deleted
  ↓
Auto-delete after 30 days
  ├─ Anonymize user record
  ├─ Delete user documents/files
  ├─ Archive activity logs (for compliance)
  ├─ Null out user references
```

### Soft Delete + Scheduled Hard Delete
```javascript
const deletionRequests = {
  'deletion-1': {
    id: 'deletion-1',
    user_id: 'user-1',
    tenant_id: 'tenant-1',
    
    // Request
    requested_at: '2025-01-15T10:00:00Z',
    request_reason: 'Just leaving the service',
    
    // Grace period
    grace_period_ends: '2025-02-14T10:00:00Z', // 30 days
    status: 'pending_deletion', // or deleted, cancelled
    
    // Deletion details
    deleted_at: null,
    deleted_by: 'system',
    
    // What to delete
    actions: [
      { type: 'hide_profile', status: 'pending' },
      { type: 'delete_documents', status: 'pending' },
      { type: 'anonymize_activity', status: 'pending' }
    ]
  }
};

// Request deletion
app.post('/api/account/delete', verifyToken, (req, res) => {
  const { reason } = req.body;
  
  const deletion = {
    id: generateId(),
    user_id: req.user.id,
    tenant_id: req.tenant_id,
    requested_at: new Date(),
    request_reason: reason,
    grace_period_ends: new Date(Date.now() + 30 * 86400000),
    status: 'pending_deletion'
  };
  
  db.deletionRequests.insert(deletion);
  
  // Hide profile immediately
  db.users.update(req.user.id, { hidden: true });
  
  res.json({ 
    success: true,
    message: `Account will be permanently deleted on ${deletion.grace_period_ends}`,
    cancel_url: `/api/account/cancel-deletion`
  });
});

// Cancel deletion (within grace period)
app.post('/api/account/cancel-deletion', verifyToken, (req, res) => {
  const deletion = db.deletionRequests.findOne({
    user_id: req.user.id,
    status: 'pending_deletion'
  });
  
  if (!deletion) {
    return res.status(404).json({ error: 'No deletion request found' });
  }
  
  if (new Date() > deletion.grace_period_ends) {
    return res.status(400).json({ error: 'Grace period expired' });
  }
  
  // Restore
  deletion.status = 'cancelled';
  db.deletionRequests.update(deletion);
  db.users.update(req.user.id, { hidden: false });
  
  res.json({ success: true, message: 'Account restoration complete' });
});

// Scheduled job: Execute deletions after grace period
const executeScheduledDeletions = () => {
  const expired = db.deletionRequests.find({
    status: 'pending_deletion',
    grace_period_ends: { $lt: new Date() }
  });
  
  expired.forEach(deletion => {
    const user = db.users.findById(deletion.user_id);
    
    // Execute deletion
    hardDeleteUser(user.id); // Remove all traces
    
    deletion.status = 'deleted';
    deletion.deleted_at = new Date();
    db.deletionRequests.update(deletion);
    
    logger.info('User permanently deleted', { 
      user_id: user.id,
      reason: deletion.request_reason
    });
  });
};

setInterval(executeScheduledDeletions, 24 * 3600 * 1000); // Daily
```

---

## Data Portability Interoperability

### Standard Formats
```javascript
// Allow export in formats that competitors support
const export_formats = {
  'json': 'Standard JSON (universal)',
  'csv': 'Comma-separated values (Excel)',
  'xml': 'XML format (legacy systems)',
  'ical': 'iCalendar (for calendar apps)',
  'vcard': 'vCard format (for contacts)',
  'pdf': 'PDF with embedded data'
};

// Example: Export compatible with other tools
const exportForImport = (user_id, target_platform) => {
  if (target_platform === 'notion') {
    return exportAsNotion(user_id); // Their format
  } else if (target_platform === 'google-drive') {
    return exportAsGoogleDocs(user_id);
  } else {
    return exportAsStandardJSON(user_id);
  }
};
```

### Import Friendly Documentation
```markdown
# How to Import Your Data

## To Notion
1. Open Notion
2. Create new database
3. Use CSV import: Data → Import → CSV
4. Upload documents.csv from your export

## To Google Drive
1. Open Google Drive
2. Right-click → New → Upload file
3. Select the PDF export

## To Excel
1. Open Excel
2. File → Open → Select activity.csv
```

---

## Real-World Compliance Failure

### Vulnerability: Incomplete Export
```javascript
// VULNERABLE: Doesn't include all user data
const exportUserData = (user_id) => {
  return {
    user: getUser(user_id),
    documents: getDocuments(user_id)
    // Forgot: comments, shared_items, activity_logs, preferences
  };
};
```

### Defense: Complete Audit
```javascript
// SECURE: Export everything from user's perspective
const completeUserExport = (user_id) => {
  return {
    // Personal info
    profile: getProfile(user_id),
    preferences: getPreferences(user_id),
    
    // Content
    documents: getDocumentsOwnedBy(user_id),
    comments: getCommentsBy(user_id),
    
    // Relationships
    shared_with_me: getDocumentsSharedWith(user_id),
    team_memberships: getTeamMemberships(user_id),
    
    // Activity
    activity_logs: getActivityLogs(user_id),
    login_history: getLogins(user_id),
    
    // Billing
    payments: getPaymentHistory(user_id),
    invoices: getInvoices(user_id),
    
    // Tracking
    analytics_profile: getAnalyticsData(user_id)
  };
};

// Verify completeness
const validateExport = (export_data) => {
  const sections = Object.keys(export_data);
  const minExpected = 8;
  
  if (sections.length < minExpected) {
    logger.warn('Incomplete export', { sections_found: sections.length });
  }
};
```

---

## Performance: Large Data Exports

### Streaming Export
```javascript
// Don't load entire export into memory
const streamExport = (user_id, format, res) => {
  res.setHeader('Content-Type', 'application/zip');
  res.setHeader('Content-Disposition', 'attachment; filename=export.zip');
  
  const zip = new ZipStream();
  const pipeline = pipeline(
    zip,
    res,
    (err) => {
      if (err) logger.error('Stream error', err);
    }
  );
  
  // Stream large sections
  zip.entry(
    'user.json',
    JSON.stringify(getProfile(user_id))
  );
  
  // Documents: 1000s at a time
  for (const doc of streamDocuments(user_id)) {
    zip.entry(
      `documents/${doc.id}.json`,
      JSON.stringify(doc)
    );
  }
  
  // Activity logs: batched
  for (const batch of batchActivityLogs(user_id, 1000)) {
    zip.entry(
      `activity/${batch.id}.csv`,
      convertToCSV(batch)
    );
  }
  
  zip.finish();
};
```

---

## Best Practices

✅ **Default export = complete data** - Include everything accessible to user  
✅ **Provide multiple formats** - JSON, CSV, human-readable PDFs  
✅ **Grace period for deletion** - 30 days to change mind  
✅ **Make exports portable** - Use open formats, not proprietary  
✅ **Document import process** - How to import to competitor services  
✅ **Automated cleanup** - Delete expired exports, execute scheduled deletions  
✅ **Audit trail** - Log every export request and deletion for compliance  

---

## Related Patterns

- **Module 01**: Row-level isolation - Only export user's own data
- **Module 02**: Role-based access - Only admins can export other users' data
- **Module 06**: Audit logs - Track all export requests (for auditors)