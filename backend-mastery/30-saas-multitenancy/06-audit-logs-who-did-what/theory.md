# Audit Logs: Who Did What When

## Why Audit Logs Matter

Audit logs are the "security camera" of your SaaS. They answer:
- **Compliance**: "Prove users can only access their own data" (SOC 2, HIPAA, GDPR)
- **Forensics**: "Who deleted that important document?" (Troubleshooting incidents)
- **Security**: "Were there unauthorized access patterns?" (Detecting breaches)
- **Accountability**: "Which employee accessed customer data?" (Internal control)

---

## Core Audit Trail Data Model

Every significant action must be logged with these fields:

```javascript
{
  id: 'audit-12345',
  tenant_id: 'tenant-1',
  actor: {
    user_id: 'user-1',
    user_name: 'alice@example.com',
    actor_type: 'user' // or 'admin', 'system', 'api_key'
  },
  action: 'DOCUMENT_DELETE',
  resource: {
    resource_type: 'document',
    resource_id: 'doc-456',
    resource_name: 'Q1-Report.pdf'
  },
  status: 'success', // or 'failure'
  status_code: 200,
  result: {
    changes: { status: 'draft' → 'deleted' },
    rows_affected: 1
  },
  request: {
    ip_address: '192.0.2.1',
    user_agent: 'Mozilla/5.0...',
    method: 'DELETE',
    path: '/api/documents/doc-456'
  },
  timestamp: '2025-01-15T10:30:00Z',
  error: null // If failed, error message
}
```

### Minimum Required Fields
```javascript
const requiredFields = [
  'tenant_id',      // Who owns this log
  'actor_id',       // Who did it
  'action',         // What did they do
  'resource_id',    // To what
  'timestamp',      // When
  'status',         // Did it work?
  'ip_address'      // From where
];
```

---

## Actions to Log (Events)

### User Management
```javascript
const auditActions = {
  'USER_LOGIN': 'User signed in',
  'USER_LOGIN_FAILED': 'Failed login attempt',
  'USER_LOGOUT': 'User signed out',
  'USER_CREATED': 'New user added to organization',
  'USER_RENAMED': 'User name/email changed',
  'USER_ROLE_CHANGED': 'User permissions modified',
  'USER_DELETED': 'User removed from organization',
  
  // Data Operations
  'DOCUMENT_CREATED': 'New document created',
  'DOCUMENT_UPDATED': 'Document modified',
  'DOCUMENT_DELETED': 'Document destroyed',
  'DOCUMENT_ACCESSED': 'Document viewed',
  'DOCUMENT_EXPORTED': 'Document downloaded/exported',
  'DOCUMENT_SHARED': 'Document shared with another user',
  
  // Billing & Account
  'PLAN_UPGRADED': 'Subscription tier increased',
  'PLAN_DOWNGRADED': 'Subscription tier decreased',
  'PAYMENT_SUCCEEDED': 'Payment processed',
  'PAYMENT_FAILED': 'Payment declined',
  'BILLING_UPDATED': 'Payment method changed',
  
  // Security & Admin
  'API_KEY_CREATED': 'New API key generated',
  'API_KEY_DELETED': 'API key revoked',
  'PASSWORD_CHANGED': 'User changed password',
  'PASSWORD_RESET': 'Admin reset user password',
  'SSO_CONFIGURED': 'Single sign-on enabled',
  'ADMIN_ACTION': 'Administrator operation',
  'PERMISSION_CHANGED': 'Access control modified'
};
```

---

## Logging Pattern with Middleware

### Automatic Logging
```javascript
// Middleware to auto-log all mutating operations
const auditLog = async (req, res, next) => {
  const originalSend = res.send;
  let responseData = null;
  
  res.send = function(data) {
    responseData = data;
    return originalSend.call(this, data);
  };
  
  res.on('finish', async () => {
    // Only log mutating operations (POST, PUT, DELETE)
    if (['POST', 'PUT', 'DELETE'].includes(req.method)) {
      await logAuditEvent({
        tenant_id: req.tenant_id,
        actor_id: req.user?.id,
        action: mapPathToAction(req.method, req.path),
        resource_id: extractResourceId(req),
        status: res.statusCode < 400 ? 'success' : 'failure',
        status_code: res.statusCode,
        ip_address: req.ip,
        user_agent: req.get('user-agent'),
        timestamp: new Date(),
        request_body: sanitize(req.body)
      });
    }
  });
  
  next();
};

app.use(auditLog);
```

### Manual Logging for Specific Actions
```javascript
app.post('/api/documents', verifyToken, async (req, res) => {
  const doc = await createDocument(req.body);
  
  // Explicitly log this important action
  await logAuditEvent({
    tenant_id: req.tenant_id,
    actor_id: req.user.id,
    action: 'DOCUMENT_CREATED',
    resource_type: 'document',
    resource_id: doc.id,
    resource_name: doc.title,
    status: 'success',
    ip_address: req.ip,
    timestamp: new Date(),
    details: { pages: doc.page_count }
  });
  
  res.json(doc);
});
```

