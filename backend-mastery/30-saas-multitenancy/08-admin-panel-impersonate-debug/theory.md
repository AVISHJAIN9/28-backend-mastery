# Admin Panel: Impersonation & Debug

## Why Admin Impersonation?

Admin impersonation allows authorized support staff to:

1. **Debug customer issues** - "Why is this user seeing an error?"
2. **Verify fixes** - "Does the fix work for this tenant?"
3. **Emergency unblock** - "User is locked out, let me reset their password"
4. **Compliance** - "Prove we investigated this complaint"

But it's incredibly dangerous—admins can see/modify anything as any user.

---

## Admin Roles & Permissions

### Super Admin
```javascript
const adminRoles = {
  'super_admin': {
    name: 'Super Admin',
    permissions: [
      'read:all_tenants',
      'read:all_users',
      'read:all_documents',
      'write:user_data',
      'write:tenant_settings',
      'impersonate:any_user',
      'delete:user_data',
      'view:system_logs'
    ]
  },
  'support_admin': {
    name: 'Support Team',
    permissions: [
      'read:assigned_tenants', // Only their assigned customers
      'read:documents',
      'impersonate:assigned_users', // Only assigned customers
      'write:support_notes',
      'view:support_logs'
    ]
  },
  'billing_admin': {
    name: 'Billing Team',
    permissions: [
      'read:payment_data',
      'read:invoices',
      'write:billing_settings',
      'refund:payments'
    ]
  }
};
```

### Database Schema
```javascript
const adminUsers = {
  'admin-1': {
    id: 'admin-1',
    name: 'Bob Support',
    email: 'bob@example.com',
    role: 'support_admin',
    
    // Scope limitation
    assigned_tenants: ['tenant-1', 'tenant-2'], // This admin can only help these customers
    
    // Password & Auth
    password_hash: '...',
    mfa_enabled: true,
    mfa_secret: '...',
    
    // Tracking
    created_at: '2024-01-01',
    last_login: '2025-01-15T09:30:00Z',
    active: true
  }
};

const impersonationSessions = {
  'session-1': {
    id: 'session-1',
    admin_id: 'admin-1',
    user_id: 'user-1',
    tenant_id: 'tenant-1',
    
    // Session tracking
    started_at: '2025-01-15T10:00:00Z',
    ended_at: null,
    expires_at: '2025-01-15T11:00:00Z', // 1-hour max
    
    // What happened
    action_log: [
      { timestamp: '10:05:00', action: 'viewed_document', resource_id: 'doc-1' },
      { timestamp: '10:15:00', action: 'reset_settings', resource_id: 'user-1' }
    ]
  }
};
```

---

## Safe Impersonation Patterns

### 1. Request-Based Impersonation (Best)
```javascript
// Impersonate for ONE request only
app.post('/api/admin/impersonate-request', verifyAdminToken, (req, res) => {
  const { tenant_id, user_id, action } = req.body;
  
  // Verify admin can access this tenant
  if (!canAdminAccess(req.admin.id, tenant_id)) {
    return res.status(403).json({ error: 'Unauthorized' });
  }
  
  // Log impersonation intent
  logAdminAction({
    admin_id: req.admin.id,
    action: 'IMPERSONATE_REQUEST',
    tenant_id,
    user_id,
    requested_action: action
  });
  
  // Execute the action AS that user
  const result = executeAsUser(user_id, action);
  
  // Log what happened
  logSystemEvent({
    type: 'ADMIN_IMPERSONATE_ACTION',
    admin_id: req.admin.id,
    user_id,
    action,
    result
  });
  
  res.json(result);
});
```

### 2. Temporary Session (Limited Duration)
```javascript
app.post('/api/admin/impersonate', verifyAdminToken, (req, res) => {
  const { tenant_id, user_id, duration_minutes = 60 } = req.body;
  
  // Enforce maximum session length
  const maxMinutes = 120; // 2 hours max
  if (duration_minutes > maxMinutes) {
    return res.status(400).json({ error: 'Max session is 2 hours' });
  }
  
  // Check permissions
  if (!canAdminAccess(req.admin.id, tenant_id)) {
    logger.warn('Unauthorized impersonation attempt', {
      admin_id: req.admin.id,
      tenant: tenant_id
    });
    return res.status(403).json({ error: 'Unauthorized' });
  }
  
  const session = {
    id: generateId(),
    admin_id: req.admin.id,
    user_id,
    tenant_id,
    started_at: new Date(),
    expires_at: new Date(Date.now() + duration_minutes * 60000),
    action_log: []
  };
  
  db.impersonationSessions.insert(session);
  
  // Return temporary token
  const tempToken = jwt.sign(
    {
      user_id,
      tenant_id,
      impersonating_admin: req.admin.id,
      session_id: session.id
    },
    JWT_SECRET,
    { expiresIn: `${duration_minutes}m` }
  );
  
  // Log session start
  logSystemEvent({
    type: 'IMPERSONATION_STARTED',
    admin_id: req.admin.id,
    target_user: user_id,
    target_tenant: tenant_id,
    duration_minutes
  });
  
  res.json({ session_id: session.id, token: tempToken });
});
```

