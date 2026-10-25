# Admin Panel: Impersonate & Debug

## What is this?

Build-only internal tools for admins to investigate issues: view any tenant's data (impersonation), check system logs, see who's doing what.

## Why does it matter?

- **Support**: "Customer says feature X doesn't work" → Admin impersonates → reproduces issue
- **Investigation**: "Was data really deleted?" → Check audit logs
- **Debugging**: "Server is slow for tenant Y" → Check system events
- **Security**: "Suspicious login from China" → Review timeline

## How it works

### Impersonation
1. Admin logs in with super_admin role
2. Selects tenant and user to impersonate
3. Gets session token for that user
4. All requests appear as that user
5. All actions logged (admin can't be anonymous)

### Debugging
1. View system events (tenant created, payment failed)
2. View debug/error logs (database errors, timeouts)
3. Search audit logs (find when user action happened)
4. Check metrics (CPU, memory, request latency)

## Setup

```bash
cd 08-admin-panel-impersonate-debug
npm install
npm start
```

Server runs on `http://localhost:4008`

## Testing

1. **Start impersonation**: `POST /api/admin/impersonate` → `{tenantId, userId}`
2. **Use token**: Include token in requests, all appear as target user
3. **View audit**: `GET /api/system/audit-logs?tenantId=tenant-1`
4. **View errors**: `GET /api/system/debug-logs?level=ERROR`
5. **End session**: `POST /api/admin/impersonate/:sessionId/end`

## Key Concepts

- **Super Admin**: Can access all tenants, impersonate users
- **Support Admin**: Limited to assigned tenants
- **Impersonation Session**: Tracked and logged (audit trail)
- **Action Log**: Every impersonated action recorded
- **System Events**: Tenant-level changes (upgrades, deletions)

## Common Mistakes

❌ Allowing anonymous impersonation (always log admin ID)  
❌ Not timeboxing sessions (auto-expire after 1 hour)  
❌ Exposing internal errors to users  
❌ No rate limiting on debug endpoints  
❌ Not auditing admin access itself

## API Endpoints

### Admin Authentication
- `POST /api/auth/admin-login` - Admin login (requires super-admin credentials)
- `GET /api/auth/me` - Get current user/impersonation context

### Impersonation
- `POST /api/admin/impersonate/:tenantId/:userId` - Start impersonation
  - Returns: `{ impersonationToken: '...', expiresAt: '...' }`
- `POST /api/admin/impersonate/stop` - Exit impersonation
- `GET /api/admin/impersonation-sessions` - List active impersonations

### Tenant Debugging
- `GET /api/admin/tenants/:tenantId/debug` - Tenant health check
- `GET /api/admin/tenants/:tenantId/stats` - Usage statistics
- `GET /api/admin/tenants/:tenantId/audit` - Recent audit logs
- `POST /api/admin/tenants/:tenantId/reset` - Reset tenant state (destructive)

### System Health
- `GET /api/admin/health` - Overall system status
- `GET /api/admin/metrics` - System metrics (CPU, memory, DB)
- `GET /api/admin/slow-queries` - Identify slow database queries
- `GET /api/admin/tenants` - List all tenants

## Security Considerations

1. **Super Admin Only**: Only super-admins can impersonate
2. **Session Expiry**: Impersonation tokens expire in 1 hour
3. **Audit Trail**: Log every impersonation start/stop
4. **Read-Only Debug**: Debug endpoints never modify data
5. **IP Whitelisting**: Admin panel accessible from corp IPs only

## Database Schema

```sql
CREATE TABLE impersonation_sessions (
  id UUID PRIMARY KEY,
  admin_id VARCHAR(100),
  tenant_id UUID,
  user_id VARCHAR(100),
  started_at TIMESTAMP DEFAULT NOW(),
  expires_at TIMESTAMP,
  ended_at TIMESTAMP,
  reason TEXT
);

CREATE TABLE admin_actions (
  id SERIAL PRIMARY KEY,
  admin_id VARCHAR(100),
  action VARCHAR(100),
  resource_type VARCHAR(50),
  resource_id VARCHAR(100),
  changes JSONB,
  ip_address INET,
  timestamp TIMESTAMP DEFAULT NOW()
);
```

## Debug Information

```json
{
  "tenantId": "tenant-1",
  "status": "healthy",
  "stats": {
    "users": 125,
    "documents": 3421,
    "apiCallsToday": 45231,
    "storageUsed": "2.3 GB"
  },
  "plan": "enterprise",
  "lastActivity": "2025-01-15T10:30:00Z",
  "issues": [],
  "recentAuditLogs": []
}
```

## Implementation Checklist

- [ ] Create super-admin role
- [ ] Implement impersonation logic
- [ ] Add session expiration
- [ ] Create debug endpoints
- [ ] Add health check dashboard
- [ ] Implement audit logging
- [ ] Add IP whitelisting
- [ ] Create admin testing UI

## Next Steps

1. Review [theory.md](./theory.md) for detailed concepts
2. Check [schema.js](./schema.js) for data models
3. Explore [controller.js](./controller.js) for business logic
4. Run tests with [App.jsx](./App.jsx)

## References

- Stripe Dashboard (admin features)
- AWS console (debugging)
- Salesforce Setup (admin tools)
