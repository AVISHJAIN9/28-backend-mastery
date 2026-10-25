// Schema for plans, feature flags, and usage limits

const schema = {
  plans: {
    free: { id: 'free', name: 'Free', price: 0, features: ['read', 'basic_export'], limits: { api_calls: 1000, storage_gb: 1, team_members: 1 } },
    pro: { id: 'pro', name: 'Pro', price: 99, features: ['read', 'write', 'export', 'api', 'webhooks'], limits: { api_calls: 100000, storage_gb: 100, team_members: 10 } },
    enterprise: { id: 'enterprise', name: 'Enterprise', price: null, features: ['all'], limits: { api_calls: null, storage_gb: null, team_members: null } }
  },

  tenants: {
    'tenant-1': { id: 'tenant-1', name: 'Acme Corp', plan: 'pro', created_at: new Date('2024-01-01') },
    'tenant-2': { id: 'tenant-2', name: 'Beta Inc', plan: 'free', created_at: new Date('2024-01-05') }
  },

  usage: {
    'tenant-1': { tenant_id: 'tenant-1', api_calls: 45000, storage_gb: 25.5, team_members: 8, reset_at: new Date(Date.now() + 30*24*60*60*1000) },
    'tenant-2': { tenant_id: 'tenant-2', api_calls: 800, storage_gb: 0.5, team_members: 1, reset_at: new Date(Date.now() + 30*24*60*60*1000) }
  }
};

const featureFlags = {
  read: { name: 'Read Documents', description: 'Can view documents', requires_plan: 'free' },
  write: { name: 'Write Documents', description: 'Can create/edit documents', requires_plan: 'pro' },
  export: { name: 'Export Data', description: 'Can export in multiple formats', requires_plan: 'pro' },
  api: { name: 'API Access', description: 'Full REST API access', requires_plan: 'pro' },
  webhooks: { name: 'Webhooks', description: 'Outbound webhooks', requires_plan: 'pro' },
  sso: { name: 'SSO/SAML', description: 'Single Sign On', requires_plan: 'enterprise' },
  audit_logs: { name: 'Audit Logs', description: 'Compliance audit logs', requires_plan: 'enterprise' },
  dedicated_support: { name: 'Dedicated Support', description: '24/7 support', requires_plan: 'enterprise' }
};

module.exports = { schema, featureFlags };
