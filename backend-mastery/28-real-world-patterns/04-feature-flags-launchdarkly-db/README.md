# Module 04: Feature Flags (LaunchDarkly-Style) & Database-Backed Toggles

## Overview

Feature flags (also called feature toggles) enable dynamic control over application behavior without code deployment. This module demonstrates:

- **Hardcoded vs Database-Backed Flags**: Control flags without redeployment
- **Rollout Percentages**: Canary deployments (1% → 10% → 100% rollout)
- **Targeting Rules**: Conditional feature availability (enterprise users, specific countries)
- **Variant Selection**: A/B testing with consistent user assignment
- **LaunchDarkly Integration Pattern**: Production-grade flag management

## Vulnerable Pattern: Hardcoded Feature Flags

```javascript
// ❌ VULNERABLE: Changes require code redeploy + restart
const checkFlagVulnerable = (req, res) => {
  const hardcodedFlags = {
    'new_checkout': true,                    // Always on!
    'payment_retry': false,                  // Always off!
    'discount_engine': Math.random() > 0.5   // RANDOM! (inconsistent)
  };
  
  res.json({ enabled: hardcodedFlags[flag_name] || false });
};
```

**Security Issues:**
- No runtime control → deploy to change feature
- Random evaluation → same user gets different states
- No audit trail → who enabled what and when?
- No gradual rollout → risky big-bang deployments

## Secure Pattern: Database-Backed Feature Flags

```javascript
// ✅ SECURE: Flags in database, real-time changes
const checkFlagSecure = (req, res) => {
  const flag = flags[flag_name];  // Fetch from DB
  
  if (!flag.enabled) return res.json({ enabled: false });
  
  // Deterministic rollout: same user always gets same result
  const inRollout = shouldRollout(user_id, flag_name, 50);  // 50% rollout
  
  // Targeting rules: disable for specific users
  const targeting = evaluateTargetingRules(flag.targeting_rules || [], context);
  
  // Variant selection: A/B test with consistent assignment
  let variant = null;
  if (flag.variants && flag.variants.length > 0) {
    variant = selectVariant(user_id, flag_name, flag.variants);
  }
  
  return res.json({ enabled: inRollout && !targeting.disable, variant });
};
```

**Key Features:**
- Real-time flag management (no deploy needed)
- Deterministic hashing (same user = same state)
- Progressive rollout (10% → 50% → 100%)
- Targeting rules (country, tier, beta_user)
- Variant selection for A/B testing

## Real-World Examples

### 1. Airbnb: Checkout Widget Redesign

**Scenario:** Airbnb spent 6 months redesigning checkout. High risk if everyone gets it at once.

**Solution:**
```javascript
flags.checkout_v2 = {
  name: 'checkout_v2',
  enabled: true,
  rollout_percentage: 5,  // Start with 5%
  targeting_rules: [
    { attribute: 'country', operator: 'equals', value: 'US', on_match: 'enable' },
    { attribute: 'tier', operator: 'equals', value: 'pro', on_match: 'enable' }
  ]
};
```

**Timeline:**
- Day 1: 5% rollout → US + Pro users only → catch 20% bugs early
- Day 2: 25% rollout → US users only
- Day 5: 100% rollout US → No major issues
- Day 10: Global rollout

**Result:** Caught $50k in revenue loss bugs before full deployment!

### 2. Netflix: Adaptive Streaming Quality

**Scenario:** Netflix A/B tested new video codec (saves 20% bandwidth).

**Solution:**
```javascript
flags.vp9_codec = {
  variants: [
    { name: 'h264_original', weight: 50 },            // Control group
    { name: 'vp9_new', weight: 50 }                   // Test group
  ],
  rollout_percentage: 10  // Only 10% of users tested
};
```

**Results from A/B test:**
- VP9 group: 8% completion rate (better quality = more watched)
- H264 group: 7.2% completion rate
- **Decision:** Roll out VP9 to all (statistically significant)

### 3. Slack: Dark Mode Feature

**Scenario:** Slack released dark mode as beta.

**Solution:**
```javascript
flags.dark_mode_beta = {
  enabled: true,
  rollout_percentage: 0,  // Off by default
  targeting_rules: [
    { attribute: 'beta_user', operator: 'equals', value: true, on_match: 'enable' }
  ]
};

// Admin dashboard: Click ONE button → enable for 50% of beta users
```

**Result:** Minimal support load, exponential word-of-mouth!

## API Endpoints

