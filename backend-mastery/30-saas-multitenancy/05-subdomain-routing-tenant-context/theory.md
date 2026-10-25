# Subdomain Routing & Tenant Context Extraction

## Multi-Domain Architectures

In multi-tenant SaaS, you must route requests to the correct tenant. Three common strategies:

### 1. Path-Based Routing
```
https://app.example.com/org/acme/dashboard
https://app.example.com/org/beta/dashboard
```

**Pros:**
- Single SSL certificate
- Simple DNS (one A record)
- Legacy-friendly (no wildcard DNS)

**Cons:**
- No domain isolation (shared cookies)
- URL looks "corporate" not "branded"

**Example:**
```javascript
const extractTenantFromPath = (req) => {
  const match = req.path.match(/^\/org\/([a-z0-9-]+)/);
  return match ? match[1] : null;
};

app.use((req, res, next) => {
  req.tenant_id = extractTenantFromPath(req);
  next();
});
```

---

### 2. Subdomain-Based Routing (Most SaaS Use This)
```
https://acme.example.com/dashboard
https://beta.example.com/dashboard
https://customer-1.example.com/dashboard
```

**Pros:**
- Per-tenant branding (custom domains)
- Full domain isolation (cookies)
- Professional appearance
- Analytics per domain

**Cons:**
- Wildcard SSL certificate required (*.example.com)
- Wildcard DNS required (*.example.com A 1.2.3.4)
- More complex routing

**Example:**
```javascript
const extractTenantFromSubdomain = (req) => {
  const host = req.get('host'); // acme.example.com
  const parts = host.split('.');
  
  // Skip if localhost or main domain
  if (parts.length <= 2) return null;
  
  const subdomain = parts[0]; // 'acme'
  
  // Map subdomain to tenant
  return tenantSubdomainMap[subdomain];
};

app.use((req, res, next) => {
  req.tenant_id = extractTenantFromSubdomain(req);
  next();
});
```

---

### 3. Custom Domain Mapping
```
https://acme.example.com/dashboard (subdomain)
https://dashboard.acmecorp.com/dashboard (their custom domain)
```

**Setup:**
1. Customer adds CNAME record: `dashboard.acmecorp.com CNAME acme.example.com`
2. App maintainshosts DNS lookup table
3. Route both to same tenant

**Implementation:**
```javascript
const customDomains = {
  'dashboard.acmecorp.com': 'tenant-1', // Custom domain
  'portal.bigcorp.io': 'tenant-3'
};

const extractTenantFromCustomDomain = (req) => {
  const host = req.get('host');
  
  // Check custom domains first
  if (customDomains[host]) {
    return customDomains[host];
  }
  
  // Fall back to subdomain extraction
  return extractTenantFromSubdomain(req);
};
```

---

## DNS Wildcard Configuration

To support any subdomain (acme, beta, customer-1, etc.), configure:

```bash
# DNS A Record for wildcard
*.example.com  A  203.0.113.1  # Points all subdomains to your server

# Or for custom domains, point to your nameserver
CNAME  *.acmecorp.com  example.com
```

### Wildcard SSL Certificate

```bash
# Instead of:
# - acme.example.com
# - beta.example.com
# (need separate cert for each)

# Use one wildcard cert:
*.example.com  (covers all subdomains)
```

**Cost Consideration:**
- Single domain: $15/year
- Wildcard: $50-100/year
- Multi-SAN: $100-200/year

---

## Router Architecture Pattern

```javascript
// Middleware stack for subdomain routes
const tenantRouter = (req, res, next) => {
  const tenantId = extractTenantFromHost(req);
  
  if (!tenantId) {
    return res.status(404).json({ error: 'Tenant not found' });
  }
  
  req.tenant_id = tenantId;
  req.tenant = getTenant(tenantId);
  
  next();
};

app.use(tenantRouter);

// Now every route automatically has req.tenant_id
app.get('/dashboard', (req, res) => {
  const data = getDashboardData(req.tenant_id);
  res.json(data);
});
```

### Domain Registration Endpoint

```javascript
app.post('/api/tenant/register-domain', verifyToken, (req, res) => {
  const { subdomain } = req.body;
  
  // Validate subdomain format
  if (!/^[a-z0-9-]+$/.test(subdomain)) {
    return res.status(400).json({ error: 'Invalid subdomain format' });
  }
  
  // Check if already taken
  if (await isSubdomainTaken(subdomain)) {
    return res.status(409).json({ error: 'Subdomain already taken' });
  }
  
  // Register it
  tenantSubdomainMap[subdomain] = req.tenant_id;
  
  res.json({ 
    success: true,
    url: `https://${subdomain}.example.com`
  });
});

