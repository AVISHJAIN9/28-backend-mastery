// Controller for GDPR data export
const { schema, exportTypes, formats } = require('./schema');

class ExportController {
  createExportRequest(tenantId, userId, requestType, format = 'JSON') {
    const exportId = `export-${Date.now()}`;
    schema.export_requests[exportId] = {
      id: exportId, tenant_id: tenantId, user_id: userId, request_type: requestType,
      status: 'processing', created_at: new Date(), expires_at: new Date(Date.now() + 7*24*60*60*1000),
      download_url: null, file_size_bytes: null, format
    };
    setTimeout(() => this.completeExport(exportId), 2000);
    return schema.export_requests[exportId];
  }
  
  completeExport(exportId) {
    const req = schema.export_requests[exportId];
    if (req) {
      req.status = 'completed';
      req.download_url = `/exports/${exportId}.${req.format.toLowerCase()}`;
      req.file_size_bytes = Math.random() * 10*1024*1024;
    }
  }
  
  getExportRequest(exportId) { return schema.export_requests[exportId] || null; }
  
  getExportRequests(tenantId) {
    return Object.values(schema.export_requests).filter(e => e.tenant_id === tenantId);
  }
  
  getUserData(userId) { return schema.user_data[userId] || null; }
  
  requestAccountDeletion(tenantId, userId) {
    const deleteId = `delete-${Date.now()}`;
    schema.deletion_requests[deleteId] = {
      id: deleteId, tenant_id: tenantId, user_id: userId, request_type: 'ACCOUNT_DELETION',
      status: 'scheduled', created_at: new Date(), scheduled_deletion_at: new Date(Date.now() + 30*24*60*60*1000)
    };
    return schema.deletion_requests[deleteId];
  }
  
  getDeletionRequests(tenantId) {
    return Object.values(schema.deletion_requests).filter(d => d.tenant_id === tenantId);
  }
  
  cancelDeletion(deleteId) {
    const req = schema.deletion_requests[deleteId];
    if (req) req.status = 'cancelled';
    return req;
  }
  
  getAllExportTypes() { return exportTypes; }
  
  getAllFormats() { return formats; }
}

module.exports = ExportController;
