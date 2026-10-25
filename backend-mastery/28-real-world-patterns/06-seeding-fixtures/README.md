# Module 06: Seeding & Fixtures - Complete Guide

## Overview

Database seeding is the process of automatically populating a database with initial data for development, testing, or demo purposes. This module covers:

- **Seed Data Generation** - Create reproducible test data using Faker.js
- **Fixture Loading** - Pre-defined data sets for specific test scenarios
- **Bulk Operations** - Efficient batch seeding with configurable batch sizes
- **Validation** - Verify seed integrity before application
- **Multi-Environment** - Different seed configurations per environment
- **Cleanup Utilities** - Reset data when needed

## Architecture

```
┌─────────────────────────────────────────┐
│ React Frontend (http://localhost:3000)  │
├─────────────────────────────────────────┤
│ ├─ Seed Config Tab (generate data)      │
│ ├─ Seeder Tab (run specific seeders)    │
│ ├─ Fixture Tab (load predefined data)   │
│ └─ Status Tab (view logs & statistics)  │
└────────┬────────────────────────────────┘
         │ HTTP/JSON
         ↓
┌─────────────────────────────────────────┐
│ Express.js Backend (port 4006)          │
├─────────────────────────────────────────┤
│ ├─ POST /api/secure/seed                │
│ ├─ POST /api/secure/seed/run            │
│ ├─ POST /api/secure/seed/fixture        │
│ ├─ POST /api/secure/seed/validate       │
│ ├─ GET  /api/secure/seed/status         │
│ ├─ POST /api/secure/seed/batch          │
│ └─ DELETE /api/secure/seed/clean        │
└────────┬────────────────────────────────┘
         │ In-Memory Storage
         ↓
┌─────────────────────────────────────────┐
│ Collections (development/staging/prod)  │
├─────────────────────────────────────────┤
│ ├─ users[]                              │
│ ├─ posts[]                              │
│ ├─ comments[]                           │
│ └─ tags[]                               │
└─────────────────────────────────────────┘
```

## API Endpoints

### 1. Generate Seed Data
**Endpoint:** `POST /api/secure/seed`

Generate randomized seed data using Faker.js for the specified environment.

**Request:**
```json
{
  "environment": "development",
  "count": 100,
  "includeRelations": true,
  "clean_before_seed": false,
  "locale": "en_US"
}
```

**Response:**
```json
{
  "success": true,
  "message": "Seed data generated successfully",
  "data": {
    "environment": "development",
    "users_generated": 100,
    "posts_generated": 50,
    "comments_generated": 30,
    "total_records": 180,
    "timestamp": "2024-01-15T10:30:00Z"
  }
}
```

**Use Cases:**
- Populate development database with realistic test data
- Create demo data for presentations
- Generate load testing data

---

### 2. Run Specific Seeder
**Endpoint:** `POST /api/secure/seed/run?env=development`

Execute a single seeder (users, posts, comments, tags) with batch processing.

**Request:**
```json
{
  "seeder_name": "users",
  "count": 50,
  "batch_size": 100
}
```

**Response:**
```json
{
  "success": true,
  "seeder": "users",
  "environment": "development",
  "records_created": 50,
  "batches": 1,
  "duration_ms": 245
}
```

**Available Seeders:**
- `users` - Generate user records with names, emails, avatars
- `posts` - Generate blog post data
- `comments` - Generate comment data
- `tags` - Generate tag/category data

---

### 3. Load Fixture Data
**Endpoint:** `POST /api/secure/seed/fixture?env=development`

Load predefined fixture data into a specific collection.

**Request:**
```json
{
  "name": "test_users",
  "description": "Test user fixtures",
  "collection": "users",
  "data": [
    {
      "id": 1,
      "name": "Alice Johnson",
      "email": "alice@test.com",
      "role": "admin"
    },
    {
      "id": 2,
      "name": "Bob Smith",
      "email": "bob@test.com",
      "role": "user"
    }
  ]
}
```

**Response:**
```json
{
  "success": true,
  "message": "Fixture 'test_users' loaded successfully",
  "fixture": "test_users",
  "environment": "development",
  "records_loaded": 2
}
```

**Benefits:**
- Precise control over test data
- Reproducible test scenarios
- Can include edge cases

---

### 4. Validate Seed Data
**Endpoint:** `POST /api/secure/seed/validate?env=development`

