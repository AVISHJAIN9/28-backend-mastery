# Usage Metering: API Calls Per Tenant

## What is this?

Usage metering is a billing system that tracks how much each tenant uses your platform (API calls, storage, data transfer, etc.) and enforces quotas based on their plan.

## Why does it matter?

- **Revenue**: You charge based on actual usage (pay-as-you-go)
- **Cost Control**: Prevents one tenant from consuming all resources
- **Fair Billing**: Each customer pays for what they use
- **Fraud Prevention**: Stops abusive usage patterns

## How it works

1. **Record Event**: Every API call records `{ metric, value, timestamp }`
2. **Update Summary**: Aggregate usage in real-time
3. **Check Quota**: Before allowing action, verify tenant hasn't exceeded limit
4. **Enforce**: Block/throttle if quota exceeded
5. **Reset**: Monthly/yearly reset based on plan

## Setup

```bash
cd 04-usage-metering-api-calls-per-tenant
npm install
npm start
```

Server runs on `http://localhost:4004`

## Testing

1. **Login**: `POST /api/auth/login` → get token
2. **Record usage**: `POST /api/tenants/tenant-1/meter` with `{metric, value}`
3. **Check usage**: `GET /api/tenants/tenant-1/usage`
4. **View quota**: `GET /api/tenants/tenant-1/quota`

## Key Concepts

- **Meter Event**: Single usage record (1 API call = 1 event)
- **Usage Summary**: Aggregated usage per month
- **Quota**: Limit per plan (free: 1000 calls, pro: 100k calls)
- **Soft Limit**: 80% warning
- **Hard Limit**: 100% blocks action

## Common Mistakes

❌ Only recording on success (failed calls also count)  
❌ Recording in client (server-side only!)  
❌ No burst protection (allow temporary overage)  
❌ Resetting manually instead of automatically  
❌ Not logging meter events for debugging

## API Endpoints

### Authentication
- `POST /api/auth/login` - Get JWT token

### Usage Recording
- `POST /api/tenants/:tenantId/meter` - Record usage event
  - Body: `{ metric: 'api_calls', value: 1 }`
  - Returns: `{ success: true, usage: {...}, quota: {...} }`

### Usage Queries
- `GET /api/tenants/:tenantId/usage` - Get all usage metrics
- `GET /api/tenants/:tenantId/usage/:metric` - Get specific metric
- `GET /api/tenants/:tenantId/quota` - Check quota status

### Admin Operations
- `GET /api/mock/usage` - View all usage data (mock)
- `POST /api/tenants/:tenantId/reset-usage` - Reset usage (admin only)

## Security Considerations

1. **Server-Side Recording**: Always record usage on the backend
2. **Authentication**: All meter endpoints require valid JWT
3. **Tenant Isolation**: Each tenant can only see their own usage
4. **Audit Trail**: Log all meter events for compliance
5. **Rate Limiting**: Protect meter endpoints from abuse

## Database Schema

```sql
CREATE TABLE usage_metrics (
  id SERIAL PRIMARY KEY,
  tenant_id UUID NOT NULL,
  metric VARCHAR(50),
  value INTEGER DEFAULT 1,
  recorded_at TIMESTAMP DEFAULT NOW()
);

CREATE TABLE usage_summary (
  id SERIAL PRIMARY KEY,
  tenant_id UUID NOT NULL,
  metric VARCHAR(50),
  month DATE,
  total_usage INTEGER,
  quota_limit INTEGER,
  UNIQUE(tenant_id, metric, month)
);
```

## Implementation Checklist

- [ ] Set up meter event schema
- [ ] Create meter recording endpoint
- [ ] Implement quota checking
- [ ] Add hard limit enforcement
- [ ] Add soft limit warnings
- [ ] Implement monthly reset
- [ ] Add billing export
- [ ] Test with different plans

## Next Steps

1. Review [theory.md](./theory.md) for detailed concepts
2. Check [schema.js](./schema.js) for data models
3. Explore [controller.js](./controller.js) for business logic
4. Run tests with [App.jsx](./App.jsx)

## References

- Stripe Metering (real-world example)
- AWS CloudWatch Metering
- Zuora Usage-Based Billing
