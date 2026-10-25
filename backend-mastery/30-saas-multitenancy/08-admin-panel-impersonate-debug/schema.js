// Schema for admin panel with impersonation and debugging

const schema = {
  admin_users: {
    'admin-1': { id: 'admin-1', email: 'admin@platform.com', name: 'System Admin', role: 'super_admin', created_at: new Date(), last_login: new Date() },
    'admin-2': { id: 'admin-2', email: 'support@platform.com', name: 'Support Admin', role: 'support_admin', created_at: new Date(), last_login: new Date() }
  },

  impersonation_sessions: {
    'session-1': { id: 'session-1', admin_id: 'admin-1', tenant_id: 'tenant-1', user_id: 'user-1', started_at: new Date(Date.now() - 60*60*1000), ended_at: null, action_log: ['GET /api/documents', 'POST /api/documents'] },
    'session-2': { id: 'session-2', admin_id: 'admin-2', tenant_id: 'tenant-2', user_id: 'user-3', started_at: new Date(Date.now() - 30*60*1000), ended_at: new Date(Date.now() - 10*60*1000), action_log: ['GET /api/users'] }
  },

  system_events: {
    'event-1': { id: 'event-1', type: 'TENANT_CREATED', tenant_id: 'tenant-1', metadata: { name: 'Acme Corp' }, timestamp: new Date() },
    'event-2': { id: 'event-2', type: 'USER_SIGNUP', tenant_id: 'tenant-1', metadata: { user_id: 'user-1' }, timestamp: new Date() },
    'event-3': { id: 'event-3', type: 'PAYMENT_FAILED', tenant_id: 'tenant-2', metadata: { reason: 'card_declined' }, timestamp: new Date() }
  },

  debug_logs: {
    'debug-1': { id: 'debug-1', tenant_id: 'tenant-1', level: 'ERROR', message: 'Database connection timeout', timestamp: new Date(), stack_trace: 'at DB.connect()' },
    'debug-2': { id: 'debug-2', tenant_id: 'tenant-1', level: 'WARNING', message: 'High API latency', timestamp: new Date(), stack_trace: null }
  }
};

const adminRoles = {
  super_admin: ['view_all_tenants', 'impersonate_users', 'debug_logs', 'system_events', 'manage_admins'],
  support_admin: ['view_assigned_tenants', 'impersonate_users', 'debug_logs', 'contact_users'],
  billing_admin: ['view_all_tenants', 'manage_subscriptions', 'view_invoices']
};

module.exports = { schema, adminRoles };
