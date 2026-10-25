# Setup Guide: Seeding & Fixtures

## Installation & Setup

### Prerequisites
- Node.js 16+
- npm 8+
- Faker.js library
- Basic understanding of database operations

### Step 1: Install Dependencies

```bash
cd 06-seeding-fixtures

npm install
```

Key dependencies:
```json
{
  "@faker-js/faker": "^8.0.0",
  "express": "^4.18.0",
  "joi": "^17.9.0",
  "cors": "^2.8.5",
  "winston": "^3.8.0"
}
```

### Step 2: Configure Environment

```bash
# Copy example environment file
cp .env.example .env

# Update .env for your setup
nano .env
```

**Environment variables:**
```env
NODE_ENV=development
HTTP_PORT=4006
DATABASE_URL=mongodb://localhost/seeding_demo
LOG_LEVEL=debug
BATCH_SIZE=100
```

### Step 3: Start the Server

```bash
# Start backend server (port 4006)
npm start

# Server output:
# ✓ Seeding & Fixtures server running on http://localhost:4006
# ✓ All seeders available: users, posts, comments, tags
```

### Step 4: Access the UI

**Option A: React UI (Recommended)**
```bash
# In another terminal, start React development server
npm run dev

# Opens: http://localhost:3000
```

**Option B: Direct API Testing**
```bash
# Test seeding endpoint
curl -X POST http://localhost:4006/api/secure/seed \
  -H "Content-Type: application/json" \
  -d '{"environment": "development", "count": 100}'
```

---

## Test Scenarios

### Scenario 1: Basic Seed Data Generation

**Objective:** Generate realistic test data with Faker.js

#### Step 1A: Generate Small Dataset
```bash
curl -X POST http://localhost:4006/api/secure/seed \
  -H "Content-Type: application/json" \
  -d '{
    "environment": "development",
    "count": 10,
    "includeRelations": false,
    "clean_before_seed": false,
    "locale": "en_US"
  }'

# Response:
# {
#   "success": true,
#   "data": {
#     "environment": "development",
#     "users_generated": 10,
#     "posts_generated": 0,
#     "comments_generated": 0,
#     "total_records": 10,
#     "timestamp": "2024-01-15T10:30:00Z"
#   }
# }
```

#### Step 1B: Run Again - Verify Data Increased
```bash
# Run same seed endpoint again (default: append to existing)
curl -X POST http://localhost:4006/api/secure/seed \
  -H "Content-Type: application/json" \
  -d '{"environment": "development", "count": 10}'

# New response shows 20 total users (10 + 10)
# { "users_generated": 10, "posts_generated": 0, ... }
```

#### Step 1C: Clean and Restart
```bash
# Delete all data from environment
curl -X DELETE http://localhost:4006/api/secure/seed/clean?env=development

# Response:
# {
#   "success": true,
#   "message": "Cleaned 20 records from development",
#   "records_deleted": 20
# }

# After cleanup, count resets to 0
```

**Success Criteria:**
- ✓ Data generated with realistic values (names, emails)
- ✓ Records accumulate on repeated seeding
- ✓ Clean operation removes all data
- ✓ Different locales generate appropriate data

---

### Scenario 2: Seeding with Relationships

**Objective:** Generate hierarchical data (users → posts → comments)

#### Step 2A: Generate with Relations
```bash
curl -X POST http://localhost:4006/api/secure/seed \
  -H "Content-Type: application/json" \
  -d '{
    "environment": "development",
    "count": 50,
    "includeRelations": true,
    "clean_before_seed": true
  }'

# Response shows multiple collections:
# {
#   "users_generated": 50,
#   "posts_generated": 25,      (50% of count)
#   "comments_generated": 15,   (30% of count)
#   "total_records": 90
# }
```

#### Step 2B: Without Relations
```bash
curl -X POST http://localhost:4006/api/secure/seed \
  -H "Content-Type: application/json" \
  -d '{
    "environment": "development",
    "count": 50,
    "includeRelations": false,
    "clean_before_seed": true
  }'

# Response shows only users:
# {
#   "users_generated": 50,
#   "posts_generated": 0,
#   "comments_generated": 0,
#   "total_records": 50
# }
```

**Success Criteria:**
- ✓ Relations flag enables/disables post & comment generation
- ✓ Posts reference valid user IDs
- ✓ Comments reference valid post and user IDs
- ✓ Cleaner data structure when relations disabled

---

### Scenario 3: Running Specific Seeders

