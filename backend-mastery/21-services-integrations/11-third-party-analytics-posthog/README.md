# Third-Party Analytics - PostHog

## What is this?

PostHog is an open-source product analytics platform providing:
- **Event Tracking**: Track user actions (page views, clicks, form submissions)
- **Funnels**: Visualize drop-off in user journeys
- **Cohorts**: Segment users by behavior or properties
- **Retention Analysis**: Measure how many users return daily/weekly
- **Feature Flags**: A/B test features with gradual rollout
- **Heatmaps**: See where users click on pages
- **Recordings**: Replay user sessions to identify UX issues

## Why does it matter?

Data-driven decisions improve conversion rates by 20-50%. PostHog enables product teams to understand user behavior without relying on Google Analytics (privacy-friendly). Feature flags enable safe releases of experimental features to 10% of users before full rollout.

## How it works (step by step)

1. **User Signup**: Backend creates user profile in PostHog via API
2. **Event Capture**: Frontend sends events (button click, form submit, page view)
3. **Event Enrichment**: Backend enriches events with context (user_id, subscription_tier)
4. **Funnel Analysis**: Dashboard shows drop-off at each step
5. **Feature Flag Check**: Client requests flag status via backend middleware
6. **Flag Decision**: Backend checks PostHog, returns "enabled" or "disabled"
7. **Conditional UI**: Frontend shows feature to 10% of users
8. **Conversion Tracking**: Measure if feature improves metrics

## Key concepts

- **Events**: Core unit of tracking (page_view, user_signup, purchase)
- **Properties**: Event context (page URL, product_id, price)
- **User Properties**: Persistent user attributes (plan_type, country, signup_date)
- **Funnels**: Track conversion through steps (signup → verify → purchase)
- **Cohorts**: Group users by criteria ("power users" = 10+ events in last 7 days)
- **Feature Flags**: Boolean flags with targeting rules ("enable_dark_mode for 20% of users")
- **Custom Properties**: Extension points for domain-specific properties

## Common mistakes

1. **Tracking PII** → Email/phone captured in events → Use user_id only
2. **No user identification** → Can't track users across sessions → Call identify() on login
3. **Too many events** → Overwhelming dashboards, costly → Track only meaningful actions
4. **No event naming convention** → "btn_click" vs "button_clicked" fragmented → Define schema upfront
5. **Feature flag not cleaned up** → Stale flags clutter code → Remove after rollout
6. **No cohort analysis** → Average metrics hide key user segments → Compare cohorts

## Real world usage

**SaaS Onboarding**: Track signup → email verify → payment → account created funnel → identify drop-off at email verify → send reminder email → conversion increases 15%
**Feature Launch**: Dark mode feature flagged to 10% of users → measure engagement → if positive, roll out to 100%
**Retention Analysis**: Measure daily active users (DAU) → compare cohort from month 1 vs month 2 → high churn detected → investigate
**A/B Testing**: Randomize users into "button version A" vs "button version B" → measure click-through rates → version B wins at 3.5% vs 2.1%

## API Endpoints

### User Management
- `POST /api/analytics/identify` - Identify user
- `POST /api/analytics/properties` - Set user properties

### Event Tracking
- `POST /api/analytics/event` - Track event
- `POST /api/analytics/batch` - Track multiple events

### Feature Flags
- `GET /api/analytics/flags/:userId` - Get all flags for user
- `GET /api/analytics/flags/:userId/:flagKey` - Check single flag status

### Analysis
- `GET /api/analytics/funnel` - Get funnel data
- `GET /api/analytics/cohorts` - Get user cohorts
- `GET /api/analytics/retention` - Get retention data

## Quick Start

```bash
npm install
node server.js
# Running on http://localhost:6311
```

## Testing

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
    "properties":{"page":"/dashboard","duration":30}
  }'

# Check feature flag
curl http://localhost:6311/api/analytics/flags/user-123/dark_mode_enabled
```
