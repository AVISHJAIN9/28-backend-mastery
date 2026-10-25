# Setup Guide – Audit Trail & Immutable Log

## 1. Install Dependencies
```bash
npm install pg crypto dotenv
```

## 2. Run DB Migration
```sql
-- Run schema.js migration SQL, then immediately restrict access:
REVOKE UPDATE, DELETE, TRUNCATE ON audit_log FROM PUBLIC;
REVOKE UPDATE, DELETE, TRUNCATE ON audit_log FROM your_app_role;
GRANT INSERT, SELECT ON audit_log TO your_app_role;
GRANT USAGE ON SEQUENCE audit_log_sequence_seq TO your_app_role;
```

## 3. Log Events in Your Application
```js
const { audit } = require('./auditLogger');

// Log data access
await audit.dataAccess(req.user.id, targetUserId, ['email', 'phone'], req.ip);

// Log consent change
await audit.consentGranted(user.id, 'marketing_email', '2.1');

// Log admin action
await audit.adminAction(admin.id, 'delete_user', targetId, { reason: 'GDPR erasure' });
```

## 4. Apply Middleware to Sensitive Routes
```js
const { logDataAccess, logAdminAction } = require('./middleware');

// Auto-log all access to user profile
router.get('/users/:id', logDataAccess('profile'), getUserHandler);

// Auto-log all admin operations
router.delete('/admin/users/:id', requireAdmin, logAdminAction('delete_user'), deleteUserHandler);
```

## 5. Verify Chain Integrity (Run as Cron)
```js
// cron: 0 3 * * *  (daily at 3am)
const { verifyChain } = require('./auditVerifier');
const result = await verifyChain();
if (!result.valid) {
  console.error('AUDIT CHAIN VIOLATION:', result.violations);
  // Alert security team immediately
}
```

## 6. Query Audit Logs
```sql
-- All actions on a specific user
SELECT * FROM audit_log WHERE target_id = 'usr_001' ORDER BY created_at DESC;

-- All admin actions in the last 7 days
SELECT * FROM audit_log WHERE actor_role = 'admin' AND created_at > NOW() - INTERVAL '7 days';

-- All erasure events
SELECT * FROM audit_log WHERE event_type LIKE 'erasure.%' ORDER BY created_at DESC;
```
