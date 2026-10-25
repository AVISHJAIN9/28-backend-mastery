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