### 3. Read-Only Impersonation
```javascript
// Impersonate but don't allow mutations
app.post('/api/admin/impersonate-readonly', verifyAdminToken, (req, res) => {
  const { tenant_id, user_id } = req.body;
  
  const session = {
    id: generateId(),
    admin_id: req.admin.id,
    user_id,
    tenant_id,
    readonly: true, // KEY: Only GET requests
    started_at: new Date(),
    expires_at: new Date(Date.now() + 60 * 60000)
  };
  
  db.impersonationSessions.insert(session);
  
  const tempToken = jwt.sign(
    {
      user_id,
      tenant_id,
      impersonating_admin: req.admin.id,
      session_id: session.id,
      readonly: true
    },
    JWT_SECRET,
    { expiresIn: '1h' }
  );
  
  res.json({ token: tempToken });
});

// Enforce read-only
app.use((req, res, next) => {
  if (req.user.readonly && ['POST', 'PUT', 'DELETE'].includes(req.method)) {
    return res.status(403).json({ error: 'Read-only impersonation session' });
  }
  next();
});
```

---

## Preventing Abuse

### Scope Limiting
```javascript
// Admin can only impersonate users in assigned tenants
const canAdminImpersonate = (admin_id, tenant_id, user_id) => {
  const admin = getAdmin(admin_id);
  const user = getUser(user_id);
  
  // Super admin can impersonate anyone
  if (admin.role === 'super_admin') return true;
  
  // Support admin can only help assigned tenants
  if (!admin.assigned_tenants.includes(tenant_id)) {
    return false;
  }
  
  // Can't impersonate other admins!
  if (user.is_admin) {
    logger.warn('Attempted to impersonate admin', {
      admin_id,
      target_user: user_id
    });
    return false;
  }
  
  return true;
};
```

### Automatic Session Expiration
```javascript
// Auto-logout after time limit
const verifyImpersonationSession = (token) => {
  try {
    const decoded = jwt.verify(token, JWT_SECRET);
    
    if (decoded.impersonating_admin) {
      const session = db.impersonationSessions.findById(decoded.session_id);
      
      if (!session || new Date() > session.expires_at) {
        logger.warn('Expired impersonation session', {
          session_id: decoded.session_id,
          admin_id: decoded.impersonating_admin
        });
        throw new Error('Impersonation session expired');
      }
    }
    
    return decoded;
  } catch (e) {
    throw new Error('Invalid token');
  }
};
```

### Audit Trail
```javascript
// Every action while impersonating is logged under BOTH identities
app.use((req, res, next) => {
  if (req.user.impersonating_admin) {
    // Log in audit trail
    res.on('finish', () => {
      logAuditEvent({
        action: `ADMIN_IMPERSONATE_${req.method}`,
        admin_id: req.user.impersonating_admin,
        acting_as_user: req.user.user_id,
        resource: req.path,
        status: res.statusCode
      });
    });
  }
  next();
});
```

---

## System Events & Debug Logs

### System Events (What happened)
```javascript
const systemEvents = {
  'TENANT_CREATED': 'New tenant registered',
  'TENANT_DELETED': 'Tenant (and all data) removed',
  'PAYMENT_SUCCEEDED': 'Subscription charge succeeded',
  'PAYMENT_FAILED': 'Credit card declined',
  'PLAN_UPGRADE': 'Tenant upgraded to new tier',
  'PLAN_DOWNGRADE': 'Tenant downgraded',
  'USER_DISABLED': 'User account suspended',
  'SECURITY_ALERT': 'Suspicious activity detected',
  'DATABASE_ERROR': 'Database operation failed',
  'EXTERNAL_API_DOWN': 'Third-party service unavailable'
};

app.post('/api/admin/events', verifyAdminToken, (req, res) => {
  const { tenant_id, type, metadata } = req.body;
  
  const event = {
    id: generateId(),
    type,
    tenant_id,
    logged_by: req.admin.id,
    timestamp: new Date(),
    metadata,
    severity: determineSeverity(type)
  };
  
  db.systemEvents.insert(event);
  
  // Alert on critical events
  if (event.severity === 'critical') {
    sendAlert({
      channel: 'slack',
      message: `🚨 Critical: ${type} for ${tenant_id}`
    });
  }
  
  res.json(event);
});
```

