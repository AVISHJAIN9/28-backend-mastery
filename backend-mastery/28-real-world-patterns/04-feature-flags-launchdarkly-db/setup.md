# Setup Guide: Feature Flags Module

## Quick Start

### 1. Install Dependencies

```bash
npm install express cors body-parser joi winston dotenv
```

### 2. Environment Variables

Create or update `.env`:
```bash
HTTP_PORT=4004
NODE_ENV=development
```

### 3. Run the Server

```bash
node server.js
```

Expected output:
```
Feature Flags Server running on http://localhost:4004
```

### 4. Test with cURL

```bash
# Check health
curl http://localhost:4004/health

# Create a flag
curl -X POST http://localhost:4004/api/secure/flags \
  -H "Content-Type: application/json" \
  -d '{
    "name": "checkout_v2",
    "description": "New checkout experience",
    "enabled": true,
    "rollout_percentage": 50,
    "targeting_rules": []
  }'

# Evaluate flag
curl -X POST http://localhost:4004/api/secure/flag-check \
  -H "Content-Type: application/json" \
  -d '{
    "flag_name": "checkout_v2",
    "user_id": "user123"
  }'
```

---

## Test Scenarios

### Scenario 1: Basic Flag Evaluation

**Test:** Check if a flag is enabled for a user

```bash
# Step 1: Create flag with 50% rollout
curl -X POST http://localhost:4004/api/secure/flags \
  -H "Content-Type: application/json" \
  -d '{
    "name": "payment_retry",
    "description": "Retry failed payments",
    "enabled": true,
    "rollout_percentage": 50
  }'

# Step 2: Check for user123 (should be enabled/disabled based on hash)
curl -X POST http://localhost:4004/api/secure/flag-check \
  -H "Content-Type: application/json" \
  -d '{
    "flag_name": "payment_retry",
    "user_id": "user123"
  }'

# Step 3: Check again same user (must return SAME result)
curl -X POST http://localhost:4004/api/secure/flag-check \
  -H "Content-Type: application/json" \
  -d '{
    "flag_name": "payment_retry",
    "user_id": "user123"
  }'

# Expected: Both calls return identical result (enabled or disabled)
```

**What we're testing:**
- Deterministic hashing: Same user gets same result
- Rollout accuracy: ~50% of users should be enabled
- Consistency: Repeated calls return same value

---

### Scenario 2: Canary Deployment (Progressive Rollout)

**Test:** Gradually roll out a feature from 1% → 100%

```bash
# Step 1: Create flag with 1% rollout
curl -X POST http://localhost:4004/api/secure/flags \
  -H "Content-Type: application/json" \
  -d '{
    "name": "dark_mode",
    "description": "Dark theme UI",
    "enabled": true,
    "rollout_percentage": 1
  }'

# Step 2: Check 100 different users
for i in {1..100}; do
  curl -s -X POST http://localhost:4004/api/secure/flag-check \
    -H "Content-Type: application/json" \
    -d "{\"flag_name\": \"dark_mode\", \"user_id\": \"user$i\"}" | grep -o '"enabled":[^,}]*'
done

# Expected: ~1 user sees enabled, ~99 users see disabled

# Step 3: Increase to 10% rollout
curl -X PUT http://localhost:4004/api/secure/flags/dark_mode \
  -H "Content-Type: application/json" \
  -d '{ "rollout_percentage": 10 }'

# Step 4: Check again (now ~10 users enabled, ~90 disabled)
for i in {1..100}; do
  curl -s -X POST http://localhost:4004/api/secure/flag-check \
    -H "Content-Type: application/json" \
    -d "{\"flag_name\": \"dark_mode\", \"user_id\": \"user$i\"}" | grep -o '"enabled":[^,}]*'
done

# Step 5: Gradual increase: 10% → 50% → 100%
curl -X PUT http://localhost:4004/api/secure/flags/dark_mode \
  -H "Content-Type: application/json" \
  -d '{ "rollout_percentage": 50 }'

curl -X PUT http://localhost:4004/api/secure/flags/dark_mode \
  -H "Content-Type: application/json" \
  -d '{ "rollout_percentage": 100 }'
```

**What we're testing:**
- Rollout consistency: Same hashing algorithm
- Progressive deployment: Safe increase from 1to 100%
- No user overlap: Each increase includes previous users

---

### Scenario 3: Targeting Rules (Beta Users Only)

**Test:** Feature available only for specific user segments

