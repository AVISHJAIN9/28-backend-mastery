# Plans, Feature Flags & Usage Limits

## Core Concept: Packaging Value

In SaaS, you control access to features through **plans** (pricing tiers) and **feature flags** (fine-grained toggles). This allows you to:

1. **Monetize incrementally** - Free tier drives adoption, upgrades generate revenue
2. **Manage costs** - Limit expensive features to paying users
3. **Control abuse** - Prevent free users from overwhelming infrastructure
4. **A/B test** - Roll out features gradually to specific user segments

---

## SaaS Pricing Tiers

Every SaaS business organizes subscriptions into tiers with increasing features/limits.

### Real-World Examples

```
GitHub Plans:
- Free:          $0/month - Unlimited public repos, limited private
- Pro:           $4/month - Unlimited repos, advanced features
- Team:          $21/month - Team management, SAML SSO
- Enterprise:    Custom - Compliance, dedicated support

Slack Plans:
- Free:          $0/month - 90 days message history
- Pro:           $12.50/user/month - Full history, integrations
- Business+:     $18.75/user/month - Advanced analytics
- Enterprise:    Custom - DLP, compliance controls
```

### Database Schema Pattern

```javascript
const plans = {
  'free': {
    id: 'free',
    name: 'Free',
    price: 0,
    billing_period: 'monthly',
    features: ['view', 'basic_export'],
    limits: { storage_gb: 1, api_calls: 1000, team_members: 1 }
  },
  'pro': {
    id: 'pro',
    name: 'Pro',
    price: 99,
    billing_period: 'monthly',
    features: ['view', 'edit', 'export', 'api', 'webhooks'],
    limits: { storage_gb: 100, api_calls: 100000, team_members: 10 }
  },
  'enterprise': {
    id: 'enterprise',
    name: 'Enterprise',
    price: null, // Custom pricing
    billing_period: 'annual',
    features: ['all', 'sso', 'audit_logs', 'dedicated_support'],
    limits: { storage_gb: null, api_calls: null, team_members: null } // Unlimited
  }
};

const tenants = {
  'tenant-1': {
    id: 'tenant-1',
    name: 'Acme Corp',
    plan_id: 'pro',
    subscription_status: 'active',
    billing_cycle: '2025-01-01', // Renews monthly
    trial_ends_at: null
  }
};
```

---

## Feature Flags & Feature Gates

A **feature flag** is a runtime toggle that controls code path execution without redeployment.

### Implementation Pattern

```javascript
const canUseFeature = (tenant_id, feature_name) => {
  const tenant = tenants[tenant_id];
  const plan = plans[tenant.plan_id];
  
  // Check if feature exists in plan
  return plan.features.includes(feature_name);
};

// Usage in application
if (canUseFeature(req.tenant_id, 'webhooks')) {
  // Enable webhook creation
} else {
  // Show upgrade prompt
}
```

### Progressive Feature Rollout

Even within a plan, you can stage feature releases:

```javascript
const featureFlags = {
  'new_dashboard_redesign': {
    name: 'New Dashboard UI',
    rollout_percentage: 10, // Only 10% of users see this
    enabled_plans: ['pro', 'enterprise'],
    start_date: '2025-01-15',
    end_date: '2025-02-15'
  },
  'ai_assistant': {
    name: 'AI Code Assistant',
    rollout_percentage: 100,
    enabled_plans: ['enterprise'], // Enterprise only
    start_date: '2025-01-01'
  }
};

const isFeatureEnabledForTenant = (tenant_id, feature_key) => {
  const flag = featureFlags[feature_key];
  if (!flag) return false;
  
  const tenant = tenants[tenant_id];
  const plan = plans[tenant.plan_id];
  
  // 1. Must be enabled for this plan
  if (!flag.enabled_plans.includes(plan.id)) return false;
  
  // 2. Must pass rollout percentage (hash tenant ID)
  const tenantHash = parseInt(tenant_id.charCodeAt(0)) % 100;
  if (tenantHash >= flag.rollout_percentage) return false;
  
  // 3. Must be within date range
  const now = new Date();
  if (flag.start_date && now < new Date(flag.start_date)) return false;
  if (flag.end_date && now > new Date(flag.end_date)) return false;
  
  return true;
};
```

---

## Usage Limits Per Plan

Different plans have different quotas to prevent abuse and incentivize upgrades.

### Common Metrics to Limit

| Metric | Free | Pro | Enterprise |
|--------|------|-----|-----------|
| **Storage** | 1 GB | 100 GB | Unlimited |
| **API Calls/Month** | 1,000 | 100,000 | Unlimited |
| **Team Members** | 1 | 10 | Unlimited |
| **Monthly Reports** | 1 | 50 | Unlimited |
| **Support Response** | Email only | 24h | 1h SLA |
| **Custom Domain** | ❌ | ✅ | ✅ |
| **SSO/SAML** | ❌ | ❌ | ✅ |

### Enforcement Pattern

```javascript
const checkUsageLimit = (tenant_id, metric, current_value) => {
  const tenant = tenants[tenant_id];
  const plan = plans[tenant.plan_id];
  const limit = plan.limits[metric];
  
  // Null = unlimited
  if (limit === null) return { allowed: true };
  
  // Check if exceeded
  if (current_value >= limit) {
    return { 
      allowed: false, 
      message: `${metric} limit reached. Upgrade to ${getNextPlan(plan.id).name}`,
      current: current_value,
      limit: limit
    };
  }
  
  return { 
    allowed: true, 
    usage_percentage: Math.round((current_value / limit) * 100)
  };
};
```