Validate generated seed data for integrity.

**Request:**
```json
{
  "seeder_name": "users",
  "sample_size": 10,
  "strict": false
}
```

**Response:**
```json
{
  "success": true,
  "seeder": "users",
  "validation": {
    "total_records": 100,
    "sample_size": 10,
    "has_duplicates": false,
    "has_nulls": 0,
    "status": "valid"
  }
}
```

**Checks:**
- No duplicate IDs
- No null/undefined values
- Data type compliance
- Required fields present

---

### 5. Get Seeding Status
**Endpoint:** `GET /api/secure/seed/status?environment=development&limit=10`

Retrieve seeding statistics and recent operations.

**Response:**
```json
{
  "statistics": {
    "total_records_seeded": 5000,
    "total_seeders_run": 15,
    "total_fixtures_loaded": 3,
    "last_seed_time": "2024-01-15T10:30:00Z",
    "environments": {
      "development": {
        "records": 3000,
        "seeders": 10
      },
      "staging": {
        "records": 1500,
        "seeders": 3
      },
      "production": {
        "records": 500,
        "seeders": 2
      }
    }
  },
  "recent_seeds": [
    {
      "timestamp": "2024-01-15T10:30:00Z",
      "environment": "development",
      "count": 100,
      "total_records": 180,
      "status": "success"
    }
  ],
  "total_log_entries": 15
}
```

---

### 6. Batch Seeding
**Endpoint:** `POST /api/secure/seed/batch?env=development`

Run multiple seeders in sequence or parallel with dry-run support.

**Request:**
```json
{
  "operations": [
    {
      "seeder": "users",
      "count": 100,
      "batch_size": 100
    },
    {
      "seeder": "posts",
      "count": 50,
      "batch_size": 100
    },
    {
      "seeder": "comments",
      "count": 30,
      "batch_size": 100
    }
  ],
  "parallel": false,
  "dry_run": false
}
```

**Response:**
```json
{
  "success": true,
  "environment": "development",
  "dry_run": false,
  "operations_count": 3,
  "total_records": 180,
  "results": [
    {
      "seeder": "users",
      "count": 100,
      "batch_size": 100,
      "status": "completed"
    },
    {
      "seeder": "posts",
      "count": 50,
      "batch_size": 100,
      "status": "completed"
    },
    {
      "seeder": "comments",
      "count": 30,
      "batch_size": 100,
      "status": "completed"
    }
  ],
  "timestamp": "2024-01-15T10:31:00Z"
}
```

---

### 7. Clean Environment
**Endpoint:** `DELETE /api/secure/seed/clean?env=development`

Delete all seeded data from specified environment.

**Response:**
```json
{
  "success": true,
  "message": "Cleaned 180 records from development",
  "records_deleted": 180,
  "environment": "development"
}
```

**Warning:** This operation is irreversible. Use with caution in production.

---

## Real-World Examples

### Example 1: Development Setup Script
```bash
#!/bin/bash
# Auto-seed development database on startup

curl -X POST http://localhost:4006/api/secure/seed \
  -H "Content-Type: application/json" \
  -d '{
    "environment": "development",
    "count": 500,
    "includeRelations": true,
    "clean_before_seed": true,
    "locale": "en_US"
  }'
```

### Example 2: Testing Fixtures
```javascript
// jest.setup.js - Load fixtures before tests
beforeEach(async () => {
  await fetch('http://localhost:4006/api/secure/seed/fixture', {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({
      name: 'test_data',
      collection: 'users',
      data: [
        { id: 1, email: 'test@test.com', role: 'user' }
      ]
    })
  });
});
```

### Example 3: Load Testing Preparation
```javascript
async function prepareLoadTest() {
  // Generate 10,000 records for load testing
  const response = await fetch('http://localhost:4006/api/secure/seed', {
    method: 'POST',
    body: JSON.stringify({
      environment: 'staging',
      count: 10000,
      includeRelations: true,
      batch_size: 1000
    })
  });
  
  const result = await response.json();
  console.log(`Generated ${result.data.total_records} records`);
}
```

