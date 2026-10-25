// Controller for audit logs
const { schema, actions } = require('./schema');

class AuditController {
  logAction(tenantId, userId, action, resourceType, resourceId, status = 'success', metadata = {}, ip = null, userAgent = null) {
    const logId = `log-${Date.now()}`;
    schema.audit_logs[logId] = {
      id: logId, tenant_id: tenantId, user_id: userId, action, resource_type: resourceType, 
      resource_id: resourceId, status, ip, user_agent: userAgent, timestamp: new Date(), metadata
    };
    return schema.audit_logs[logId];
  }
  
  getAuditLog(logId) { return schema.audit_logs[logId] || null; }
  
  getAuditLogs(tenantId, options = {}) {
    let logs = Object.values(schema.audit_logs).filter(l => l.tenant_id === tenantId);
    if (options.userId) logs = logs.filter(l => l.user_id === options.userId);
    if (options.action) logs = logs.filter(l => l.action === options.action);
    if (options.resourceType) logs = logs.filter(l => l.resource_type === options.resourceType);
    if (options.status) logs = logs.filter(l => l.status === options.status);
    return logs.sort((a, b) => new Date(b.timestamp) - new Date(a.timestamp));
  }
  
  searchAuditLogs(tenantId, query) {
    const logs = this.getAuditLogs(tenantId);
    return logs.filter(l => 
      l.action.includes(query.toUpperCase()) || 
      l.user_id.includes(query) || 
      l.resource_id.includes(query)
    );
  }
  
  createAuditRule(tenantId, eventType, alertEnabled, notifyEmail) {
    const ruleId = `audit-${Date.now()}`;
    schema.audit_rules[ruleId] = { id: ruleId, tenant_id: tenantId, event_type: eventType, alert_enabled: alertEnabled, notify_email: notifyEmail };
    return schema.audit_rules[ruleId];
  }
  
  getAuditRules(tenantId) {
    return Object.values(schema.audit_rules).filter(r => r.tenant_id === tenantId);
  }
  
  getAuditStats(tenantId) {
    const logs = this.getAuditLogs(tenantId);
    return {
      total: logs.length,
      success: logs.filter(l => l.status === 'success').length,
      failure: logs.filter(l => l.status === 'failure').length,
      byAction: Object.fromEntries(Object.keys(actions).map(a => [a, logs.filter(l => l.action === a).length]))
    };
  }
}

module.exports = AuditController;