const isSubdomainTaken = (subdomain) => {
  // Also check reserved names
  const reserved = ['www', 'mail', 'api', 'admin', 'support'];
  if (reserved.includes(subdomain)) return true;
  
  return subdomain in tenantSubdomainMap;
};
```

---

## Tenant Context Preservation

Once extracted, maintain tenant context throughout the request:

```javascript
// Option 1: Store in req object
app.use((req, res, next) => {
  req.tenant_id = extractTenant(req);
  req.tenant = getTenant(req.tenant_id);
  next();
});

app.get('/data', (req, res) => {
  const data = queryDatabase(req.tenant_id); // Always use req.tenant_id
});

// Option 2: Inject into logging
const logger = winston.createLogger({
  format: winston.format.json()
});

app.use((req, res, next) => {
  req.logger = logger.child({ tenant_id: req.tenant_id });
  req.logger.info('Request received', { method: req.method });
  next();
});
```

---

## Avoiding Tenant Context Leaks

### VULNERABLE: Forgetting to filter by tenant
```javascript
// WRONG: Returns data from ALL tenants
app.get('/api/documents', (req, res) => {
  const docs = db.documents.find({}); // No tenant filter!
  res.json(docs);
});
```

### SECURE: Always filter by current tenant
```javascript
// RIGHT: Returns only current tenant's data
app.get('/api/documents', (req, res) => {
  const docs = db.documents.find({ tenant_id: req.tenant_id });
  res.json(docs);
});

// Better: Use middleware to enforce filtering
const getTenantData = (model) => {
  return (req, res, next) => {
    req.query.tenant_id = req.tenant_id; // Force the filter
    next();
  };
};

app.get('/api/documents', getTenantData(documents), (req, res) => {
  const docs = db.documents.find(req.query);
  res.json(docs);
});
```

---

## Cross-Domain Authentication

### Challenge: Cookies Don't Cross Domains
```javascript
// User logged in on acme.example.com
// But visits beta.example.com
// Cookies are domain-specific!
```

### Solution 1: Single Sign-On (SSO) via Central Domain
```javascript
// Central auth server: auth.example.com
app.get('/login', (req, res) => {
  // Redirect to central login
  res.redirect(`https://auth.example.com/login?callback=${req.get('origin')}`);
});

// After login, SSO returns JWT in URL or Authorization header
app.get('/callback', (req, res) => {
  const { token } = req.query;
  res.cookie('auth_token', token, { secure: true, httpOnly: true });
  res.redirect(`/dashboard`);
});
```

### Solution 2: JWT Tokens (Recommended for API)
```javascript
// Client stores JWT in localStorage (survives domain changes)
// Sent via Authorization header (not cookies)
const verifyToken = (req, res, next) => {
  const token = req.headers.authorization?.split(' ')[1];
  if (!token) return res.status(401).json({ error: 'No token' });
  
  try {
    req.user = jwt.verify(token, JWT_SECRET);
    next();
  } catch (e) {
    res.status(401).json({ error: 'Invalid token' });
  }
};

// Works across any domain!
```

---

## Tenant Routing Examples

### Example 1: SaaS Analytics Tool
```
Tenant: Acme Corp
├─ Analytics: acme.analytics.example.com
├─ Dashboard: acme.example.com
└─ API: api.example.com/acme (path fallback)

Tenant: Beta Inc
├─ Analytics: beta.analytics.example.com
├─ Dashboard: beta.example.com
└─ API: api.example.com/beta
```

### Example 2: White-Label SaaS
```
Tenant: Acme Corp (custom domain)
├─ Portal: dashboard.acmecorp.com ← Customer's own domain!
├─ API: https://dashboard.acmecorp.com/api

Tenant: Beta Inc (subdomain)
├─ Portal: beta.example.com
├─ API: https://api.example.com/beta
```

---

## Performance Considerations

### DNS Lookup Cache
```javascript
const dnsCache = {};
const getCachedTenant = (host) => {
  if (dnsCache[host]) {
    return dnsCache[host];
  }
  
  const tenant = lookupTenant(host); // DB query
  dnsCache[host] = tenant;
  
  // Expire cache after 1 hour
  setTimeout(() => delete dnsCache[host], 3600000);
  
  return tenant;
};
```

### Custom Domain Verification
```javascript
// Prevent abuse: verify CNAME before allowing custom domain
const verifyCustomDomain = async (domain, expected_cname) => {
  const dns = require('dns').promises;
  
  try {
    const records = await dns.resolveCname(domain);
    const verified = records.some(r => r === expected_cname);
    
    if (!verified) {
      throw new Error(`CNAME not pointing to ${expected_cname}`);
    }
    
    return true;
  } catch (e) {
    logger.error('Domain verification failed', { domain, error: e.message });
    return false;
  }
};

