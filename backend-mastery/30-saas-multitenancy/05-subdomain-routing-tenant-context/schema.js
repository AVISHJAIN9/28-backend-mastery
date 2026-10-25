// Schema for subdomain routing and tenant context

const schema = {
  tenants: {
    'tenant-1': { id: 'tenant-1', name: 'Acme Corp', subdomain: 'acme', custom_domain: null, plan: 'pro', created_at: new Date() },
    'tenant-2': { id: 'tenant-2', name: 'Beta Inc', subdomain: 'beta', custom_domain: 'mycompany.com', plan: 'pro', created_at: new Date() },
    'tenant-3': { id: 'tenant-3', name: 'Gamma LLC', subdomain: 'gamma', custom_domain: null, plan: 'free', created_at: new Date() }
  },

  domain_mappings: {
    'acme.example.com': { subdomain: 'acme', tenant_id: 'tenant-1' },
    'beta.example.com': { subdomain: 'beta', tenant_id: 'tenant-2' },
    'mycompany.com': { subdomain: null, custom_domain: true, tenant_id: 'tenant-2' },
    'gamma.example.com': { subdomain: 'gamma', tenant_id: 'tenant-3' }
  },

  routing_rules: {
    'default': { pattern: ':subdomain.example.com', tenant_extraction: 'subdomain', port: 443 },
    'custom': { pattern: 'custom-domain', tenant_extraction: 'dns_cname', port: 443 },
    'api': { pattern: 'api.example.com', tenant_extraction: 'header_x-tenant-id', port: 443 }
  }
};

module.exports = { schema };
