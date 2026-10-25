# 03 - Test Doubles: Mocks, Stubs & Spies

## Overview
Master isolation techniques using mocks, stubs, and spies to control external dependencies and verify behavior.

## What You'll Learn
- **Mocks** - Complete replacement of functions/modules
- **Stubs** - Providing fake implementations  
- **Spies** - Tracking and verifying function calls
- **Sinon.js** - Powerful JavaScript mocking library
- **Verification** - Assert how functions interact
- **Error Simulation** - Test error paths

## Key Concepts

### Mocks
Complete replacement of a function or module:
```javascript
const mockDatabase = {
  save: jest.fn().mockResolvedValue({ id: 1 })
};
```

### Stubs
Provide predetermined return values:
```javascript
const stub = jest.fn()
  .mockReturnValueOnce(10)
  .mockReturnValueOnce(20);
```

### Spies  
Track calls to existing functions:
```javascript
const spy = jest.spyOn(obj, 'method');
await obj.method();
expect(spy).toHaveBeenCalled();
```

## Use Cases
1. Isolating database calls
2. Mocking external APIs
3. Testing error handlers
4. Verifying integrations
5. Controlling async behavior

## API Endpoints
- `/api/mock/database` - Mock DB calls
- `/api/stub/api` - Stub API responses
- `/api/spy/events` - Spy on events
- `/api/errors` - Error simulation

## Quick Start
```bash
npm install
npm run dev
```

## Learning Path
1. Understand when to mock
2. Create basic mocks
3. Use stubs for multiple returns
4. Add spies for verification
5. Combine techniques
6. Test error paths

## Resources
- [Jest Mocking](https://jestjs.io/docs/mock-functions)
- [Sinon.js](https://sinonjs.org/)
- [Test Doubles Pattern](https://martinfowler.com/bliki/TestDouble.html)
