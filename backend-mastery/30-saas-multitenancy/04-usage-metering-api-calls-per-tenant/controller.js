// Controller for usage metering
const { schema, metricsEnum } = require('./schema');

class MeteringController {
  recordEvent(tenantId, metric, value, endpoint = null) {
    const eventId = `event-${Date.now()}`;
    schema.meter_events[eventId] = { id: eventId, tenant_id: tenantId, metric, value, timestamp: new Date(), endpoint };
    this.updateUsageSummary(tenantId, metric, value);
    return schema.meter_events[eventId];
  }
  
  updateUsageSummary(tenantId, metric, value) {
    if (!schema.usage_summary[tenantId]) {
      schema.usage_summary[tenantId] = { tenant_id: tenantId, api_calls: 0, storage_bytes: 0, data_transfer_gb: 0, period_start: new Date(), period_end: new Date() };
    }
    schema.usage_summary[tenantId][metric] = (schema.usage_summary[tenantId][metric] || 0) + value;
  }
  
  getUsageSummary(tenantId) { return schema.usage_summary[tenantId] || null; }
  
  getQuota(tenantId) { return schema.quotas[tenantId] || null; }
  
  checkQuotaExceeded(tenantId, metric) {
    const summary = this.getUsageSummary(tenantId);
    const quota = this.getQuota(tenantId);
    if (!summary || !quota) return false;
    
    const limitKey = `${metric}_limit`;
    const limit = quota[limitKey];
    return limit && summary[metric] >= limit;
  }
  
  getQuotaPercentage(tenantId, metric) {
    const summary = this.getUsageSummary(tenantId);
    const quota = this.getQuota(tenantId);
    if (!summary || !quota) return 0;
    
    const limitKey = `${metric}_limit`;
    const limit = quota[limitKey];
    if (!limit) return 0;
    return Math.round((summary[metric] / limit) * 100);
  }
  
  getMeterEvents(tenantId, metric = null) {
    return Object.values(schema.meter_events).filter(e => e.tenant_id === tenantId && (!metric || e.metric === metric));
  }
  
  resetUsageSummary(tenantId) {
    if (schema.usage_summary[tenantId]) {
      schema.usage_summary[tenantId] = { tenant_id: tenantId, api_calls: 0, storage_bytes: 0, data_transfer_gb: 0, period_start: new Date(), period_end: new Date() };
    }
  }
}

module.exports = MeteringController;
