# Module 03: Test Doubles - Setup Guide

## Quick Start (5 minutes)

```bash
# Install dependencies
npm install

# Start server
npm run dev

# Run tests
npm test

# Visit UI
open http://localhost:4003
```

## Step-by-Step Setup

### 1. Install Dependencies

```bash
npm install
```

**Key Packages:**

- `sinon` - Mocking library (create spies, stubs, mocks)
- `express` - Web framework
- `jest` - Testing framework
- Other: helmet, cors, dotenv

### 2. Environment Setup

Create `.env` file:

```env
HTTP_PORT=4003
NODE_ENV=development
JWT_SECRET=test-secret
DB_TIMEOUT=5000
API_TIMEOUT=10000
LOG_LEVEL=debug
```

### 3. Start Server

```bash
npm run dev
```

### 4. Run Tests

```bash
# All tests
npm test

# Watch mode
npm test -- --watch

# Specific file
npm test controller.test.js
```

## Understanding Test Doubles

### Spy

**What:** Observes a function but still executes it

```javascript
test('spy on console.log', () => {
  const spy = sinon.spy(console, 'log');
  
  console.log('Hello');
  
  expect(spy.calledWith('Hello')).to.be.true;
  spy.restore();
});
```

**Use Cases:**
- Verify function was called
- Check call count
- Check arguments passed
- Without preventing execution

### Stub

**What:** Replaces function with dummy that doesn't execute original

```javascript
test('stub database call', () => {
  const stub = sinon.stub(db, 'getUser');
  stub.returns({ id: 1, name: 'Alice' });
  
  const result = db.getUser(1);
  
  expect(result.name).to.equal('Alice');
  stub.restore();
});
```

**Use Cases:**
- Replace database calls
- Skip API calls
- Force error conditions
- Avoid side effects

### Mock

**What:** Predefined expectation of how function should be called

```javascript
test('mock API call', () => {
  const mock = sinon.mock(api);
  mock.expects('fetch')
    .once()
    .withArgs('/users')
    .returns(Promise.resolve([]));
  
  api.fetch('/users');
  
  mock.verify();
  mock.restore();
});
```

**Use Cases:**
- Strict call verification
- Predefined expectations
- Enforce calling patterns

## Common Patterns

### Mocking External Services

```javascript
test('fetch user from external API', () => {
  const stub = sinon.stub(http, 'get');
  stub.resolves({ body: { name: 'Alice' } });
  
  const user = await fetchUser(1);
  
  expect(user.name).to.equal('Alice');
  stub.restore();
});
```

### Verifying Call Arguments

```javascript
test('logger called with correct level', () => {
  const spy = sinon.spy(logger, 'error');
  
  try {
    dangerousFunction();
  } catch (e) {
    logger.error(e);
  }
  
  expect(spy.calledOnce).to.be.true;
  spy.restore();
});
```

### Simulating Errors

```javascript
test('handle API error', () => {
  const stub = sinon.stub(api, 'call');
  stub.rejects(new Error('Network error'));
  
  expect(() => api.call()).to.throw('Network error');
  stub.restore();
});
```

### Chaining Calls

```javascript
test('stub with multiple return values', () => {
  const stub = sinon.stub(counter, 'next');
  
  stub.onFirstCall().returns(1);
  stub.onSecondCall().returns(2);
  stub.onThirdCall().returns(3);
  
  expect(counter.next()).to.equal(1);
  expect(counter.next()).to.equal(2);
  expect(counter.next()).to.equal(3);
  
  stub.restore();
});
```

## Testing Strategies

### Unit Test with Spies

```javascript
test('should call email service', () => {
  const sendEmailSpy = sinon.spy();
  const user = { name: 'Bob', email: 'bob@test.com' };
  
  sendWelcome(user, sendEmailSpy);
  
  expect(sendEmailSpy.calledWith('bob@test.com')).to.be.true;
});
```

### Integration Test with Stubs

```javascript
test('create user with valid email (without sending)', () => {
  const emailStub = sinon.stub(emailService, 'send');
  
  const user = createUser({ name: 'Alice', email: 'alice@test.com' });
  
  expect(user.email).to.equal('alice@test.com');
  expect(emailStub.calledOnce).to.be.true;
  
  emailStub.restore();
});
```

### Error Testing

```javascript
test('handle email service failure gracefully', () => {
  const emailStub = sinon.stub(emailService, 'send');
  emailStub.rejects(new Error('SMTP timeout'));
  
  expect(() => {
    sendConfirmation({ email: 'test@test.com' });
  }).to.throw('SMTP timeout');
  
  emailStub.restore();
});
```

## Testing the React UI

The interactive React component at `http://localhost:4003` demonstrates:

- **Spy Examples** - Verify function calls
- **Stub Examples** - Replace implementations
- **Mock Examples** - Strict expectations
- **Error Injection** - Simulate failures

## Cleanup Best Practices

### Always Restore

```javascript
afterEach(() => {
  // Restore all stubs
  sinon.restore();
});
```

### Use Sandbox

```javascript
let sandbox;

beforeEach(() => {
  sandbox = sinon.createSandbox();
});

afterEach(() => {
  sandbox.restore();
});

test('with sandbox', () => {
  const stub = sandbox.stub(api, 'call');
  // ...
});
```

## Debugging

### Print Call Count

```javascript
const spy = sinon.spy(fn);
fn();
fn();
console.log(spy.callCount);  // 2
```

### Print Call Arguments

```javascript
const spy = sinon.spy(console, 'log');
console.log('Hello', 'World');
console.log(spy.getCall(0).args);  // ['Hello', 'World']
```

### Print All Calls

```javascript
const spy = sinon.spy(api, 'call');
api.call(1);
api.call(2);
console.log(spy.getCalls());  // Array of all calls
```

## Troubleshooting

### "Stub not getting called"

```javascript
// Check if object path is correct
const stub = sinon.stub(obj, 'method');  // Correct
const stub = sinon.stub(obj.method);     // Wrong!
```

### "Cannot stub: already stubbed"

```javascript
// Restore before stubbing again
stub.restore();
// or use sandbox
sandbox.restore();
```

### "Restore not working"

```javascript
// Use explicit restore
sinon.restore();  // Restores all
// or
stub.restore();   // Specific stub
```

## Key Differences

| Tool | Executes | Verifies | Use |
|------|----------|----------|-----|
| **Spy** | Yes | Calls | Observe function behavior |
| **Stub** | No | Replaced | Skip implementation |
| **Mock** | No | Strict | Enforce expectations |

## Best Practices

1. **Clean Up** - Always restore spies/stubs
2. **Extract Stubs** - Use helper functions
3. **Mock External** - Database, API, file system
4. **Spy on Side Effects** - Logging, analytics
5. **Document Mocks** - Why each mock exists
6. **Use Sandbox** - Easier cleanup
7. **Test Error Cases** - Stub failures too
8. **Don't Over Mock** - Mock what matters

## Next Steps

1. ✅ Examine test files for spy/stub/mock patterns
2. ✅ Run tests in watch mode
3. ✅ Create a test with each double type
4. ✅ Test error scenarios
5. ✅ Try the interactive React UI