app.post('/api/register-custom-domain', async (req, res) => {
  const { domain } = req.body;
  const verified = await verifyCustomDomain(domain, 'example.com');
  
  if (!verified) {
    return res.status(400).json({ 
      error: 'Custom domain not properly configured',
      message: `Please add CNAME: ${domain} CNAME example.com`
    });
  }
  
  registerDomain(req.tenant_id, domain);
  res.json({ success: true });
});
```

---

## Real-World Attack: Tenant Confusion

### Vulnerability
```javascript
// VULNERABLE: Trusting query parameter instead of hostname
app.get('/api/data', (req, res) => {
  const tenant = req.query.tenant_id; // User can change this!
  const data = db.find({ tenant_id: tenant });
  res.json(data);
});

// Attacker accesses: /api/data?tenant_id=victim-tenant
```

### Defense
```javascript
// SECURE: Extract from hostname only
app.get('/api/data', (req, res) => {
  const tenant = extractTenantFromHost(req); // Read-only from hostname
  
  // Verify user belongs to this tenant
  if (!userBelongsToTenant(req.user.id, tenant)) {
    return res.status(403).json({ error: 'Forbidden' });
  }
  
  const data = db.find({ tenant_id: tenant });
  res.json(data);
});
```

---

## Best Practices

✅ **Always extract tenant from hostname/path, never from user input**  
✅ **Filter ALL database queries by tenant_id**  
✅ **Cache DNS lookups** (but expire regularly for domain changes)  
✅ **Verify custom domains via CNAME before activation**  
✅ **Use wildcard SSL certificates for cost savings**  
✅ **Consider path-based routing for MVP** (simpler, scale to subdomains later)  

---

## Related Patterns

- **Module 01**: Row-level security - Filter data once tenant extracted
- **Module 02**: RBAC - Users must belong to extracted tenant
- **Module 03**: Feature limits - Apply per tenant extracted from domain

```
example.com A record: 1.2.3.4
*.example.com CNAME: example.com
```

This routes ALL subdomains to same IP:
```
acme.example.com → 1.2.3.4 (your server)
beta.example.com → 1.2.3.4 (your server)
anything.example.com → 1.2.3.4 (your server)
```

## SSL Certificates

**Wildcard Certificate** (covers all subdomains):
```
CN: *.example.com
Covers: acme.example.com, beta.example.com, etc.
Cost: Same as single-domain cert (~$50-100/year)
```

**Multi-Domain SAN Certificate** (covers multiple domains):
```
Primary: example.com
SAN: *.example.com, api.example.com, static.example.com
Cost: Higher ~$200+/year
```

## Cookies Across Subdomains

```javascript
res.cookie('session', token, {
  // Available to all subdomains
  domain: '.example.com',
  httpOnly: true,
  secure: true,
  sameSite: 'Strict'
});
```

## CORS with Multiple Subdomains

```javascript
const corsOptions = {
  origin: (origin, callback) => {
    // Allow all *.example.com subdomains
    if (origin && origin.endsWith('.example.com')) {
      callback(null, true);
    } else {
      callback(new Error('CORS blocked'));
    }
  },
  credentials: true
};

app.use(cors(corsOptions));
```

## Custom Domain Support

```javascript
const getTenantByCustomDomain = async (hostname) => {
  // Look up in database
  const result = await db.query(
    'SELECT id FROM tenants WHERE custom_domain = $1',
    [hostname]
  );
  
  return result.rows[0]?.id || null;
};

// In middleware
const tenant_id = await getTenantByCustomDomain(req.hostname) ||
                   extractTenantFromSubdomain(req);
```

## Reserved Subdomains

```javascript
const reserved = ['www', 'api', 'admin', 'mail', 'ftp', 'static', 'cdn', 'blog'];

const validateSubdomain = (subdomain) => {
  if (reserved.includes(subdomain)) {
    throw new Error('This subdomain is reserved');
  }
  if (subdomain.length < 3 || subdomain.length > 63) {
    throw new Error('Subdomain must be 3-63 characters');
  }
  if (!/^[a-z0-9-]*$/.test(subdomain)) {
    throw new Error('Only lowercase letters, numbers, and hyphens');
  }
};
```

## URL Generation Helpers

```javascript
const getTenantURL = (tenant, path = '') => {
  // Use custom domain if set
  if (tenant.custom_domain) {
    return `https://${tenant.custom_domain}${path}`;
  }
  
  // Use subdomain
  const subdomain = tenant.name.toLowerCase().replace(/ /g, '-');
  return `https://${subdomain}.example.com${path}`;
};
```