---

## Audit Log Retention Policies

### Time-Based Retention
```javascript
const retentionPolicy = {
  'SUCCESS': 90, // Keep successful actions 90 days
  'AUTH_FAILURE': 365, // Keep failed logins 1 year (security)
  'DELETE': 2555, // Keep deletes 7 years (compliance)
  'PAYMENT': 2555 // Keep payment logs forever (tax)
};

// Cleanup job
const cleanupOldLogs = async () => {
  const now = Date.now();
  
  for (const [action, retentionDays] of Object.entries(retentionPolicy)) {
    const cutoffDate = new Date(now - retentionDays * 86400000);
    
    await db.auditLogs.deleteMany({
      action,
      timestamp: { $lt: cutoffDate }
    });
  }
};

// Run daily
setInterval(cleanupOldLogs, 24 * 3600 * 1000);
```

### Size-Based Retention
```javascript
// Keep only past 10 million audit events (limit database size)
const cleanupBySize = async () => {
  const count = await db.auditLogs.countDocuments();
  const maxLogs = 10000000;
  
  if (count > maxLogs) {
    const toDelete = count - maxLogs;
    const oldestLogs = await db.auditLogs
      .find({})
      .sort({ timestamp: 1 })
      .limit(toDelete);
    
    await db.auditLogs.deleteMany({
      _id: { $in: oldestLogs.map(l => l._id) }
    });
  }
};
```

---

## Searching & Filtering Audit Logs

### Filter by Actor (Who?)
```javascript
app.get('/api/audit', verifyToken, checkPermission('view_audit'), (req, res) => {
  const filter = {};
  
  if (req.query.user_id) {
    filter['actor.user_id'] = req.query.user_id;
  }
  
  if (req.query.actor_type) {
    filter['actor.actor_type'] = req.query.actor_type; // 'user', 'admin', 'api'
  }
  
  const logs = db.auditLogs.find({
    tenant_id: req.tenant_id,
    ...filter
  }).sort({ timestamp: -1 }).limit(100);
  
  res.json(logs);
});

// Usage: /api/audit?user_id=user-1
// Usage: /api/audit?actor_type=admin
```

### Filter by Action (What?)
```javascript
app.get('/api/audit/actions/:action', verifyToken, (req, res) => {
  const logs = db.auditLogs.find({
    tenant_id: req.tenant_id,
    action: req.params.action // 'DOCUMENT_DELETED'
  }).sort({ timestamp: -1 }).limit(100);
  
  res.json(logs);
});

// Usage: /api/audit/actions/DOCUMENT_DELETED
```

### Filter by Resource (What was affected?)
```javascript
app.get('/api/audit/resources/:resource_type/:resource_id', verifyToken, (req, res) => {
  const logs = db.auditLogs.find({
    tenant_id: req.tenant_id,
    'resource.resource_type': req.params.resource_type,
    'resource.resource_id': req.params.resource_id
  }).sort({ timestamp: -1 });
  
  res.json(logs);
});

// Show complete history of a document: /api/audit/resources/document/doc-456
```

### Time Range Filter
```javascript
app.get('/api/audit', verifyToken, (req, res) => {
  const start = req.query.start ? new Date(req.query.start) : new Date(Date.now() - 30 * 86400000);
  const end = req.query.end ? new Date(req.query.end) : new Date();
  
  const logs = db.auditLogs.find({
    tenant_id: req.tenant_id,
    timestamp: { $gte: start, $lte: end }
  }).sort({ timestamp: -1 });
  
  res.json(logs);
});

// Usage: /api/audit?start=2025-01-01&end=2025-01-15
```

---

## Security Considerations: The Audit Paradox

### Challenge: Auditing the Admins
```javascript
// Problem: Admin can delete the logs of their own bad actions!
// Solution: Immutable audit logs + restricted deletion
```

### Solution 1: Write-Once Database
```javascript
// Store audit logs in append-only log (immutable)
const logAuditEvent = async (event) => {
  // Append to log file (can never be modified)
  fs.appendFileSync('audit.log', JSON.stringify(event) + '\n');
  
  // Also store in database for querying
  db.auditLogs.insert(event);
};

// Only database admin can delete (not application code)
// Restricts via database security model, not application permissions
```

### Solution 2: Separate Audit Database
```javascript
// Keep audit logs on separate database server
// App can only READ audit logs (via select-only account)
// Never grant UPDATE/DELETE permissions

const auditDb = new Database({
  host: 'audit-db-server.example.com',
  credentials: {
    user: 'audit_reader',
    password: 'read-only-password'
    // No INSERT/UPDATE/DELETE permissions!
  }
});

// Audit service on different server does the writing
const auditService = new Service({
  host: 'audit-server.example.com'
});
```

