#!/bin/bash

# This script creates comprehensive content for all testing modules

# Module 02 - Integration Tests (already started)
cat > 02-integration-tests-supertest/README.md << 'MODEOF'
# 02 - Integration Tests with Supertest

## Overview
Learn to test multiple components working together using Supertest for HTTP testing.

## What You'll Learn
- **API Endpoint Testing** - Test with real middleware stack
- **Supertest Basics** - Making HTTP assertions
- **Workflow Testing** - Test complete user workflows
- **Error Handling** - Test error paths
- **Database Integration** - Test with real/test databases
- **Authentication** - Test protected endpoints

## Quick Start
```bash
npm install
cp .env.example .env
npm run dev
# Visit http://localhost:5402
```

## Key Concepts
- **Integration vs Unit** - Component interactions
- **Supertest** - HTTP testing for Express
- **Workflows** - Multi-step testing scenarios
- **Error Paths** - Test failures and edge cases

## API Endpoints
- POST /api/auth/register - User registration
- POST /api/auth/login - User login
- GET /api/profile - Get user profile
- POST /api/products - Create product
- GET /api/products - List products

## Testing Scenarios
1. User registration workflow
2. Login and authentication
3. CRUD operations with errors
4. Middleware validation
5. Database constraints

## Resources
- [Supertest Docs](https://github.com/visionmedia/supertest)
- [Testing Best Practices](https://github.com/goldbergyoni/javascript-testing-best-practices)
MODEOF

echo "✓ Module 02 README created"

# Create package.json for Module 02
cat > 02-integration-tests-supertest/package.json << 'MODEOF'
{
  "name": "testing-integration-tests-supertest",
  "version": "1.0.0",
  "description": "11-testing - 02-integration-tests-supertest: API testing with Supertest",
  "main": "controller.js",
  "scripts": {
    "start": "node server.js",
    "dev": "nodemon server.js",
    "test": "echo \"Run manual tests via API\""
  },
  "dependencies": {
    "express": "^4.18.2",
    "cors": "^2.8.5",
    "helmet": "^7.0.0",
    "dotenv": "^16.3.1",
    "joi": "^17.9.2",
    "jsonwebtoken": "^9.0.0",
    "bcrypt": "^5.1.0"
  },
  "devDependencies": {
    "nodemon": "^3.0.1",
    "supertest": "^6.3.3"
  }
}
MODEOF

echo "✓ Module 02 package.json created"