### Example 4: Multi-Environment Seeding
```javascript
async function seedAllEnvironments() {
  const envs = ['development', 'staging', 'production'];
  const counts = [500, 2000, 10000]; // Different volumes per env
  
  for (let i = 0; i < envs.length; i++) {
    await fetch('http://localhost:4006/api/secure/seed', {
      method: 'POST',
      body: JSON.stringify({
        environment: envs[i],
        count: counts[i],
        clean_before_seed: true
      })
    });
  }
}
```

---

## Best Practices

### 1. Use Fixtures for Critical Tests
```javascript
// ✓ GOOD - Use fixtures for specific test scenarios
const criticalUserFixture = {
  id: 1,
  email: 'admin@test.com',
  role: 'admin',
  permissions: ['read', 'write', 'delete']
};

// ✗ BAD - Relying on random seed data for assertions
expect(user.email).toContain('@');  // Too loose!
```

### 2. Clean Before Each Test Suite
```javascript
beforeAll(async () => {
  // Clean environment before test suite
  await fetch('http://localhost:4006/api/secure/seed/clean?env=test', {
    method: 'DELETE'
  });
  
  // Then load specific fixtures
  await loadTestFixtures();
});
```

### 3. Validate After Seeding
```javascript
// Always validate generated data
const seedResponse = await fetch('/api/secure/seed', { method: 'POST', ... });
const seedData = await seedResponse.json();

if (seedData.success) {
  const validationResponse = await fetch('/api/secure/seed/validate', {
    method: 'POST',
    body: JSON.stringify({ seeder_name: 'users', sample_size: 100 })
  });
  
  const validation = await validationResponse.json();
  if (!validation.validation.valid) {
    throw new Error('Seed validation failed');
  }
}
```

### 4. Use Batch Processing for Large Datasets
```javascript
// ✓ GOOD - Batch seeding
const batchResponse = await fetch('/api/secure/seed/batch', {
  method: 'POST',
  body: JSON.stringify({
    operations: [
      { seeder: 'users', count: 5000, batch_size: 500 },
      { seeder: 'posts', count: 20000, batch_size: 1000 }
    ],
    parallel: true  // Run in parallel for speed
  })
});

// ✗ BAD - Creating records one by one
for (let i = 0; i < 20000; i++) {
  await db.users.insertOne({ ... });  // Slow!
}
```

### 5. Environment-Specific Seeding
```javascript
// Different data volumes for different environments

// Development: Small, focused datasets
{ environment: 'development', count: 100 }

// Staging: Mirror production scale
{ environment: 'staging', count: 10000 }

// Production: Use fixtures only, never auto-seed
// Manual fixture loading with approval required
```

---

## Troubleshooting

### Issue: Seeding is slow
**Solution:** Use batch processing with larger batch size
```json
{ "batch_size": 1000 }  // Increase from default 100
```

### Issue: Memory usage growing
**Solution:** Clean old data and restart server
```bash
curl -X DELETE http://localhost:4006/api/secure/seed/clean?env=development
npm restart
```

### Issue: Duplicates detected in validation
**Solution:** Clean before seeding
```json
{ "clean_before_seed": true }
```

### Issue: Seeding takes too long
**Solution:** Use parallel batch operations
```json
{
  "operations": [...],
  "parallel": true
}
```

---

## Performance Characteristics

| Operation | Records | Duration |
|-----------|---------|----------|
| Generate users | 100 | 50ms |
| Generate users | 1,000 | 200ms |
| Generate with relations | 1,000 | 300ms |
| Batch seed (1,000 records) | 1,000 | 100ms |
| Validate sample | 10 samples | 5ms |
| Load fixture | 100 records | 10ms |

---

## Security Considerations

1. **Never seed production with random data**
   - Use fixtures with approved data only
   - Require explicit permission for any production seeding

2. **Validate all fixture data**
   - Check for sensitive information (passwords, tokens)
   - Ensure no PII in reused fixtures

3. **Audit seeding operations**
   - Log all seed operations with timestamp
   - Track who initiated seeding and when

4. **Prevent accidental deletion**
   - Require confirmation for clean operations
   - Implement soft deletes as fallback

---

## Summary

The Seeding & Fixtures module provides:
✓ Fast, reproducible test data generation
✓ Flexible fixture loading for specific scenarios
✓ Batch processing for performance
✓ Validation to ensure data integrity
✓ Multi-environment support
✓ Complete audit trail

Use this alongside Module 07 (Database Seeding) for production-ready data initialization.