// Schema for GDPR data export and portability

const schema = {
  export_requests: {
    'export-1': { id: 'export-1', tenant_id: 'tenant-1', user_id: 'user-1', request_type: 'FULL_DATA_EXPORT', status: 'completed', created_at: new Date(Date.now() - 24*60*60*1000), expires_at: new Date(Date.now() + 7*24*60*60*1000), download_url: '/exports/export-1.zip', file_size_bytes: 5242880 },
    'export-2': { id: 'export-2', tenant_id: 'tenant-1', user_id: 'user-2', request_type: 'PERSONAL_DATA_EXPORT', status: 'processing', created_at: new Date(Date.now() - 30*60*1000), expires_at: null, download_url: null, file_size_bytes: null }
  },

  user_data: {
    'user-1': { id: 'user-1', name: 'Alice', email: 'alice@acme.com', created_at: new Date('2024-01-01'), documents: ['doc-1', 'doc-2', 'doc-3'], metadata: { phone: '555-0100', address: '123 Main St' } },
    'user-2': { id: 'user-2', name: 'Bob', email: 'bob@acme.com', created_at: new Date('2024-01-05'), documents: ['doc-4', 'doc-5'], metadata: { phone: '555-0101', address: null } }
  },

  deletion_requests: {
    'delete-1': { id: 'delete-1', tenant_id: 'tenant-1', user_id: 'user-1', request_type: 'ACCOUNT_DELETION', status: 'scheduled', created_at: new Date(), scheduled_deletion_at: new Date(Date.now() + 30*24*60*60*1000) }
  }
};

const exportTypes = {
  FULL_DATA_EXPORT: 'All user data (documents, metadata, usage)',
  PERSONAL_DATA_EXPORT: 'Personal info only',
  DOCUMENT_EXPORT: 'Documents only',
  USAGE_EXPORT: 'Usage and metrics'
};

const formats = ['JSON', 'CSV', 'XML', 'ZIP'];

module.exports = { schema, exportTypes, formats };
