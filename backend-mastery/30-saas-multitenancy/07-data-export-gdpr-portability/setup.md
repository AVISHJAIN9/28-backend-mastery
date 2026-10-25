# Setup Guide - Data Export & GDPR

## Dependencies

```bash
cd 07-data-export-gdpr-portability
npm install
```

## Environment Variables

Create `.env` file:
```
HTTP_PORT=4007
JWT_SECRET=test-secret-key
FRONTEND_URL=http://localhost:3000
```

## How to Run

```bash
npm start
# Server starts on http://localhost:4007
```

## How to Test

### Via Command Line

```bash
# 1. Request data export
curl -X POST http://localhost:4007/api/export \
  -H "Content-Type: application/json" \
  -d '{"requestType": "FULL_DATA_EXPORT", "format": "JSON"}'
# Returns export request with ID

# 2. Check export status
curl http://localhost:4007/api/export/:exportId
# Status: processing -> completed, includes download_url

# 3. Get all exports for tenant
curl http://localhost:4007/api/tenants/tenant-1/exports

# 4. Request account deletion (30-day grace period)
curl -X POST http://localhost:4007/api/account/delete \
  -H "Content-Type: application/json" \
  -d '{"userId": "user-1"}'
# Returns deletion scheduled for 30 days from now

# 5. Check deletion status
curl http://localhost:4007/api/deletion/:deleteId

# 6. Cancel deletion (within grace period)
curl -X POST http://localhost:4007/api/deletion/:deleteId/cancel

# 7. View user data to export
curl http://localhost:4007/api/users/:userId/data
```

## Key Endpoints

- `POST /api/export` - Request data export
- `GET /api/export/:exportId` - Check export status/download
- `GET /api/tenants/:tenantId/exports` - List exports
- `POST /api/account/delete` - Request account deletion
- `POST /api/deletion/:deleteId/cancel` - Cancel scheduled deletion
- `GET /api/users/:userId/data` - Preview user data
