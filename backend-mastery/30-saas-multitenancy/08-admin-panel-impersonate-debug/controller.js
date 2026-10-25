// Controller for admin panel
const { schema, adminRoles } = require('./schema');

class AdminController {
  getAdminUser(adminId) { return schema.admin_users[adminId] || null; }
  
  getAllAdminUsers() { return Object.values(schema.admin_users); }
  
  canAdminAccess(adminId, permission) {
    const admin = schema.admin_users[adminId];
    if (!admin) return false;
    const perms = adminRoles[admin.role] || [];
    return perms.includes(permission);
  }
  
  startImpersonation(adminId, tenantId, userId) {
    if (!this.canAdminAccess(adminId, 'impersonate_users')) throw new Error('Permission denied');
    const sessionId = `session-${Date.now()}`;
    schema.impersonation_sessions[sessionId] = {
      id: sessionId, admin_id: adminId, tenant_id: tenantId, user_id: userId,
      started_at: new Date(), ended_at: null, action_log: []
    };
    return schema.impersonation_sessions[sessionId];
  }
  
  endImpersonation(sessionId) {
    const session = schema.impersonation_sessions[sessionId];
    if (session) session.ended_at = new Date();
    return session;
  }
  
  logImpersonationAction(sessionId, action) {
    const session = schema.impersonation_sessions[sessionId];
    if (session) session.action_log.push(action);
    return session;
  }
  
  getImpersonationSessions(adminId) {
    return Object.values(schema.impersonation_sessions).filter(s => s.admin_id === adminId);
  }
  
  logSystemEvent(type, tenantId, metadata = {}) {
    const eventId = `event-${Date.now()}`;
    schema.system_events[eventId] = { id: eventId, type, tenant_id: tenantId, metadata, timestamp: new Date() };
    return schema.system_events[eventId];
  }
  
  getSystemEvents(tenantId, type = null) {
    let events = Object.values(schema.system_events).filter(e => e.tenant_id === tenantId);
    if (type) events = events.filter(e => e.type === type);
    return events.sort((a, b) => new Date(b.timestamp) - new Date(a.timestamp));
  }
  
  addDebugLog(tenantId, level, message, stackTrace = null) {
    const logId = `debug-${Date.now()}`;
    schema.debug_logs[logId] = { id: logId, tenant_id: tenantId, level, message, timestamp: new Date(), stack_trace: stackTrace };
    return schema.debug_logs[logId];
  }
  
  getDebugLogs(tenantId, level = null) {
    let logs = Object.values(schema.debug_logs).filter(l => l.tenant_id === tenantId);
    if (level) logs = logs.filter(l => l.level === level);
    return logs.sort((a, b) => new Date(b.timestamp) - new Date(a.timestamp));
  }
  
  getAllAdminRoles() { return adminRoles; }
}

module.exports = AdminController;
