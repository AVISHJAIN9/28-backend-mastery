// Schema for usage metering and API call tracking

const schema = {
  tenants: {
    'tenant-1': { id: 'tenant-1', name: 'Acme Corp', plan: 'pro', created_at: new Date('2024-01-01') },
    'tenant-2': { id: 'tenant-2', name: 'Beta Inc', plan: 'free', created_at: new Date('2024-01-05') }
  },

  meter_events: {
    'event-1': { id: 'event-1', tenant_id: 'tenant-1', metric: 'api_calls', value: 100, timestamp: new Date(), endpoint: '/api/documents' },
    'event-2': { id: 'event-2', tenant_id: 'tenant-1', metric: 'api_calls', value: 50, timestamp: new Date(), endpoint: '/api/users' },
    'event-3': { id: 'event-3', tenant_id: 'tenant-2', metric: 'api_calls', value: 10, timestamp: new Date(), endpoint: '/api/documents' }
  },

  usage_summary: {
    'tenant-1': { tenant_id: 'tenant-1', api_calls: 150, storage_bytes: 1024000, data_transfer_gb: 2.5, period_start: new Date(Date.now() - 30*24*60*60*1000), period_end: new Date() },
    'tenant-2': { tenant_id: 'tenant-2', api_calls: 10, storage_bytes: 512000, data_transfer_gb: 0.2, period_start: new Date(Date.now() - 30*24*60*60*1000), period_end: new Date() }
  },

  quotas: {
    'tenant-1': { tenant_id: 'tenant-1', api_call_limit: 100000, storage_limit_bytes: 100*1024*1024*1024, data_transfer_limit_gb: 500 },
    'tenant-2': { tenant_id: 'tenant-2', api_call_limit: 1000, storage_limit_bytes: 1*1024*1024*1024, data_transfer_limit_gb: 10 }
  }
};

const metricsEnum = {
  API_CALLS: 'api_calls',
  STORAGE: 'storage_bytes',
  DATA_TRANSFER: 'data_transfer_gb',
  TEAM_MEMBERS: 'team_members'
};

module.exports = { schema, metricsEnum };
