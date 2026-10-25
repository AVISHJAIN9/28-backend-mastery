# Setup Guide - Plans & Feature Flags

## Dependencies

```bash
cd 03-plan-and-feature-flags-limits
npm install
```

## Environment Variables

Create `.env` file:
```
HTTP_PORT=4003
JWT_SECRET=test-secret-key
FRONTEND_URL=http://localhost:3000
```

## How to Run

```bash
npm start
# Server starts on http://localhost:4003
```

## How to Test

### Via Command Line

```bash
# 1. Login to get token
curl -X POST http://localhost:4003/api/auth/login \
  -H "Content-Type: application/json" \
  -d '{"tenantId": "tenant-1"}'

# 2. Get tenant plan
curl http://localhost:4003/api/tenants/tenant-1/plan \
  -H "Authorization: Bearer YOUR_TOKEN"

# 3. Check if feature allowed
curl http://localhost:4003/api/tenants/tenant-1/features/api \
  -H "Authorization: Bearer YOUR_TOKEN"

# 4. Check usage limits
curl http://localhost:4003/api/tenants/tenant-1/usage/api_calls \
  -H "Authorization: Bearer YOUR_TOKEN"

# 5. Upgrade plan
curl -X POST http://localhost:4003/api/tenants/tenant-1/upgrade \
  -H "Authorization: Bearer YOUR_TOKEN" \
  -H "Content-Type: application/json" \
  -d '{"newPlanId": "enterprise"}'
```

### Via Browser

Open `preview.html` in browser

## Key Endpoints

- `GET /api/plans` - List all plans
- `GET /api/tenants/:tenantId/plan` - Get current plan
- `GET /api/tenants/:tenantId/features/:feature` - Check feature access
- `GET /api/tenants/:tenantId/usage/:metric` - Check usage against limits
- `POST /api/tenants/:tenantId/upgrade` - Upgrade to higher plan
- `GET /api/features` - List all feature flags