**Objective:** Execute individual seeder for one data type

#### Step 3A: Run Users Seeder
```bash
curl -X POST http://localhost:4006/api/secure/seed/run?env=development \
  -H "Content-Type: application/json" \
  -d '{
    "seeder_name": "users",
    "count": 100,
    "batch_size": 50
  }'

# Response:
# {
#   "success": true,
#   "seeder": "users",
#   "records_created": 100,
#   "batches": 2,
#   "duration_ms": 150
# }
```

#### Step 3B: Run Posts Seeder
```bash
curl -X POST http://localhost:4006/api/secure/seed/run?env=development \
  -H "Content-Type: application/json" \
  -d '{
    "seeder_name": "posts",
    "count": 200,
    "batch_size": 100
  }'

# Response:
# {
#   "success": true,
#   "seeder": "posts",
#   "records_created": 200,
#   "batches": 2,
#   "duration_ms": 230
# }
```

**Available Seeders:**
- `users` - Generate user records
- `posts` - Generate blog posts
- `comments` - Generate comments
- `tags` - Generate tags/categories

**Success Criteria:**
- ✓ Each seeder creates requested count
- ✓ Batch processing reduces call overhead
- ✓ Duration scales linearly with record count

---

### Scenario 4: Loading Fixture Data

**Objective:** Load predefined fixture data for tests

#### Step 4A: Create Simple Fixture
```bash
curl -X POST http://localhost:4006/api/secure/seed/fixture?env=development \
  -H "Content-Type: application/json" \
  -d '{
    "name": "test_users",
    "description": "Test user fixtures",
    "collection": "users",
    "data": [
      {
        "id": 999,
        "name": "Test User",
        "email": "test@test.com",
        "avatar": "https://example.com/avatar.jpg",
        "created_at": "2024-01-01T00:00:00Z",
        "is_active": true
      },
      {
        "id": 1000,
        "name": "Admin User",
        "email": "admin@test.com",
        "avatar": "https://example.com/admin.jpg",
        "created_at": "2024-01-01T00:00:00Z",
        "is_active": true
      }
    ]
  }'

# Response:
# {
#   "success": true,
#   "fixture": "test_users",
#   "records_loaded": 2
# }
```

#### Step 4B: Verify Fixture Loaded
```bash
# Get status - should show fixture load
curl http://localhost:4006/api/secure/seed/status

# Response includes:
# {
#   "statistics": {
#     "total_fixtures_loaded": 1
#   },
#   "recent_seeds": [
#     {
#       "type": "fixture",
#       "name": "test_users",
#       "records": 2,
#       "status": "success"
#     }
#   ]
# }
```

**Success Criteria:**
- ✓ Fixture data replaces existing collection
- ✓ Exact data preserved (names, IDs, etc)
- ✓ Logged in status/history
- ✓ Can load different fixtures per environment

---

### Scenario 5: Validating Seed Data

**Objective:** Verify generated data integrity

#### Step 5A: Validate Users Collection
```bash
curl -X POST http://localhost:4006/api/secure/seed/validate?env=development \
  -H "Content-Type: application/json" \
  -d '{
    "seeder_name": "users",
    "sample_size": 20,
    "strict": false
  }'

# Response:
# {
#   "success": true,
#   "validation": {
#     "total_records": 100,
#     "sample_size": 20,
#     "has_duplicates": false,
#     "has_nulls": 0,
#     "status": "valid"
#   }
# }
```

#### Step 5B: Invalid Data Detection
```bash
# After loading bad fixture with duplicates
curl -X POST http://localhost:4006/api/secure/seed/validate?env=development \
  -H "Content-Type: application/json" \
  -d '{"seeder_name": "users", "sample_size": 10}'

# Response shows problems:
# {
#   "validation": {
#     "has_duplicates": true,
#     "has_nulls": 5,
#     "status": "invalid"
#   }
# }
```

**Checks Performed:**
- No duplicate IDs
- No null/undefined values
- Required fields present
- Type compliance

**Success Criteria:**
- ✓ Valid data passes validation
- ✓ Duplicates detected
- ✓ Null values counted
- ✓ Status indicates validity

---

### Scenario 6: Batch Seeding Operations

**Objective:** Run multiple seeders in single request

