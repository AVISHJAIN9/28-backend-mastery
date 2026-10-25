# Setup Guide - Usage Metering

## Dependencies

```bash
cd 04-usage-metering-api-calls-per-tenant
npm install
```

## Environment Variables

Create `.env` file:
```
HTTP_PORT=4004
JWT_SECRET=test-secret-key
FRONTEND_URL=http://localhost:3000
```

## How to Run

```bash
npm start
# Server starts on http://localhost:4004
```

## How to Test

### Via Command Line

```bash
# 1. Login
curl -X POST http://localhost:4004/api/auth/login \
  -H "Content-Type: application/json" \
  -d '{}'  # Returns token

# 2. Record API usage
curl -X POST http://localhost:4004/api/tenants/tenant-1/meter \
  -H "Authorization: Bearer YOUR_TOKEN" \
  -H "Content-Type: application/json" \
  -d '{"metric": "api_calls", "value": 100, "endpoint": "/api/documents"}'

# 3. Check usage summary
curl http://localhost:4004/api/tenants/tenant-1/usage \
  -H "Authorization: Bearer YOUR_TOKEN"

# 4. Check quota
curl http://localhost:4004/api/tenants/tenant-1/quota \
  -H "Authorization: Bearer YOUR_TOKEN"

# 5. Get quota percentage
curl http://localhost:4004/api/tenants/tenant-1/quota/percentage/api_calls \
  -H "Authorization: Bearer YOUR_TOKEN"

# 6. View meter events
curl "http://localhost:4004/api/tenants/tenant-1/events?metric=api_calls" \
  -H "Authorization: Bearer YOUR_TOKEN"
```

## Key Endpoints

- `POST /api/tenants/:tenantId/meter` - Record usage event
- `GET /api/tenants/:tenantId/usage` - Get usage summary
- `GET /api/tenants/:tenantId/quota` - Get quota limits
- `GET /api/tenants/:tenantId/quota/percentage/:metric` - Get % of quota used
- `GET /api/tenants/:tenantId/events` - List meter events