### Debug Logs (For troubleshooting)
```javascript
const debugLogs = {
  'debug-1': {
    id: 'debug-1',
    tenant_id: 'tenant-1',
    level: 'ERROR', // ERROR, WARNING, INFO, DEBUG
    message: 'Database connection timeout after 30s',
    timestamp: '2025-01-15T10:30:45Z',
    context: {
      operation: 'query_documents',
      duration_ms: 30000,
      database: 'customer-db-1'
    },
    logged_by: 'admin-1',
    resolved: false
  }
};

app.post('/api/admin/logs', verifyAdminToken, (req, res) => {
  const { tenant_id, level, message, context } = req.body;
  
  const log = {
    id: generateId(),
    tenant_id,
    level,
    message,
    context,
    timestamp: new Date(),
    logged_by: req.admin.id
  };
  
  db.debugLogs.insert(log);
  
  // High-level aggregation
  updateDashboard({
    type: 'error_count',
    tenant_id,
    level,
    increment: 1
  });
  
  res.json(log);
});
```

---

## Real-World Attacks on Admin Features

### Attack 1: Privilege Escalation
```javascript
// VULNERABLE: Admin who gained account creates new admin
app.post('/api/admin/create', verifyAdminToken, (req, res) => {
  // No check if current admin can create admins!
  db.adminUsers.insert(req.body);
  res.json({ success: true });
});
```

### Defense
```javascript
// SECURE: Only super_admin can create admins
app.post('/api/admin/users', verifyAdminToken, (req, res) => {
  if (req.admin.role !== 'super_admin') {
    return res.status(403).json({ error: 'Only super admins can create admins' });
  }
  
  const newAdmin = {
    ...req.body,
    created_by: req.admin.id,
    created_at: new Date()
  };
  
  db.adminUsers.insert(newAdmin);
  
  logSystemEvent({
    type: 'ADMIN_CREATED',
    created_by: req.admin.id,
    new_admin: newAdmin.id
  });
  
  res.json(newAdmin);
});
```

### Attack 2: Impersonation Abuse (No Logging)
```javascript
// VULNERABLE: Impersonation with no audit trail
const adminImpersonate = (admin_id, user_id) => {
  // Admin can see any user's data, no visibility
  return {
    user_documents: getAllDocuments(user_id),
    user_emails: getAllEmails(user_id) // Privacy violation!
  };
};
```

### Defense
```javascript
// SECURE: Every action is logged
app.get('/api/admin/impersonate/:user_id/data', verifyAdminToken, (req, res) => {
  const { user_id } = req.params;
  const { tenant_id } = req.query;
  
  if (!canAdminImpersonate(req.admin.id, tenant_id, user_id)) {
    return res.status(403).json({ error: 'Unauthorized' });
  }
  
  // Log the request itself
  logSystemEvent({
    type: 'ADMIN_VIEWED_USER_DATA',
    admin_id: req.admin.id,
    target_user: user_id,
    target_tenant: tenant_id,
    reason: req.query.reason || 'Not specified'
  });
  
  const data = getUserData(user_id);
  res.json(data);
});
```

---

## Compliance & MFA

### Enforce MFA for Admins
```javascript
const verifyAdminToken = (req, res, next) => {
  const token = req.headers.authorization?.split(' ')[1];
  
  try {
    const decoded = jwt.verify(token, JWT_SECRET);
    const admin = getAdmin(decoded.admin_id);
    
    // Require MFA for sensitive actions
    if (decoded.action === 'impersonate' && !admin.mfa_verified) {
      return res.status(403).json({ 
        error: 'MFA required for impersonation',
        mfa_code_url: '/admin/mfa/verify'
      });
    }
    
    req.admin = admin;
    next();
  } catch (e) {
    res.status(401).json({ error: 'Invalid token' });
  }
};

// MFA verification
app.post('/admin/mfa/verify', (req, res) => {
  const { admin_id, mfa_code } = req.body;
  const admin = getAdmin(admin_id);
  
  const verified = speakeasy.totp.verify({
    secret: admin.mfa_secret,
    encoding: 'base32',
    token: mfa_code
  });
  
  if (!verified) {
    return res.status(403).json({ error: 'Invalid MFA code' });
  }
  
  const token = jwt.sign(
    { admin_id, mfa_verified: true },
    JWT_SECRET,
    { expiresIn: '15m' }
  );
  
  res.json({ token });
});
```

---

## Best Practices

✅ **Scope admins to specific customers** - Support can't access all tenants  
✅ **Enforce time limits** - 1-2 hour max impersonation sessions  
✅ **Require reason for impersonation** - "Why are you impersonating this user?"  
✅ **Audit everything** - Every action while impersonating is logged  
✅ **Prevent other admin impersonation** - Can't impersonate other admins  
✅ **Require MFA** - Multi-factor authentication for sensitive actions  
✅ **Alert on critical actions** - Notify when someone accesses sensitive data  
✅ **Regular access reviews** - Audit who can impersonate whom  

---

## Related Patterns

- **Module 01**: Row-level isolation - Admin sees other tenant's data (with logging!)
- **Module 02**: RBAC - Admin roles with permission matrix
- **Module 06**: Audit logs - Everything admin does is logged/auditable