```bash
# Step 1: Create flag with targeting rule
curl -X POST http://localhost:4004/api/secure/flags \
  -H "Content-Type: application/json" \
  -d '{
    "name": "beta_features",
    "description": "Advanced features for beta users",
    "enabled": true,
    "rollout_percentage": 100,
    "targeting_rules": [
      {
        "attribute": "tier",
        "operator": "equals",
        "value": "free",
        "on_match": "disable"
      }
    ]
  }'

# Step 2: Check for free tier user
curl -X POST http://localhost:4004/api/secure/flag-check \
  -H "Content-Type: application/json" \
  -d '{
    "flag_name": "beta_features",
    "user_id": "user_free",
    "context": { "tier": "free" }
  }'
# Result: { "enabled": false, "reason": "Targeting rule matched: tier equals free" }

# Step 3: Check for pro tier user
curl -X POST http://localhost:4004/api/secure/flag-check \
  -H "Content-Type: application/json" \
  -d '{
    "flag_name": "beta_features",
    "user_id": "user_pro",
    "context": { "tier": "pro" }
  }'
# Result: { "enabled": true }

# Step 4: Check for enterprise user
curl -X POST http://localhost:4004/api/secure/flag-check \
  -H "Content-Type: application/json" \
  -d '{
    "flag_name": "beta_features",
    "user_id": "user_enterprise",
    "context": { "tier": "enterprise" }
  }'
# Result: { "enabled": true }
```

**What we're testing:**
- Targeting rules: Disable for free tier, enable for paid
- Context passing: User attributes correctly evaluated
- Safety: New features not forced on free users

---

### Scenario 4: A/B Testing with Variants

**Test:** Consistent variant selection for experiments

```bash
# Step 1: Create flag with variants
curl -X POST http://localhost:4004/api/secure/flags \
  -H "Content-Type: application/json" \
  -d '{
    "name": "checkout_button_color",
    "description": "A/B test button colors",
    "enabled": true,
    "rollout_percentage": 100,
    "variants": [
      { "name": "blue_button", "weight": 50 },
      { "name": "red_button", "weight": 50 }
    ]
  }'

# Step 2: Evaluate for 10 different users
for i in {1..10}; do
  echo "User $i:"
  curl -s -X POST http://localhost:4004/api/secure/flag-check \
    -H "Content-Type: application/json" \
    -d "{\"flag_name\": \"checkout_button_color\", \"user_id\": \"user$i\"}" | jq '.variant'
done

# Step 3: Evaluate same user twice (must be SAME variant both times)
echo "User 1 - Call 1:"
curl -s -X POST http://localhost:4004/api/secure/flag-check \
  -H "Content-Type: application/json" \
  -d '{"flag_name": "checkout_button_color", "user_id": "user1"}' | jq '.variant.name'

echo "User 1 - Call 2:"
curl -s -X POST http://localhost:4004/api/secure/flag-check \
  -H "Content-Type: application/json" \
  -d '{"flag_name": "checkout_button_color", "user_id": "user1"}' | jq '.variant.name'

# Expected: Same variant both times (consistent A/B test)
```

**What we're testing:**
- Variant consistency: Each user always gets same variant
- Distribution: ~50% blue, ~50% red across population
- A/B test validity: Cohort stability for statistical analysis

---

### Scenario 5: Vulnerable vs Secure Comparison

**Test:** See the difference between hardcoded and database flags

```bash
# Step 1: Check vulnerable endpoint (hardcoded flags)
echo "=== Vulnerable Endpoint ==="
curl -X POST http://localhost:4004/api/vulnerable/flag-check \
  -H "Content-Type: application/json" \
  -d '{ "flag_name": "new_checkout" }'

# Notice:
# - No rollout control
# - Hardcoded values
# - No audit trail

# Step 2: Check same flag via secure endpoint (database-backed)
echo -e "\n=== Secure Endpoint ==="
curl -X POST http://localhost:4004/api/secure/flag-check \
  -H "Content-Type: application/json" \
  -d '{
    "flag_name": "new_checkout",
    "user_id": "user123"
  }'

# Notice: Feature not found (must create first)

# Step 3: Create via secure endpoint
curl -X POST http://localhost:4004/api/secure/flags \
  -H "Content-Type: application/json" \
  -d '{
    "name": "new_checkout",
    "enabled": true,
    "rollout_percentage": 50
  }'

# Step 4: Check again (now available with control)
curl -X POST http://localhost:4004/api/secure/flag-check \
  -H "Content-Type: application/json" \
  -d '{
    "flag_name": "new_checkout",
    "user_id": "user123"
  }'
```

**What we're testing:**
- Vulnerability: Hardcoded flags require code redeploy
- Security: Database flags = runtime control
- Difference: One call vs multiple flag management operations

