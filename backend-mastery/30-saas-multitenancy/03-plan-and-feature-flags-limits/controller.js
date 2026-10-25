// Controller for plans and feature flags
const { schema, featureFlags } = require('./schema');

class PlanController {
  getAllPlans() { return Object.values(schema.plans); }
  
  getPlan(planId) { return schema.plans[planId] || null; }
  
  getTenantPlan(tenantId) {
    const tenant = schema.tenants[tenantId];
    return tenant ? schema.plans[tenant.plan] : null;
  }
  
  canUseFeature(tenantId, feature) {
    const tenant = schema.tenants[tenantId];
    if (!tenant) return false;
    const plan = schema.plans[tenant.plan];
    return plan && plan.features.includes(feature);
  }
  
  checkUsageLimit(tenantId, metric) {
    const usage = schema.usage[tenantId];
    const plan = this.getTenantPlan(tenantId);
    if (!usage || !plan) return { ok: true };
    
    const limit = plan.limits[metric];
    const currentUsage = usage[metric];
    const ok = limit === null || currentUsage < limit;  
    const percentage = limit ? Math.round((currentUsage / limit) * 100) : 0;
    
    return { ok, percentage, currentUsage, limit };
  }
  
  incrementUsage(tenantId, metric, amount = 1) {
    if (!schema.usage[tenantId]) schema.usage[tenantId] = { tenant_id: tenantId };
    schema.usage[tenantId][metric] = (schema.usage[tenantId][metric] || 0) + amount;
    return schema.usage[tenantId];
  }
  
  getFeatureFlag(featureName) { return featureFlags[featureName] || null; }
  
  getAllFeatureFlags() { return featureFlags; }
  
  upgradePlan(tenantId, newPlanId) {
    const tenant = schema.tenants[tenantId];
    if (!tenant || !schema.plans[newPlanId]) throw new Error('Invalid tenant or plan');
    tenant.plan = newPlanId;
    return tenant;
  }
}

module.exports = PlanController;
