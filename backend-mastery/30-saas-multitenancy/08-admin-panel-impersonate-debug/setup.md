# Setup Guide - Admin Panel

## Dependencies

```bash
cd 08-admin-panel-impersonate-debug
npm install
```

## Environment Variables

Create `.env` file:
```
HTTP_PORT=4008
JWT_SECRET=test-secret-key
FRONTEND_URL=http://localhost:3000
ADMIN_SECRET=admin-only-secret
```

## How to Run

```bash
npm start
# Server starts on http://localhost:4008
```

## How to Test

### Via Command Line

```bash
# 1. Login as admin
curl -X POST http://localhost:4008/api/auth/admin-login \
  -H "Content-Type: application/json" \
  -d '{"adminId": "admin-1"}'
# Get admin token

# 2. Start impersonation session
curl -X POST http://localhost:4008/api/admin/impersonate \
  -H "Authorization: Bearer ADMIN_TOKEN" \
  -H "Content-Type: application/json" \
  -d '{"tenantId": "tenant-1", "userId": "user-1"}'
# Returns session ID and impersonation token

# 3. Use impersonation token for requests
curl http://localhost:4008/api/documents \
  -H "Authorization: Bearer IMPERSONATION_TOKEN"
# Requests appear as user, but logged as admin

# 4. Log impersonation action
curl -X POST http://localhost:4008/api/admin/impersonate/:sessionId/log \
  -H "Authorization: Bearer ADMIN_TOKEN" \
  -H "Content-Type: application/json" \
  -d '{"action": "GET /api/documents"}'

# 5. End impersonation
curl -X POST http://localhost:4008/api/admin/impersonate/:sessionId/end \
  -H "Authorization: Bearer ADMIN_TOKEN"

# 6. View system events
curl http://localhost:4008/api/system/events?tenantId=tenant-1

# 7. View debug logs
curl 'http://localhost:4008/api/system/debug-logs?tenantId=tenant-1&level=ERROR'

# 8. Get audit trail
curl http://localhost:4008/api/system/audit-logs?tenantId=tenant-1
```

## Key Endpoints

- `POST /api/auth/admin-login` - Login as admin
- `POST /api/admin/impersonate` - Start impersonation session
- `POST /api/admin/impersonate/:sessionId/log` - Log impersonation action
- `POST /api/admin/impersonate/:sessionId/end` - End session
- `GET /api/system/events` - View system events
- `GET /api/system/debug-logs` - View debug logs
- `GET /api/system/audit-logs` - View audit trail