---

### Scenario 6: Kill Switch (Emergency Disable)

**Test:** Instantly disable a critical feature during incident

```bash
# Step 1: Create critical flag
curl -X POST http://localhost:4004/api/secure/flags \
  -H "Content-Type: application/json" \
  -d '{
    "name": "payment_processing",
    "description": "Core payment system",
    "enabled": true,
    "rollout_percentage": 100
  }'

# Step 2: Verify it's enabled
curl -X POST http://localhost:4004/api/secure/flag-check \
  -H "Content-Type: application/json" \
  -d '{"flag_name": "payment_processing", "user_id": "user123"}'
# Result: { "enabled": true }

# Step 3: Incident! Payment processor down
# Disable flag (1 second latency)
curl -X PUT http://localhost:4004/api/secure/flags/payment_processing \
  -H "Content-Type: application/json" \
  -d '{ "enabled": false }'

# Step 4: All new requests see disabled
curl -X POST http://localhost:4004/api/secure/flag-check \
  -H "Content-Type: application/json" \
  -d '{"flag_name": "payment_processing", "user_id": "user456"}'
# Result: { "enabled": false, "reason": "Flag globally disabled" }

# vs. without feature flags:
# 1. Code changes
# 2. Tests
# 3. Build (5 min)
# 4. Deploy (10 min)
# 5. Rolling restart (15 min)
# Total: 30+ minutes of downtime
```

**What we're testing:**
- Kill switch speed: 1 second vs 30 minutes
- Risk reduction: Stop damage instantly
- Revenue protection: Prevent cascade failures

---

## Common Commands

### Get All Flags

```bash
curl http://localhost:4004/api/secure/flags?limit=100&offset=0 | jq '.flags'
```

### Get Single Flag

```bash
curl http://localhost:4004/api/secure/flags/checkout_v2 | jq '.'
```

### Delete Flag

```bash
curl -X DELETE http://localhost:4004/api/secure/flags/checkout_v2
```

### Get Audit Log

```bash
curl http://localhost:4004/api/secure/audit-log | jq '.events[-5:]'
```

### Clear All Data

```bash
curl -X POST http://localhost:4004/api/test/clear
```

---

## Troubleshooting

### "EADDRINUSE" Error

Port 4004 already in use:

```bash
# Find process using port
lsof -i :4004

# Kill it
kill -9 <PID>

# Or use different port
HTTP_PORT=4005 node server.js
```

### Flag Not Found

Flag doesn't exist in database:

```bash
# Create it first
curl -X POST http://localhost:4004/api/secure/flags \
  -H "Content-Type: application/json" \
  -d '{ "name": "my_flag", "enabled": true, "rollout_percentage": 50 }'
```

### Rollout Doesn't Work

Same user getting different states:

```bash
# Check: Verify deterministic hashing
curl -X POST http://localhost:4004/api/secure/flag-check \
  -H "Content-Type: application/json" \
  -d '{"flag_name": "my_flag", "user_id": "user123"}' | jq '.enabled'

# Call twice: Should return SAME value both times
```

### Targeting Rules Not Working

Context not passed:

```bash
# ❌ Missing context
curl -X POST http://localhost:4004/api/secure/flag-check \
  -H "Content-Type: application/json" \
  -d '{
    "flag_name": "beta_features",
    "user_id": "user123"
  }'

# ✅ Include context
curl -X POST http://localhost:4004/api/secure/flag-check \
  -H "Content-Type: application/json" \
  -d '{
    "flag_name": "beta_features",
    "user_id": "user123",
    "context": { "tier": "free" }
  }'
```

---

## Performance Testing

### Check Flag Evaluation Speed

```bash
# Benchmark 1000 flag evaluations
time for i in {1..1000}; do
  curl -s -X POST http://localhost:4004/api/secure/flag-check \
    -H "Content-Type: application/json" \
    -d '{"flag_name": "test", "user_id": "user'$i'"}' > /dev/null
done

# Expected: < 5 seconds for 1000 evaluations
# = < 5ms per evaluation (acceptable latency)
```

### Check Variant Distribution

```bash
# Test 10,000 users: should see ~50/50 distribution
results=$(for i in {1..10000}; do
  curl -s -X POST http://localhost:4004/api/secure/flag-check \
    -H "Content-Type: application/json" \
    -d "{\"flag_name\": \"button_color\", \"user_id\": \"user$i\"}" | grep -o 'blue_button\|red_button'
done)

echo "Distribution:"
echo "$results" | sort | uniq -c
# Expected: ~5000 blue, ~5000 red
```
## Environment Variables
## How to run
## How to test
