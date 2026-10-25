# Usage Metering: API Calls Per Tenant

## Why Metering Matters

You must measure resource consumption per tenant to:

1. **Bill accurately** - "Pay for what you use" models require precise measurement
2. **Prevent abuse** - Detect runaway usage (broken client loops, scraping bots)
3. **Capacity planning** - Know which tenants stress your infrastructure
4. **Enforce quotas** - Hard limits prevent one tenant from destroying service for others

---

## Metering Architecture

```
┌─────────────┐
│ Application │
│  Request    │
└──────┬──────┘
       │
       ├─→ Check Quota ──→ DENY if exceeded
       │
       ├─→ Process Request
       │
       └─→ Record Meter Event ──→ Metrics DB
                                      │
                                      ├─→ Update daily/monthly totals
                                      │
                                      └─→ Billing system
```

### Event-Driven Pattern

```javascript
// Every resource-consuming operation logs a meter event
const meterEvents = {
  'api_calls': { unit: 'call', cost: 0.001 },
  'compute_minutes': { unit: 'minute', cost: 0.05 },
  'storage_gb': { unit: 'GB', cost: 0.10 },
  'email_sent': { unit: 'email', cost: 0.01 },
  'bandwidth_gb': { unit: 'GB', cost: 0.12 }
};

// Meter event object
{
  id: 'meter-12345',
  tenant_id: 'tenant-1',
  metric: 'api_calls',
  amount: 1,
  timestamp: '2025-01-15T10:30:00Z',
  billing_period: '2025-01', // Month for rollup
  request_id: 'req-xyz' // Idempotency key
}
```

---

## Real-Time Metering Pattern

Every API request should immediately log usage:

```javascript
// Middleware to auto-meter requests
const meterRequest = (req, res, next) => {
  res.on('finish', () => {
    if (req.tenant_id && res.statusCode < 400) {
      // Only meter successful requests
      recordMeterEvent({
        tenant_id: req.tenant_id,
        metric: 'api_calls',
        amount: 1,
        timestamp: new Date(),
        request_id: req.id // Important for idempotency
      });
    }
  });
  next();
};

app.use(meterRequest);
```

### Quota Check Before Processing

```javascript
app.get('/api/data', verifyToken, async (req, res) => {
  // 1. Check monthly quota before doing work
  const quota = await getQuotaForTenant(req.tenant_id);
  const usage = await getMonthlyUsage(req.tenant_id);
  
  if (usage.api_calls >= quota.api_calls) {
    logger.warn('Quota exceeded', { tenant_id: req.tenant_id, usage, quota });
    return res.status(429).json({ 
      error: 'API quota exceeded',
      usage: usage.api_calls,
      limit: quota.api_calls,
      reset_date: getNextBillingDate(req.tenant_id)
    });
  }
  
  // 2. Process request (now we know quota is OK)
  const data = await fetchData(req.query);
  
  // 3. Meter is recorded automatically by middleware
  res.json(data);
});
```

---

## Handling Duplicate Events (Idempotency)

Network failures can cause the same request to be retried. Avoid double-charging:

```javascript
const recordMeterEvent = async (event) => {
  // Check if we already recorded this request_id
  const existing = await db.meterEvents.findOne({ 
    request_id: event.request_id 
  });
  
  if (existing) {
    console.log('Duplicate meter event ignored', event.request_id);
    return; // Already recorded, don't duplicate
  }
  
  // Record new event
  db.meterEvents.insert({
    ...event,
    created_at: new Date()
  });
  
  // Update usage summary
  updateUsageSummary(event.tenant_id, event.metric, event.amount);
};
```

---

## Metering Different Dimensions

### Time-Based
```javascript
// Billing per computational time used
const recordComputeTime = (tenant_id, seconds) => {
  recordMeterEvent({
    tenant_id,
    metric: 'compute_minutes',
    amount: Math.ceil(seconds / 60),
    timestamp: new Date()
  });
};
```

### Volume-Based
```javascript
// Billing per data processed
const processExport = async (tenant_id, recordCount) => {
  // Do work...
  
  recordMeterEvent({
    tenant_id,
    metric: 'records_processed',
    amount: recordCount,
    timestamp: new Date()
  });
};
```

### Seat-Based (Fixed Per Tank-Meter)
```javascript
// Fixed price per active user per month
const activeSeats = {
  'tenant-1': ['user-1', 'user-2', 'user-3'], // 3 seats = 3 × $10
  'tenant-2': ['user-4'] // 1 seat = 1 × $10
};

// Charged in billing cycle, not metered hourly
```

