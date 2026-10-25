# Setup Guide - Subdomain Routing

## Dependencies

```bash
cd 05-subdomain-routing-tenant-context
npm install
```

## Environment Variables

Create `.env` file:
```
HTTP_PORT=4005
JWT_SECRET=test-secret-key
FRONTEND_URL=http://localhost:3000
```

## How to Run

```bash
# For testing with real subdomains, add to /etc/hosts:
# 127.0.0.1 acme.example.local
# 127.0.0.1 beta.example.local
# 127.0.0.1 gamma.example.local

npm start
# Server starts on http://localhost:4005
```

## How to Test

### Via Command Line

```bash
# 1. Get all tenants
curl http://localhost:4005/api/tenants

# 2. Get current tenant (based on subdomain)
curl -H "Host: acme.example.local" http://localhost:4005/api/tenant
# Returns acme tenant data

curl -H "Host: beta.example.local" http://localhost:4005/api/tenant
# Returns beta tenant data

# 3. Register new subdomain
curl -X POST http://localhost:4005/api/tenants/tenant-1/subdomain \
  -H "Authorization: Bearer YOUR_TOKEN" \
  -H "Content-Type: application/json" \
  -d '{"subdomain": "acme"}'

# 4. Register custom domain
curl -X POST http://localhost:4005/api/tenants/tenant-1/domain \
  -H "Authorization: Bearer YOUR_TOKEN" \
  -H "Content-Type: application/json" \
  -d '{"customDomain": "acme.io"}'

# 5. Get domain mappings for tenant
curl http://localhost:4005/api/domains/tenant-1 \
  -H "Authorization: Bearer YOUR_TOKEN"
```

## Key Endpoints

- `GET /api/tenant` - Get current tenant (extracted from subdomain)
- `GET /api/tenants` - List all tenants
- `POST /api/tenants/:tenantId/subdomain` - Register subdomain
- `POST /api/tenants/:tenantId/domain` - Register custom domain
- `GET /api/domains/:tenantId` - Get domain mappings
- `GET /api/domains` - Get all domain mappings
