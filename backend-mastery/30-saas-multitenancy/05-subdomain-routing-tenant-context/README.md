# Subdomain Routing & Tenant Context

## What is this?

Routing identifies which tenant made a request by looking at the domain (acme.example.com → tenant-acme), then automatically sets tenant context for all downstream operations.

## Why does it matter?

- **Multi-Domain**: Each tenant gets their own subdomain (acme.example.com, beta.example.com)
- **Custom Domains**: Enterprise customers use their own domains (customer.com)
- **Automatic Context**: Middleware sets `req.tenantId` so you don't repeat it
- **Isolation**: Requests can't cross tenants even by accident

## How it works

1. **Request arrives**: `GET acme.example.com/api/documents`
2. **Extract tenant**: Middleware reads hostname → tenant-acme
3. **Set context**: `req.tenantId = 'tenant-acme'`
4. **Query filters**: All DB queries auto-filter by tenant
5. **Response**: Only acme's documents returned

## Setup

```bash
cd 05-subdomain-routing-tenant-context
npm install
npm start
```

Server runs on `http://localhost:4005`

## Testing

1. **Add hosts**: Edit `/etc/hosts`:
   ```
   127.0.0.1 acme.example.local
   127.0.0.1 beta.example.local
   ```
2. Visit `http://acme.example.local:4005` → sees acme data
3. Visit `http://beta.example.local:4005` → sees beta data

## Key Concepts

- **Subdomain**: `acme.example.com` → tenant-acme
- **Custom Domain**: `customer.com` (via DNS CNAME)
- **Tenant Extraction**: Parse host header
- **Wildcard DNS**: `*.example.com` → single IP
- **SSL Cert**: Wildcard cert covers all subdomains

## Common Mistakes

❌ Relying on client to send tenant (use subdomain!)  
❌ Not validating extracted tenant exists  
❌ Forgetting SSL for custom domains  
❌ Not handling www.acme.example.com separately  
❌ Caching data without tenant in key

## API Endpoints

### Tenant Operations
- `POST /api/auth/login` - Get JWT token
- `GET /api/tenants/:tenantId` - Get tenant info
- `GET /api/tenants/:tenantId/settings` - Get tenant settings
- `PUT /api/tenants/:tenantId/settings` - Update tenant settings

### Subdomain Management
- `GET /api/tenants/:tenantId/subdomains` - List subdomains
- `POST /api/tenants/:tenantId/subdomains` - Create subdomain
- `DELETE /api/tenants/:tenantId/subdomains/:subdomain` - Remove subdomain

### Custom Domains
- `POST /api/tenants/:tenantId/domains` - Add custom domain
- `GET /api/tenants/:tenantId/domains` - List custom domains
- `DELETE /api/tenants/:tenantId/domains/:domain` - Remove custom domain

## Security Considerations

1. **DNS Validation**: Verify subdomain ownership
2. **SSL Certificates**: Support custom domains with HTTPS
3. **Tenant Isolation**: Never leak other tenant's subdomain
4. **Rate Limiting**: Prevent subdomain enumeration
5. **DNS Rebinding**: Protect against DNS attacks

## Database Schema

```sql
CREATE TABLE tenants (
  id UUID PRIMARY KEY,
  name VARCHAR(255),
  primary_subdomain VARCHAR(100) UNIQUE,
  created_at TIMESTAMP DEFAULT NOW()
);

CREATE TABLE tenant_domains (
  id SERIAL PRIMARY KEY,
  tenant_id UUID REFERENCES tenants(id),
  domain VARCHAR(255) UNIQUE,
  type VARCHAR(20), -- 'subdomain' or 'custom'
  verified BOOLEAN DEFAULT FALSE,
  verified_at TIMESTAMP
);
```

## Implementation Checklist

- [ ] Extract subdomain from request
- [ ] Map subdomain to tenant
- [ ] Add tenant context to request
- [ ] Support custom domains
- [ ] Add DNS validation
- [ ] Implement rewrite rules
- [ ] Add wildcard DNS support
- [ ] Test domain mapping

## Next Steps

1. Review [theory.md](./theory.md) for detailed concepts
2. Check [schema.js](./schema.js) for data models
3. Explore [controller.js](./controller.js) for business logic
4. Run tests with [App.jsx](./App.jsx)

## References

- Heroku (subdomain routing)
- Vercel (custom domains)
- Auth0 (tenant isolation via domain)
