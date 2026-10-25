# 09 - Contract Testing with Pact

## Overview  
Ensure API consumer and provider contracts match using Pact for microservice testing.

## What You'll Learn
- **Contract Testing** - Consumer-driven contracts
- **Pact** - Contract testing framework
- **Consumer Side** - Defining expectations
- **Provider Side** - Validating contract
- **Contract Verification** - Provider tests
- **Broker** - Sharing contracts

## Key Concepts

### Consumer Tests
```javascript
// Define what API should return
const expectedResponse = {
  id: 1,
  name: 'Alice',
  email: 'alice@test.com'
};
```

### Provider Tests
```javascript  
// Verify provider returns contract
const verifyProvider = () => {
  // Run actual endpoint
  // Verify against contract
};
```

## Benefits
1. Prevent breaking changes
2. Independent deployment
3. CI/CD integration
4. API documentation
5. Reduced E2E tests

## Workflow
1. Consumer defines contract
2. Provider verifies contract
3. Publish contract to broker
4. Provider checks broker
5. Safe to deploy

## Use Cases
1. Microservice APIs
2. Third-party integrations
3. Mobile-backend APIs
4. Multi-team projects
5. API gateways

## Quick Start
```bash
npm install @pact-foundation/pact
npm run dev
```

## Pact Broker
- Centralized contract storage
- CI/CD integration
- Can-i-deploy checks
- Webhook triggers
- Dashboard

## Best Practices
- Test realistic scenarios
- Version your contracts
- Automate verification
- Use pact broker
- Document requirements