### Check Feature Flag
```bash
POST /api/secure/flag-check
Content-Type: application/json

{
  "flag_name": "new_checkout",
  "user_id": "user123",
  "context": {
    "country": "US",
    "tier": "pro",
    "beta_user": true
  }
}

# Response (Enabled)
{
  "flag_name": "new_checkout",
  "enabled": true,
  "variant": { "name": "v2_checkout", "weight": 50 },
  "method": "database"
}

# Response (Disabled by Rollout)
{
  "flag_name": "new_checkout",
  "enabled": false,
  "reason": "Below 50% rollout threshold"
}
```

### Create Feature Flag
```bash
POST /api/secure/flags
Content-Type: application/json

{
  "name": "payment_retry",
  "description": "Retry failed payments",
  "enabled": true,
  "rollout_percentage": 25,
  "targeting_rules": [
    {
      "attribute": "country",
      "operator": "equals",
      "value": "US",
      "on_match": "enable"
    }
  ],
  "variants": [
    { "name": "retry_v1", "weight": 50 },
    { "name": "retry_v2", "weight": 50 }
  ]
}
```

### Update Flag Rollout
```bash
PUT /api/secure/flags/payment_retry
Content-Type: application/json

{
  "rollout_percentage": 50  # Increase from 25% to 50%
}
```

### Get All Flags
```bash
GET /api/secure/flags?limit=10&offset=0
```

## Technical Implementation

### 1. Deterministic Hashing (Same User = Same Outcome)

```javascript
const shouldRollout = (userId, flagName, percentage) => {
  if (percentage === 100) return true;
  
  // Hash user + flag → consistent, distributed result
  const hash = createHash('md5')
    .update(`${userId}:${flagName}`)
    .digest('hex');
  
  const hashValue = parseInt(hash.substring(0, 8), 16) % 100;
  return hashValue < percentage;
};

// Example:
shouldRollout('user123', 'checkout_v2', 50);  // Always true/false
shouldRollout('user123', 'checkout_v2', 50);  // Same result!
shouldRollout('user456', 'checkout_v2', 50);  // Different: distributed
```

### 2. Targeting Rules Engine

```javascript
const evaluateTargetingRules = (rules, context = {}) => {
  for (const rule of rules) {
    const contextValue = context[rule.attribute];
    
    let matches = false;
    switch (rule.operator) {
      case 'equals': matches = contextValue === rule.value; break;
      case 'contains': matches = String(contextValue).includes(rule.value); break;
      case 'greater_than': matches = contextValue > rule.value; break;
    }
    
    if (matches) {
      return { matched: true, action: rule.on_match };
    }
  }
  return { matched: false };
};

// Example: Disable for free tier users
evaluateTargetingRules(
  [{ attribute: 'tier', operator: 'equals', value: 'free', on_match: 'disable' }],
  { tier: 'free' }
);  // → matched: true, action: 'disable'
```

### 3. Consistent Variant Selection (A/B Testing)

```javascript
const selectVariant = (userId, flagName, variants) => {
  const hash = createHash('md5')
    .update(`${userId}:${flagName}:variant`)
    .digest('hex');
  
  const hashValue = parseInt(hash.substring(0, 8), 16) % 100;
  let accumulated = 0;
  
  for (const variant of variants) {
    accumulated += variant.weight || 50;
    if (hashValue < accumulated) return variant;
  }
  
  return variants[0];
};

// 50/50 A/B test: user always gets same variant
selectVariant('user123', 'checkout', [
  { name: 'v1', weight: 50 },
  { name: 'v2', weight: 50 }
]);
// Consistent: always 'v1' or always 'v2'
```

## Best Practices

### ✅ DO:

1. **Use Targeting Rules for Safety**
   ```javascript
   // Only enable for internal users first
   targeting_rules: [
     { attribute: 'email', operator: 'contains', value: '@company.com', on_match: 'enable' }
   ]
   ```

2. **Progressive Rollout (1% → 10% → 100%)**
   - Day 1: 1% of users
   - Day 2: 10% (no issues? continue)
   - Day 5: 50% (performance ok?)
   - Day 10: 100%

3. **Always Log Feature Flag Events**
   ```javascript
   logger.info('Flag evaluated', { flag_name, enabled, user_id, variant });
   ```

4. **Kill Switches for Critical Features**
   ```javascript
   if (flags.payment_processing?.enabled === false) {
     return res.status(503).json({ error: 'Payment system offline' });
   }
   ```

