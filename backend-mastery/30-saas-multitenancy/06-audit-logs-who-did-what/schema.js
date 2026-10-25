// Schema for audit logs - who did what and when

const schema = {
  audit_logs: {
    'log-1': { id: 'log-1', tenant_id: 'tenant-1', user_id: 'user-1', action: 'CREATE_DOCUMENT', resource_type: 'document', resource_id: 'doc-1', status: 'success', ip: '192.168.1.1', user_agent: 'Mozilla...', timestamp: new Date(), metadata: { title: 'New Doc' } },
    'log-2': { id: 'log-2', tenant_id: 'tenant-1', user_id: 'user-2', action: 'DELETE_DOCUMENT', resource_type: 'document', resource_id: 'doc-5', status: 'success', ip: '192.168.1.2', user_agent: 'Safari...', timestamp: new Date(), metadata: { reason: 'Outdated' } },
    'log-3': { id: 'log-3', tenant_id: 'tenant-1', user_id: 'user-3', action: 'LOGIN_FAILED', resource_type: 'user', resource_id: 'user-3', status: 'failure', ip: '203.0.113.0', user_agent: 'Unknown', timestamp: new Date(), metadata: { reason: 'Invalid password' } },
    'log-4': { id: 'log-4', tenant_id: 'tenant-2', user_id: 'user-4', action: 'EXPORT_DATA', resource_type: 'tenant', resource_id: 'tenant-2', status: 'success', ip: '192.168.1.3', user_agent: 'Chrome...', timestamp: new Date(), metadata: { format: 'csv', rows: 1000 } }
  },

  audit_rules: {
    'audit-1': { id: 'audit-1', tenant_id: 'tenant-1', event_type: 'DELETE_DOCUMENT', alert_enabled: true, notify_email: 'admin@acme.com' },
    'audit-2': { id: 'audit-2', tenant_id: 'tenant-1', event_type: 'LOGIN_FAILED', alert_enabled: true, notify_email: 'security@acme.com' }
  }
};

const actions = {
  CREATE_DOCUMENT: 'Created document',
  UPDATE_DOCUMENT: 'Updated document',
  DELETE_DOCUMENT: 'Deleted document',
  READ_DOCUMENT: 'Read document',
  LOGIN_SUCCESS: 'Login successful',
  LOGIN_FAILED: 'Login failed',
  EXPORT_DATA: 'Exported data',
  USER_INVITE: 'Invited user',
  ROLE_CHANGED: 'Role changed',
  SETTINGS_UPDATED: 'Settings updated'
};

module.exports = { schema, actions };
