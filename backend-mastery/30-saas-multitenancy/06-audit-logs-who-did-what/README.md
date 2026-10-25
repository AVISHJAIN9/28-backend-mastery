# Audit Logs: Who Did What

## What is this?

Audit logs are an immutable record of every action taken in your system: who did it, what they did, when, from where, and the result.

## Why does it matter?

- **Compliance**: HIPAA, SOC 2, GDPR require audit trails
- **Security**: Detect suspicious activity (5 failed logins = attack)
- **Debugging**: "Customer says they deleted a file but we have proof they didn't"
- **Accountability**: Users know their actions are logged

## How it works

1. **Intercept Action**: Before/after every important operation
2. **Capture Context**: User ID, IP, timestamp, changes
3. **Store Immutably**: Append-only log (can't edit history)
4. **Query**: Filter by user/action/date for investigations
5. **Alert**: Send email on critical events (failed login, data delete)

## Setup

```bash
cd 06-audit-logs-who-did-what
npm install
npm start
```

Server runs on `http://localhost:4006`

## Testing

1. **Record action**: `POST /api/audit/log` with action, resource, user
2. **View logs**: `GET /api/tenants/tenant-1/audit-logs`
3. **Search**: `GET /api/audit-logs/search?q=user-1`
4. **Stats**: `GET /api/audit-logs/stats`

## Key Concepts

- **Action**: CREATE, UPDATE, DELETE, LOGIN, LOGIN_FAILED, etc.
- **Resource**: Document, User, Settings (what was acted on)
- **Status**: success, failure
- **Metadata**: IP, User-Agent, changes made (before/after)
- **Rule**: Alert when specific action happens

## Common Mistakes

❌ Logging sensitive data (passwords, tokens)  
❌ Deletable logs (use append-only storage)  
❌ No query performance (index by tenant + timestamp)  
❌ Logging too much (creates storage nightmare)  
❌ Not logging failed attempts (security risk)

## API Endpoints

### Logging Operations
- `POST /api/auth/login` - Get JWT token
- `POST /api/tenants/:tenantId/audit/log` - Record audit event
- `GET /api/tenants/:tenantId/audit/logs` - Fetch audit logs
- `GET /api/tenants/:tenantId/audit/logs?action=update` - Filter by action
- `GET /api/tenants/:tenantId/audit/logs?userId=user-1` - Filter by user

### Analytics
- `GET /api/tenants/:tenantId/audit/summary` - Audit log summary
- `GET /api/tenants/:tenantId/audit/stats` - Usage statistics
- `GET /api/tenants/:tenantId/audit/export` - Export logs (GDPR)

## Security Considerations

1. **Immutability**: Use append-only store (database triggers)
2. **Encryption**: Encrypt sensitive data in logs
3. **Access Control**: Only admins can view audit logs
4. **Retention**: Auto-delete logs after 90+ days
5. **Tamper Detection**: Hash chains for log integrity

## Database Schema

```sql
CREATE TABLE audit_logs (
  id SERIAL PRIMARY KEY,
  tenant_id UUID NOT NULL,
  user_id VARCHAR(100),
  action VARCHAR(50),
  resource_type VARCHAR(50),
  resource_id VARCHAR(100),
  changes JSONB,
  ip_address INET,
  user_agent TEXT,
  timestamp TIMESTAMP DEFAULT NOW()
);

CREATE INDEX idx_audit_tenant_timestamp 
  ON audit_logs(tenant_id, timestamp DESC);
```

## Audit Log Format

```json
{
  "id": 12345,
  "tenantId": "tenant-1",
  "userId": "user-1",
  "action": "update",
  "resourceType": "document",
  "resourceId": "doc-123",
  "changes": {
    "title": { "old": "Report", "new": "Q1 Report" }
  },
  "ipAddress": "192.168.1.1",
  "userAgent": "Mozilla/5.0...",
  "timestamp": "2025-01-15T10:30:00Z"
}
```

## Implementation Checklist

- [ ] Create audit log schema
- [ ] Implement logging middleware
- [ ] Add action categorization
- [ ] Mask sensitive data
- [ ] Implement retention policy
- [ ] Add search/filter capability
- [ ] Create export functionality
- [ ] Test compliance scenarios

## Next Steps

1. Review [theory.md](./theory.md) for detailed concepts
2. Check [schema.js](./schema.js) for data models
3. Explore [controller.js](./controller.js) for business logic
4. Run tests with [App.jsx](./App.jsx)

## References

- SOC 2 Audit Requirements
- GDPR Right to Access
- HIPAA Audit Controls
