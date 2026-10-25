# Analytics & Feature Flags: Theory & Concepts

## 1. Event Management

### Event Schema
Define events and required properties:
```
Event: page_view
Properties:
  - page (string): URL path
  - referrer (string): Previous page
  - duration (number): Time spent on page
  - device (string): Desktop, mobile, tablet

Event: purchase
Properties:
  - amount (number): Purchase total
  - currency (string): USD, EUR, GBP
  - items (array): [{product_id, quantity, price}]
  - coupon (string): Discount code used
```

### Naming Convention
Consistent naming prevents fragmentation:
```
GOOD:
  - user_signup
  - user_login
  - page_view
  - product_view
  - add_to_cart
  - purchase

BAD:
  - signup
  - login
  - view_page
  - ProductPage
  - cart_add
  - pay

Mixed names = hard to analyze (same event multiple names)
```

## 2. Cohort Analysis

### Cohort Definition
Group users with common characteristic:
```
Cohort: "Power Users"
Criteria: >= 10 events in last 7 days
Size: 15,000 of 500,000 users (3%)

Cohort: "Trial Expiring Soon"
Criteria: trial_end_date - today <= 7 days
Size: 1,200 users

Cohort: "Churned"
Criteria: last activity > 60 days ago
Size: 80,000 users
```

### Cohort Retention
Track if users stay or leave:
```
Cohort: Users who signed up Jan 2024

Week 1: 10,000 users (100%)
Week 2: 6,500 users (65% retention)
Week 3: 4,200 users (42% retention)
Week 4: 2,800 users (28% retention)
Week 5: 1,900 users (19% retention)

Drop: 81% churn in first month
Investigate: Why users leaving? Poor onboarding?
```

## 3. Funnel Analysis

### Conversion Funnel
Track user progression through steps:
```
Step 1: Visit landing page
  10,000 users
  ↓
Step 2: Sign up
  3,000 users (30% conversion)
  ↓
Step 3: Verify email
  2,000 users (67% of signups)
  ↓
Step 4: Add payment
  1,200 users (60% of verified)
  ↓
Step 5: Make purchase
  400 users (33% of payment)
  
 Drop-off analysis:
  - Landing to signup: 70% drop (Unclear value prop? Confusing form?)
  - Email verify to payment: 40% drop (Email slow? Not received?)
```

## 4. Feature Flags

### Flag Types

**Release Flags**: Roll out feature gradully
```
Dark Mode Launch:
  - Week 1: 10% rollout (test for bugs)
  - Week 2: 50% rollout (monitor performance)
  - Week 3: 100% rollout (available to all)
```

**Experiment Flags**: A/B test
```
Checkout Button Color:
  - Control: 50% see blue button
  - Variation: 50% see green button
  - Measure: Which converts better?
  - Result: Green 3.5% vs Blue 2.8% → Green wins
```

**Kill Switches**: Disable feature if buggy
```
Payment Processing broken
  ↓
Set flag broken_payment = false
  ↓
Frontend hides payment form
  ↓
Users can't submit broken form
  ↓
Developers fix, set flag back to true
```

### Flag Evaluation
```javascript
const userFlags = client.getFlagsForUser(userId);
if (userFlags['dark_mode_enabled'] === true) {
  // Show dark theme
} else {
  // Show light theme
}
```

## 5. User Segmentation

### Targeting Rules
Flag applies to specific users:
```
Flag: early_access_feature
Targeting:
  - If user.plan_type == 'premium': true
  - If user.country == 'US': true
  - If user.id in [123, 456, 789]: true
  - All others: false

Might enable for:
  - Premium users (willing to beta test)
  - US users (easier support)
  - Specific beta testers (opt-in)
```

## 6. Privacy Considerations

### PII in Analytics
**Vulnerable**: Capturing user email, phone
```javascript
// BAD - Captures PII
events.track({
  userId: 'alice@example.com', // Email exposed
  action: 'login',
  phone: '+1-555-1234' // Phone exposed
});
```

**Secure**: Use anonymous user IDs
```javascript
// GOOD - No PII
events.track({
  userId: 'user_abc123def', // Hashed/anonymous
  action: 'login'
  // phone omitted
});
```

### Data Retention
```
Days 1-30: Full detail (raw events)
Days 31-90: Aggregated only (no individual events)
Days 91+: Deleted (GDPR right to be forgotten)
```

## 7. Security Checklist

- [ ] Event schema documented
- [ ] No PII in event properties (user_id only)
- [ ] Event naming convention enforced
- [ ] Cohort definitions clear and documented
- [ ] Funnels have < 10 steps (complex = unactionable)
- [ ] Flag evaluation cached (don't call API per request)
- [ ] Flag changes logged with timestamp
- [ ] Experiment duration set (don't run indefinitely)
- [ ] Statistical significance required before declaring winner
- [ ] Feature flag cleanup after rollout (remove dead code)
- [ ] Analytics service behind authentication
- [ ] Data export capability for user privacy
- [ ] GDPR compliance: Delete user data on request
