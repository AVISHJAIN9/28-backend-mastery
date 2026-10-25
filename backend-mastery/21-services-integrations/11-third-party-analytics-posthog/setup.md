# PostHog Analytics Setup Guide

## Prerequisites

- PostHog account (https://posthog.com)
- Node.js 18.x or higher
- Frontend application (React, Vue, etc.)

## Step 1: Install Dependencies

```bash
npm install
```

## Step 2: Create PostHog Account

1. Sign up at https://posthog.com
2. Choose data region (US or EU)
3. Create organization and project
4. Copy Project Key and API endpoint

## Step 3: Create .env File

```bash
cp .env.example .env
```

```env
POSTHOG_PROJECT_KEY=your-project-key
POSTHOG_API_ENDPOINT=https://us.posthog.com
POSTHOG_BATCH_SIZE=10
POSTHOG_BATCH_INTERVAL=30000
HTTP_PORT=6311
```

## Step 4: Initialize PostHog in Backend

```javascript
const PostHog = require('posthog');

const client = new PostHog(
  process.env.POSTHOG_PROJECT_KEY,
  { 
    endpoint: process.env.POSTHOG_API_ENDPOINT,
    flushInterval: 30000
  }
);
```

## Step 5: Setup Event Tracking

Define events and properties:
```
- page_view: { page, referrer, duration }
- user_signup: { email, source, plan }
- user_login: { successful, method }
- purchase: { amount, currency, items }
```

## Step 6: Configure Feature Flags

1. PostHog Dashboard > Feature Flags
2. Create flags:
   - `dark_mode_enabled`: 50% rollout
   - `new_checkout_flow`: 10% rollout
   - `beta_feature`: 5% rollout

## Step 7: Setup Cohorts

1. PostHog > Cohorts > New Cohort
2. Define cohorts:
   - Power Users: 10+ events last 7 days
   - Premium Members: plan = "premium"
   - Churned: no activity 30+ days

## Step 8: Run Development Server

```bash
node server.js
# Server runs on http://localhost:6311
```

## How to test

```bash
# Identify user
curl -X POST http://localhost:6311/api/analytics/identify \
  -H "Content-Type: application/json" \
  -d '{
    "userId":"user-123",
    "email":"user@example.com",
    "planType":"premium"
  }'

# Track event
curl -X POST http://localhost:6311/api/analytics/event \
  -H "Content-Type: application/json" \
  -d '{
    "userId":"user-123",
    "event":"page_view",
    "properties":{"page":"/dashboard"}
  }'

# Batch events
curl -X POST http://localhost:6311/api/analytics/batch \
  -H "Content-Type: application/json" \
  -d '{
    "batch":[
      {"userId":"u1","event":"page_view"},
      {"userId":"u2","event":"user_signup"}
    ]
  }'

# Check feature flag
curl http://localhost:6311/api/analytics/flags/user-123/dark_mode

# Get user cohort
curl http://localhost:6311/api/analytics/cohorts/user-123
```

## Verification Checklist

- [ ] PostHog account created
- [ ] Project Key copied to .env
- [ ] API endpoint configured
- [ ] Server starts without errors
- [ ] User identification working
- [ ] Events being tracked
- [ ] PostHog dashboard shows data
- [ ] Feature flags created
- [ ] Flag status checks working
- [ ] Cohorts defined
- [ ] Retention metrics visible