### Solution 3: Signed/Tamper-Detected Logs
```javascript
// Sign each log entry so tampering is detectable
const crypto = require('crypto');

const signAuditEvent = (event, secret) => {
  const signature = crypto
    .createHmac('sha256', secret)
    .update(JSON.stringify(event))
    .digest('hex');
  
  return { ...event, signature };
};

// Verify hasn't been modified
const verifyAuditLog = (log, secret) => {
  const stored_signature = log.signature;
  const computed_signature = crypto
    .createHmac('sha256', secret)
    .update(JSON.stringify({ ...log, signature: undefined }))
    .digest('hex');
  
  return stored_signature === computed_signature;
};
```

---

## Compliance Requirements

### SOC 2 Type II
- Audit logs for ≥ 90 days
- Must log authentication events
- Must show failed access attempts
- Regular review findings

### HIPAA (Healthcare)
- Audit logs for ≥ 6 years
- May not be deleted by users
- Must include access type (read/write/delete)
- Track all data transfers

### GDPR
- Right to audit (customer can request logs of their data access)
- Data minimization (don't log unnecessary PII)
- Retention limits (don't keep forever)

### PCI-DSS (Payment Card Industry)
- All access to cardholder data must be logged
- Audit logs for ≥ 1 year (≥ 3 months detailed)
- Detect suspicious patterns

---

## Real-World Attack: Audit Tampering

### Vulnerability
```javascript
// VULNERABLE: Mutable audit logs
app.delete('/api/audit-logs/:id', verifyToken, isAdmin, (req, res) => {
  db.auditLogs.deleteOne({ _id: req.params.id }); // Admin deletes evidence!
  res.json({ success: true });
});
```

### Defense
```javascript
// SECURE: Immutable logs + admin tracing
const logAuditEvent = async (event) => {
  // Never allow deletion
  db.auditLogs.insertOne({
    ...event,
    immutable: true,
    created_at: new Date()
  });
};

// Any attempt to delete is itself logged!
app.delete('/api/audit-logs/:id', verifyToken, (req, res) => {
  logger.error('Audit deletion attempt', {
    user_id: req.user.id,
    log_id: req.params.id,
    success: false // Blocked
  });
  
  res.status(403).json({ error: 'Audit logs cannot be deleted' });
});
```

---

## Analytics from Audit Logs

### Suspicious Activity Detection
```javascript
const detectSuspiciousActivity = (tenant_id) => {
  const logs = db.auditLogs.find({
    tenant_id,
    timestamp: { $gte: new Date(Date.now() - 3600000) } // Last hour
  });
  
  const failed_logins = logs.filter(l => l.action === 'USER_LOGIN_FAILED' && l.actor_id === user_id).length;
  if (failed_logins > 5) {
    alert('Brute force attack detected', { user_id, attempts: failed_logins });
  }
  
  const bulk_deletes = logs.filter(l => l.action === 'DOCUMENT_DELETED').length;
  if (bulk_deletes > 100) {
    alert('Suspicious bulk delete', { tenant_id, count: bulk_deletes });
  }
};

setInterval(() => {
  tenants.forEach(t => detectSuspiciousActivity(t.id));
}, 300000); // Every 5 minutes
```

### Usage Insights
```javascript
const getAuditStats = (tenant_id, days = 30) => {
  const start = new Date(Date.now() - days * 86400000);
  
  const logs = db.auditLogs.find({
    tenant_id,
    timestamp: { $gte: start }
  });
  
  return {
    total_events: logs.length,
    by_action: groupBy(logs, 'action'), // Count per action type
    by_user: groupBy(logs, 'actor.user_id'), // Most active users
    by_status: groupBy(logs, 'status'), // Success vs failure rates
    errors: logs.filter(l => l.status === 'failure').length,
    unique_users: new Set(logs.map(l => l.actor.user_id)).size
  };
};
```

---

## Best Practices

✅ **Log before processing** - If action fails, still log it  
✅ **Make audit logs immutable** - Never let users delete evidence  
✅ **Separate audit from operational DB** - Prevent single point of tampering  
✅ **Sign audit logs** - Detect tampering via cryptographic verification  
✅ **Monitor for suspicious patterns** - Brute force, bulk deletes, off-hours access  
✅ **Follow compliance retention rules** - Don't delete too early, don't keep too long  

---

## Related Patterns

- **Module 01**: Row-level isolation - Ensure only tenant sees own audit logs
- **Module 02**: Role-based access - Only managers/admins can view audit logs
- **Module 03**: Plans - Audit log retention may vary by plan (free = 30 days, enterprise = 7 years)