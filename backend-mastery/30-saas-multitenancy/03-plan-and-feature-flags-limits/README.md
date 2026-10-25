# Module 03: Plans, Feature Flags & Usage Limits

## Overview

This module teaches **SaaS subscription tiers and feature access control**. You'll learn:

- **Pricing tiers**: Free, Pro, Enterprise with different feature sets
- **Feature flags**: Runtime toggles to enable/disable features
- **Usage limits**: Enforce quotha per plan (storage, API calls, team members)
- **Plan upgrades**: Seamless tier transitions with prorated billing
- **Real-world patterns**: How Slack, GitHub, Stripe implement this

### Key Concepts
```
Free Plan ($0)
├─ 1GB storage
├─ 1000 API calls/month
└─ Limited features

Pro Plan ($99)
├─ 100GB storage
├─ 100k API calls/month
└─ API, webhooks, advanced features

Enterprise Plan (Custom)
├─ Unlimited storage
├─ SSO, audit logs, dedicated support
```

---

## Architecture

### API Endpoints
```
POST   /api/auth/login              # Get token
GET    /api/plans                   # List pricing tiers
POST   /api/tenants/:id/upgrade     # Change plan
GET    /api/tenants/:id/plan        # Current plan
POST   /api/features/check          # Can user use feature?
GET    /api/usage                   # Show usage vs limits
```

### Database Schema
```javascript
const plans = {
  'free': { price: 0, features: ['view', 'basic_export'], limits: { storage_gb: 1, api_calls: 1000 } },
  'pro': { price: 99, features: ['view', 'edit', 'api', 'webhooks'], limits: { storage_gb: 100, api_calls: 100000 } },
  'enterprise': { price: null, features: ['all'], limits: { storage_gb: null } }
};

const tenants = {
  'tenant-1': { id: 'tenant-1', plan_id: 'free', subscription_status: 'active', created_at: '...' }
};
```

---

## Running the Module

### Installation
```bash
cd 03-plan-and-feature-flags-limits
npm install
```

### Environment Variables
```env
JWT_SECRET=your-secret
HTTP_PORT=4003
```

### Start Server
```bash
npm start
# http://localhost:4003
```

---

## Testing Scenarios

### Scenario 1: Free Tier Limits
```
1. User on free plan tries to use "webhooks" feature
2. Server checks: plan.features.includes('webhooks') → false
3. Response: { allowed: false, upgrade_link: '/billing/upgrade' }
✓ Test: Can free user access paid features? (should be blocked)
```

### Scenario 2: Usage Limits
```
1. User on free plan has 999 API calls used
2. Makes 1 more call → allowed (at limit)
3. Makes another call → blocked (over limit)
✓ Test: Hard quota enforcement
```

### Scenario 3: Plan Upgrade
```
1. User upgrades free → pro plan
2. Billing: prorate unused days on free, charge pro difference
3. Features unlock: webhooks now available
✓ Test: Are new features immediately available?
```

---

## Key Learning Points

### 1. Feature Gate Pattern
```javascript
const canUseFeature = (tenant_id, feature) => {
  const tenant = tenants[tenant_id];
  const plan = plans[tenant.plan_id];
  return plan.features.includes(feature);
};

// Usage
if (canUseFeature(req.tenant_id, 'webhooks')) {
  // Enable feature
} else {
  return res.status(402).json({ error: 'Feature not available' });
}
```

### 2. Soft vs Hard Limits
```javascript
// Hard: Block immediately if exceeded
const checkQuota = (usage, limit) => {
  if (usage >= limit) throw Error('Quota exceeded');
};

// Soft: Warn but allow
const checkQuota = (usage, limit) => {
  if (usage > limit * 0.9) {
    return { allowed: true, warning: 'Near limit' };
  }
  return { allowed: true };
};
```

### 3. Plan Upgrade with Proration
```javascript
const upgradePlan = (tenant_id, new_plan_id) => {
  const old_plan = tenants[tenant_id].plan_id;
  const daysUsed = Math.floor((now - tenant.billing_cycle) / 86400000);
  const refund = (plans[old_plan].price * (30 - daysUsed)) / 30;
  const charge = plans[new_plan_id].price - refund;
  
  tenants[tenant_id].plan_id = new_plan_id;
  return { success: true, charge };
};
```

---

## Files in This Module

| File | Purpose |
|------|---------|
| `schema.js` | Plans, features, limits, tenant billing cycle |
| `controller.js` | canUseFeature, checkUsageLimit, upgradePlan, getPlan |
| `server.js` | Express server on port 4003, feature check endpoints |
| `App.jsx` | React UI: plan selector, feature checker, usage bar |
| `theory.md` | Detailed concepts + real-world SaaS examples |
| `setup.md` | Installation guide |

---

## Security Checklist

- [ ] **Never trust client for feature check** - Always verify server-side
- [ ] **Enforce limits server-side** - Don't disable on client
- [ ] **Warn before hard limits** - User sees 80% usage warning
- [ ] **Prorate on changes** - Fair billing improves retention
- [ ] **Log plan changes** - Audit trail for disputes

---

## Next Steps

- **Module 04**: Usage metering - How to actually count API calls
- **Module 06**: Audit logs - Track plan changes

---

## Troubleshooting

**Q: Feature shows but user can't use?**
- A: Check server is verifying feature gate. Client can be spoofed.

**Q: Usage limit not working?**
- A: Verify checkUsageLimit is called BEFORE processing request.