#### Step 6A: Batch Seed Multiple Collections
```bash
curl -X POST http://localhost:4006/api/secure/seed/batch?env=development \
  -H "Content-Type: application/json" \
  -d '{
    "operations": [
      { "seeder": "users", "count": 100, "batch_size": 100 },
      { "seeder": "posts", "count": 200, "batch_size": 100 },
      { "seeder": "comments", "count": 300, "batch_size": 100 },
      { "seeder": "tags", "count": 50, "batch_size": 100 }
    ],
    "parallel": false,
    "dry_run": false
  }'

# Response:
# {
#   "success": true,
#   "operations_count": 4,
#   "total_records": 650,
#   "results": [
#     { "seeder": "users", "count": 100, "status": "completed" },
#     { "seeder": "posts", "count": 200, "status": "completed" },
#     ...
#   ]
# }
```

#### Step 6B: Dry-Run (Preview Only)
```bash
# Same request but dry_run: true
curl -X POST http://localhost:4006/api/secure/seed/batch?env=development \
  -H "Content-Type: application/json" \
  -d '{
    "operations": [...],
    "dry_run": true
  }'

# Response shows simulated, not applied
# {
#   "results": [
#     { "seeder": "users", "status": "simulated" },
#     ...
#   ]
# }

# Data not actually created!
```

**Success Criteria:**
- ✓ Multiple seeders execute in one call
- ✓ Dry-run previews without applying
- ✓ Total records accumulate correctly
- ✓ Parallel option works (faster with parallel: true)

---

## Integration Tests

### Test Suite Execution

```bash
# Run all integration tests
npm run test

# Test output:
# ✓ Basic seed generation
# ✓ Seeding with relationships
# ✓ Running specific seeders
# ✓ Loading fixtures
# ✓ Validating seed data
# ✓ Batch seeding
#
# Tests: 6 passed, 0 failed
# Coverage: 89%
```

---

## Performance Benchmarks

### Generation Speed

```bash
# 1,000 users: ~200ms
npm run seed -- --count 1000 --seeder users

# 10,000 users: ~2s
npm run seed -- --count 10000 --seeder users

# 100,000 users: ~20s
npm run seed -- --count 100000 --seeder users
```

### Validation Speed

```bash
# Validate 1,000 records: ~10ms
curl /api/secure/seed/validate -d '{"seeder_name": "users", "sample_size": 100}'

# Validate 100,000 records: ~50ms
curl /api/secure/seed/validate -d '{"seeder_name": "users", "sample_size": 1000}'
```

---

## Troubleshooting

### Issue: Seeding very slow

**Solution 1: Use larger batch size**
```json
{ "batch_size": 1000 }  // Increase from 100
```

**Solution 2: Enable parallel processing**
```json
{ "parallel": true }  // Run seeders concurrently
```

**Solution 3: Generate fewer related records**
```json
{ "includeRelations": false }  // Skip posts/comments initially
```

### Issue: Fixture data replaced instead of merged

**Expected behavior:** Fixture replaces entire collection
**Solution:** Load fixture into different collection or backup first
```bash
# Backup existing data first
curl GET /api/secure/seed/status > backup.json

# Then load fixture (replaces)
curl POST /api/secure/seed/fixture
```

### Issue: Memory running out during large seed

**Solution: Stream in smaller batches**
```javascript
const BATCH_SIZE = 10000;
for (let i = 0; i < 1_000_000; i += BATCH_SIZE) {
  // Seed BATCH_SIZE records at a time
  await seed(BATCH_SIZE);
}
```

### Issue: Validation shows duplicates

**Solution: Clean before seeding**
```json
{ "clean_before_seed": true }
```

---

## Production Deployment Checklist

Before deploying to production:

- [ ] All 6 test scenarios pass
- [ ] Validation catches duplicate IDs
- [ ] Batch operations work correctly
- [ ] Fixture loading tested
- [ ] Clean operation tested
- [ ] Performance acceptable (< 1M records in < 60s)
- [ ] Memory usage stable (no leaks)
- [ ] Error handling comprehensive
- [ ] Logging enabled for audit trail
- [ ] Backups taken before cleanup
- [ ] Fixtures version controlled
- [ ] Faker seed set for reproducibility
- [ ] Batch size tuned for hardware
- [ ] Database indexes created first
- [ ] Cleanup procedure documented

---

## Additional Resources

- **Seeding Patterns:** See `theory.md` for deep dive on factories, fixtures, and architecture
- **API Documentation:** See `README.md` for endpoint details
- **Real-World Examples:** Stripe, Shopify, GitHub approaches in theory.md
- **Source Code:** See `controller.js`, `routes.js` for implementation