5. **Clean Up Old Flags**
   ```javascript
   // After rollout_percentage === 100 for 2+ weeks, remove flag
   // Hard-code the feature as permanent
   ```

### ❌ DON'T:

1. **Random Rollout** (breaks consistency)
   ```javascript
   enabled: Math.random() < 0.5  // ❌ Same user gets different states
   ```

2. **Hardcoded Flags** (requires deploy)
   ```javascript
   const ENABLE_FEATURE = process.env.ENABLE_FEATURE === 'true';  // ❌
   ```

3. **Ignoring Targeting Rules**
   ```javascript
   // ❌ Rolling out broken feature to all users
   rollout_percentage: 100  // without targeting_rules
   ```

4. **No Audit Trail**
   ```javascript
   // ❌ Difficult to debug: who changed the flag when?
   ```

5. **Forgetting About Users In Rollout**
   ```javascript
   // ❌ User A: enabled for 10 days
   // ❌ User B: disabled for same feature
   // → Confusing UX
   ```

## Setup & Testing

### Installation

```bash
npm install
```

### Environment Variables (.env)

```bash
HTTP_PORT=4004
NODE_ENV=development
```

### Running the Server

```bash
node server.js
```

### Testing Vulnerable Endpoint

```bash
curl -X POST http://localhost:4004/api/vulnerable/flag-check \
  -H "Content-Type: application/json" \
  -d '{ "flag_name": "new_checkout" }'

# Issues:
# - Hardcoded flags (see output)
# - No rollout control
# - Random values each call
```

### Testing Secure Endpoint

```bash
# Step 1: Create a flag
curl -X POST http://localhost:4004/api/secure/flags \
  -H "Content-Type: application/json" \
  -d '{
    "name": "checkout_v2",
    "description": "New checkout experience",
    "enabled": true,
    "rollout_percentage": 50,
    "targeting_rules": []
  }'

# Step 2: Check flag for user (rollout determines if enabled)
curl -X POST http://localhost:4004/api/secure/flag-check \
  -H "Content-Type: application/json" \
  -d '{
    "flag_name": "checkout_v2",
    "user_id": "user123"
  }'

# Step 3: Increase rollout to 100%
curl -X PUT http://localhost:4004/api/secure/flags/checkout_v2 \
  -H "Content-Type: application/json" \
  -d '{ "rollout_percentage": 100 }'

# Step 4: Check again (now enabled for all)
curl -X POST http://localhost:4004/api/secure/flag-check \
  -H "Content-Type: application/json" \
  -d '{
    "flag_name": "checkout_v2",
    "user_id": "user456"
  }'
```

### React UI Testing

1. Start React dev server: `npm start` (port 3000)
2. Navigate to http://localhost:3000
3. **Evaluate Flag Tab**: Switch between vulnerable/secure, test rollout logic
4. **Create Flag Tab**: Create flags with custom rollout, targeting
5. **Manage Flags Tab**: Edit rollout percentages, test progressive deployment
6. **Audit Log Tab**: View all flag evaluation events

## Common Issues & Solutions

| Issue | Cause | Fix |
|-------|-------|-----|
| Same user gets different flag state | Random evaluation | Use deterministic hash (md5) |
| Flag doesn't update after PUT | Hasn't propagated | Refresh page / wait 2s |
| EADDRINUSE on port 4004 | Port in use | `lsof -i :4004` then `kill -9 PID` |
| Targeting rules not working | Missing context | Send `context` in POST body |
| Variant always same | Expected! | A/B test requires user consistency |

## Production Checklist

- [ ] Feature flags in database (not code)
- [ ] Targeting rules for gradual rollout
- [ ] Audit logging for all flag changes
- [ ] Dashboard to manage flags (no code deploy)
- [ ] Variant selection for A/B testing
- [ ] Kill switches for critical features
- [ ] Monitoring: flag latency < 100ms
- [ ] Old flags cleaned up (100% rollout for 2+ weeks)
- [ ] Team trained on progressive rollout

## References

- **LaunchDarkly**: https://launchdarkly.com/
- **Feature Flags Best Practices**: https://martinfowler.com/articles/feature-toggles.html
- **Canary Deployments**: https://en.wikipedia.org/wiki/Canary_deployment
- **A/B Testing**: https://www.optimizely.com/optimization-glossary/testing/

## What is this?

## Why does it matter?

## How it works

## Key concepts

## Common mistakes