### Hybrid (Multiple Dimensions)
```javascript
// Tiered pricing: base fee + overage
const calculateBill = (tenant_id) => {
  const plan = getTenantPlan(tenant_id);
  const usage = getMonthlyUsage(tenant_id);
  
  let bill = plan.base_price; // e.g., $99
  
  // Add overages
  if (usage.api_calls > plan.included_calls) {
    const overageRate = 0.001; // $0.001 per call
    bill += (usage.api_calls - plan.included_calls) * overageRate;
  }
  
  if (usage.storage_gb > plan.included_storage) {
    const overageRate = 0.10; // $0.10 per GB
    bill += (usage.storage_gb - plan.included_storage) * overageRate;
  }
  
  return bill;
};
```

---

## Billing Examples

### Example 1: API-Based SaaS (Stripe)
```javascript
const tenantA_usage = {
  api_calls: 50000,
  storage_gb: 5
};

const stripe_line_items = [
  {
    price_data: {
      currency: 'usd',
      product_data: { name: 'API Calls' },
      unit_amount: 0.001 * 50000 // $50
    }
  },
  {
    price_data: {
      currency: 'usd',
      product_data: { name: 'Storage' },
      unit_amount: 0.10 * 5 // $0.50
    }
  }
];
// Total: $50.50
```

### Example 2: Seat-Based (Per User Per Month)
```javascript
const tenantB = {
  plan: 'pro',
  base_price: 99,
  price_per_seat: 10,
  active_seats: 25
};

// Monthly bill = $99 + (25 × $10) = $349
```

---

## Quota Reset & Billing Cycles

### Monthly Reset
```javascript
const getMonthlyUsage = (tenant_id) => {
  const now = new Date();
  const monthStart = new Date(now.getFullYear(), now.getMonth(), 1);
  
  return db.meterEvents
    .find({ 
      tenant_id,
      timestamp: { $gte: monthStart }
    })
    .reduce((acc, event) => {
      acc[event.metric] = (acc[event.metric] || 0) + event.amount;
      return acc;
    }, {});
};

// Cleanup old events (keep 90 days for auditing)
const cleanupOldMeterEvents = () => {
  const ninetyDaysAgo = new Date(Date.now() - 90 * 86400000);
  db.meterEvents.deleteMany({ 
    created_at: { $lt: ninetyDaysAgo }
  });
};
```

### Custom Billing Dates
```javascript
const getTenantBillingCycle = (tenant_id) => {
  const tenant = tenants[tenant_id];
  
  // Tenant pays on the 15th of each month
  return {
    start: new Date(Date.now().getFullYear(), Date.now().getMonth(), 15),
    end: new Date(Date.now().getFullYear(), Date.now().getMonth() + 1, 15)
  };
};
```

---

## Overages & Quota Warnings

### Soft Limit: Warn at 80%
```javascript
const getQuotaStatus = (tenant_id) => {
  const quota = getQuotaForTenant(tenant_id);
  const usage = getMonthlyUsage(tenant_id);
  const percent = (usage.api_calls / quota.api_calls) * 100;
  
  if (percent > 90) return 'CRITICAL'; // 90%+
  if (percent > 80) return 'WARNING'; // 80-90%
  return 'OK';
};

// Return status in API responses
app.get('/api/data', (req, res) => {
  const data = fetchData();
  const status = getQuotaStatus(req.tenant_id);
  
  res.json({
    data,
    quota_status: status,
    ...(status !== 'OK' && { 
      upgrade_link: '/billing/upgrade'
    })
  });
});
```

### Hard Limit: Block Everything
```javascript
const checkQuotaExceeded = (tenant_id) => {
  const quota = getQuotaForTenant(tenant_id);
  const usage = getMonthlyUsage(tenant_id);
  
  return usage.api_calls >= quota.api_calls;
};

// Prevent all requests
app.use((req, res, next) => {
  if (checkQuotaExceeded(req.tenant_id)) {
    return res.status(429).json({ 
      error: 'Monthly quota exceeded',
      message: 'Upgrade your plan or wait until next billing cycle'
    });
  }
  next();
});
```

---

## Real-World Attack: Quota Bypass

### Vulnerability
```javascript
// VULNERABLE: Meter only if request succeeds
if (response.success) {
  recordMeterEvent(...); // Client can trigger failures to avoid metering
}
```

