// Controller for subdomain routing
const { schema } = require('./schema');

class SubdomainController {
  extractTenantFromHost(host) {
    if (!host) return null;
    const mapping = schema.domain_mappings[host];
    if (mapping) return mapping.tenant_id;
    
    const subdomain = host.split('.')[0];
    const mapped = Object.values(schema.domain_mappings).find(m => m.subdomain === subdomain);
    return mapped ? mapped.tenant_id : null;
  }
  
  getTenant(tenantId) { return schema.tenants[tenantId] || null; }
  
  getAllTenants() { return Object.values(schema.tenants); }
  
  registerSubdomain(tenantId, subdomain) {
    const tenant = schema.tenants[tenantId];
    if (!tenant) throw new Error('Tenant not found');
    tenant.subdomain = subdomain;
    const host = `${subdomain}.example.com`;
    schema.domain_mappings[host] = { subdomain, tenant_id: tenantId };
    return { tenant, host };
  }
  
  registerCustomDomain(tenantId, customDomain) {
    const tenant = schema.tenants[tenantId];
    if (!tenant) throw new Error('Tenant not found');
    tenant.custom_domain = customDomain;
    schema.domain_mappings[customDomain] = { subdomain: null, custom_domain: true, tenant_id: tenantId };
    return { tenant, customDomain };
  }
  
  getDomainMappings() { return schema.domain_mappings; }
  
  getDomainMappingsForTenant(tenantId) {
    return Object.entries(schema.domain_mappings)
      .filter(([_, m]) => m.tenant_id === tenantId)
      .map(([host, m]) => ({ host, ...m }));
  }
}

module.exports = SubdomainController;