---

## Soft vs Hard Limits

### Hard Limit (Block immediately)
```javascript
// User cannot proceed if limit hit
app.post('/api/documents', verifyToken, (req, res) => {
  const check = checkUsageLimit(req.tenant_id, 'documents', 
    getTenantDocumentCount(req.tenant_id)
  );
  
  if (!check.allowed) {
    return res.status(402).json({ 
      error: 'Plan limit exceeded', 
      upgrade_url: '/billing/upgrade'
    });
  }
  
  // Create document
});
```

### Soft Limit (Warn but allow)
```javascript
// Show warning but let them proceed (for better UX)
app.post('/api/reports', verifyToken, (req, res) => {
  const check = checkUsageLimit(req.tenant_id, 'reports', 
    getTenantReportCount(req.tenant_id)
  );
  
  const result = createReport(req.body);
  
  if (check.usage_percentage > 90) {
    // Include warning in response
    res.json({ 
      data: result,
      warning: `You've used 95% of your monthly reports. Upgrade for unlimited.`
    });
  } else {
    res.json({ data: result });
  }
});
```

---

## Downgrade & Upgrade Flows

### Upgrade Path
```javascript
// Simple: Tenant selects plan, charge immediately
async function upgradePlan(tenant_id, new_plan_id) {
  const tenant = tenants[tenant_id];
  const old_plan = plans[tenant.plan_id];
  const new_plan = plans[new_plan_id];
  
  // Proration logic: refund unused days on old plan
  const daysUsed = Math.floor((now - tenant.billing_cycle) / 86400000);
  const daysTotal = 30;
  const refund = (old_plan.price * (daysTotal - daysUsed)) / daysTotal;
  
  // Charge difference
  const charge = new_plan.price - refund;
  
  tenant.plan_id = new_plan_id;
  tenant.billing_cycle = now; // Reset billing date
  
  // Process payment (stripe, etc)
  return { success: true, charge, new_plan: new_plan_id };
}
```

### Downgrade Path
```javascript
// Downgrade either immediate or at end of cycle (safer)
async function downgradePlan(tenant_id, new_plan_id) {
  const tenant = tenants[tenant_id];
  
  // Option A: Immediate (give refund)
  // tenant.plan_id = new_plan_id;
  
  // Option B: At end of cycle (safer, better retention)
  tenant.downgrade_pending = {
    plan_id: new_plan_id,
    effective_date: tenant.billing_cycle // Next cycle
  };
  
  return { 
    success: true, 
    message: 'Downgrade scheduled for next billing cycle'
  };
}
```

---

## Real-World Attack: Feature Bypass

### Vulnerability
```javascript
// VULNERABLE: Trust client for feature check
app.post('/api/export', (req, res) => {
  // Client sends: { feature: 'advanced_export', data: [...] }
  if (req.body.feature === 'advanced_export') {
    // Free tier user just exports...
  }
});
```

### Defense
```javascript
// SECURE: Always verify server-side
app.post('/api/export', verifyToken, (req, res) => {
  const canExport = canUseFeature(req.tenant_id, 'advanced_export');
  if (!canExport) {
    logger.warn('Feature bypass attempt', { 
      tenant_id: req.tenant_id,
      feature: 'advanced_export'
    });
    return res.status(403).json({ error: 'Feature not available on your plan' });
  }
  
  performExport(req.body);
});
```

---

## Best Practices

✅ **Always verify limits server-side** - Never trust client claims  
✅ **Show remaining quota to users** - Encourage upgrades at 80% usage  
✅ **Prorate on upgrades/downgrades** - Fair billing improves retention  
✅ **Use feature flags for gradual rollouts** - Reduce risk of bugs  
✅ **Monitor abuse patterns** - Some "free" users cost more than revenue  
✅ **Grandfather existing users** - Don't break long-time customers  

---

## Related Patterns

- **Module 04**: Usage metering - How to actually track consumption
- **Module 02**: Role-based access - Combine with plans (only admins see billing)
- **Module 06**: Audit logs - Track who accessed what features when

```javascript
app.post('/api/export', async (req, res) => {
  const allowed = await canUseFeature(req.user.id, 'export');
  if (!allowed) {
    return res.status(403).json({ 
      error: 'Feature not available in your plan',
      upgrade_to: 'pro'
    });
  }
  // Process export
});
```

### Usage Counting

```javascript
const incrementUsage = async (userId, metric) => {
  const usage = await getUsage(userId);
  const limits = await getPlanLimits(usage.plan);
  
  if (usage[metric] >= limits[`max_${metric}`]) {
    throw new Error('Quota exceeded');
  }
  
  await db.query(
    `UPDATE usage SET ${metric} = ${metric} + 1 
     WHERE user_id = $1`,
    [userId]
  );
};
```

## Common Mistakes

1. **Frontend-only enforcement** - Users disable checks in JS console
2. **No rate limiting** - Heavy users bankrupt service
3. **Unclear tier differences** - Users confused what they get
4. **No grace period** - Count hits 100%, feature instantly disabled
5. **Freemium too restrictive** - Users never upgrade, churn high

## Best Practices

✅ Server-side enforcement (never client-side)  
✅ Clear, simple 3-tier structure  
✅ Grace window: 10% overage before cutoff  
✅ Email at 80% and 95% usage  
✅ Upgrade upsell at limits  
✅ Trial period for Pro features  
✅ Annual billing 20% discount