### Defense
```javascript
// SECURE: Meter all attempts (success/failure)
app.post('/api/export', async (req, res) => {
  try {
    // Meter BEFORE processing
    recordMeterEvent({
      tenant_id: req.tenant_id,
      metric: 'export_requests',
      amount: 1
    });
    
    const result = await performExport(req.body);
    res.json(result);
  } catch (error) {
    // Export still counts even if it failed
    res.status(500).json({ error: error.message });
  }
});
```

---

## Monitoring & Alerts

```javascript
const tenantUsageAlert = (tenant_id) => {
  const usage = getMonthlyUsage(tenant_id);
  const quota = getQuotaForTenant(tenant_id);
  
  // Alert if over quota
  if (usage.api_calls > quota.api_calls) {
    sendAlert({
      type: 'QUOTA_EXCEEDED',
      tenant_id,
      usage: usage.api_calls,
      limit: quota.api_calls,
      overage_percent: Math.round(((usage.api_calls - quota.api_calls) / quota.api_calls) * 100)
    });
  }
  
  // Alert on unusual spike
  const avgDaily = usage.api_calls / new Date().getDate();
  if (avgDaily > quota.api_calls / 30 * 1.5) { // 50% above normal
    sendAlert({
      type: 'USAGE_SPIKE',
      tenant_id,
      daily_average: avgDaily
    });
  }
};
```

---

## Best Practices

✅ **Meter everything before processing** - No retroactive calculations  
✅ **Use request IDs for idempotency** - Prevent double-charging  
✅ **Warn before hard limits** - Better UX, fewer support tickets  
✅ **Keep audit trail** - Meter events are legal billing evidence  
✅ **Monitor for abuse patterns** - One tenant's runaway query shouldn't kill service  
✅ **Prorate when plans end** - Fair to customers  

---

## Related Patterns

- **Module 03**: Plans and limits - Define quotas per plan
- **Module 06**: Audit logs - What did each tenant do?
- **Module 07**: Data export - How to let customers request their metered data
  
  if (usage.api_calls >= limit) {
    return res.status(429).json({
      error: 'Monthly API quota exceeded',
      usage: usage.api_calls,
      limit: limit
    });
  }
  
  // 3. Process request
  const data = await getData();
  res.json(data);
});
```

## Billing Scenarios

### Pay-Per-Use
- $0.0001 per API call
- $10M calls = $1,000/month

### Tiered Pricing  
- First 1M calls: free
- 1M-10M calls: $100 per M
- Over 10M: $50 per M (volume discount)

### Hybrid: Seats + Usage
- $50/month per seat
- Plus $0.001 per API call over 100K
- 5 seats + 5M calls = $250 + $4,900 = $5,150

## Quota Soft Limits vs Hard Stops

```javascript
const checkQuota = (usage, limit) => {
  if (usage >= limit * 1.1) {
    // Hard stop - way over (10% grace)
    return { allowed: false, reason: 'hard_limit' };
  }
  
  if (usage >= limit * 0.95) {
    // Warning - getting close
    logWarning(`${tenant_id} at 95% quota`);
  }
  
  return { allowed: true };
};
```

## Database Cost Optimization

```javascript
// Option 1: In-memory cache (near real-time)
const cache = new Map(); // tenant_id → usage
setInterval(async () => {
  const latest = await db.query('SELECT tenant_id, COUNT(*) as calls FROM usage_events WHERE recorded_at > NOW() - INTERVAL 1 MONTH');
  latest.forEach(row => cache.set(row.tenant_id, row.calls));
}, 60000); // Update every minute

// Option 2: Time-series database
// InfluxDB, Prometheus - purpose-built for metrics
```

## Resetting Quotas

```javascript
// Monthly reset
const resetMonthlyQuotas = async () => {
  const tenants = await getAllTenants();
  
  for (const tenant of tenants) {
    // Check if new month
    const billingCycle = tenant.billing_period;
    const now = new Date();
    
    if (!sameMonth(billingCycle, now)) {
      // New month - reset counters
      await db.query(
        'UPDATE tenants SET billing_period = $1, usage_this_month = 0 WHERE id = $2',
        [now, tenant.id]
      );
    }
  }
};
```

## Avoiding Common Mistakes

❌ Not checking quota before processing  
❌ Counter only incremented on success (failed requests don't count)  
❌ No alerts before hitting quota  
❌ Quota not scoped to billing period  
❌ Different quota for different user roles (consistency issues)
