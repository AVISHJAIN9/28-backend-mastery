# Setup Guide - Audit Logs

## Dependencies

```bash
cd 06-audit-logs-who-did-what
npm install
```

## Environment Variables

Create `.env` file:
```
HTTP_PORT=4006
JWT_SECRET=test-secret-key
FRONTEND_URL=http://localhost:3000
```

## How to Run

```bash
npm start
# Server starts on http://localhost:4006
```

## How to Test

### Via Command Line

```bash
# 1. Get audit logs for tenant
curl http://localhost:4006/api/tenants/tenant-1/audit-logs

# 2. Filter by action
curl "http://localhost:4006/api/tenants/tenant-1/audit-logs?action=CREATE_DOCUMENT"

# 3. Filter by user
curl "http://localhost:4006/api/tenants/tenant-1/audit-logs?userId=user-1"

# 4. Search audit logs
curl "http://localhost:4006/api/audit-logs/search?q=user-1&tenantId=tenant-1"

# 5. Get audit statistics
curl http://localhost:4006/api/tenants/tenant-1/audit-logs/stats

# 6. Create audit rule (alert on delete)
curl -X POST http://localhost:4006/api/tenants/tenant-1/audit-rules \
  -H "Content-Type: application/json" \
  -d '{"eventType": "DELETE_DOCUMENT", "alertEnabled": true, "notifyEmail": "admin@example.com"}'

# 7. View audit rules
curl http://localhost:4006/api/tenants/tenant-1/audit-rules
```

## Key Endpoints

- `GET /api/tenants/:tenantId/audit-logs` - List all audit logs
- `GET /api/audit-logs/search` - Search audit logs
- `GET /api/tenants/:tenantId/audit-logs/stats` - Get statistics
- `POST /api/tenants/:tenantId/audit-rules` - Create alert rule
- `GET /api/tenants/:tenantId/audit-rules` - List rules
