# Module 09: Contract Testing with Pact - Setup Guide

## Quick Start (5 minutes)

```bash
# Install dependencies
npm install

# Generate consumer contracts
npm test consumer

# Verify provider
npm test provider

# View generated contracts
cat pacts/*.json
```

## Step-by-Step Setup

### 1. Install Dependencies

```bash
npm install
```

**Key Packages:**
- `@pact-foundation/pact` - Contract testing
- `jest` - Testing framework
- `@pact-foundation/pact-node` - CLI tools

### 2. Create Consumer Test

**consumer.test.js:**

```javascript
import { Pact } from '@pact-foundation/pact';

const provider = new Pact({
  consumer: 'UserClient',
  provider: 'UserService'
});

test('should get user', async () => {
  provider.addInteraction({
    uponReceiving: 'a request for user 1',
    withRequest: {
      method: 'GET',
      path: '/api/users/1'
    },
    willRespondWith: {
      status: 200,
      body: {
        id: 1,
        name: 'Alice',
        email: 'alice@test.com'
      }
    }
  });
  
  const user = await fetchUser(1);
  expect(user.name).toBe('Alice');
});

afterAll(() => provider.finalize());
```

### 3. Create Provider Verification

**provider.test.js:**

```javascript
import { Verifier } from '@pact-foundation/pact';

test('should verify consumer contract', async () => {
  const opts = {
    provider: 'UserService',
    providerBaseUrl: 'http://localhost:3000',
    pactUrls: ['./pacts/UserClient-UserService.json']
  };
  
  return new Verifier(opts).verifyProvider();
});
```

### 4. Configure Package.json

```json
{
  "scripts": {
    "test:consumer": "jest consumer.test.js",
    "test:provider": "jest provider.test.js",
    "test:pact": "npm run test:consumer && npm run test:provider"
  }
}
```

## Pact Workflow

### Step 1: Consumer Writes Test

```javascript
// consumer.test.js - What the consumer expects
test('get user profile', () => {
  provider.addInteraction({
    uponReceiving: 'request for user profile',
    withRequest: {
      method: 'GET',
      path: '/api/users/1',
      headers: {
        'Accept': 'application/json'
      }
    },
    willRespondWith: {
      status: 200,
      body: {
        id: 1,
        name: 'Alice',
        email: 'alice@test.com',
        createdAt: '2024-01-01'
      }
    }
  });
  
  // This mock provider runs on http://localhost:8000
  const user = await client.getUser(1);
  expect(user.name).toBe('Alice');
});
```

Generates: `pacts/Consumer-Provider.json`

### Step 2: Provider Verifies

```javascript
// provider.test.js - Does provider match?
test('verify pacts', () => {
  return new Verifier({
    provider: 'Provider',
    providerBaseUrl: 'http://localhost:3000',
    pactUrls: ['./pacts/Consumer-Provider.json']
  }).verifyProvider();
});
```

Runs against real provider, checks all interactions.

## Advanced Patterns

### Using Matchers

```javascript
import { matchers } from '@pact-foundation/pact';
const { uuid, iso8601DateTime } = matchers;

provider.addInteraction({
  willRespondWith: {
    status: 200,
    body: {
      id: uuid('12345678-1234-5678-1234-567812345678'),
      createdAt: iso8601DateTime('2024-01-01T00:00:00Z'),
      name: 'Alice'
    }
  }
});
```

### Provider States

```javascript
provider.addInteraction({
  state: 'user 1 exists',
  uponReceiving: 'request for existing user',
  withRequest: {
    method: 'GET',
    path: '/api/users/1'
  },
  willRespondWith: {
    status: 200,
    body: { id: 1, name: 'Alice' }
  }
});

provider.addInteraction({
  state: 'user not found',
  uponReceiving: 'request for non-existing user',
  withRequest: {
    method: 'GET',
    path: '/api/users/999'
  },
  willRespondWith: {
    status: 404,
    body: { error: 'Not found' }
  }
});
```

### Multiple Interactions

```javascript
test('complete user workflow', () => {
  // Create user
  provider.addInteraction({
    uponReceiving: 'create user request',
    withRequest: {
      method: 'POST',
      path: '/api/users',
      body: { name: 'Bob', email: 'bob@test.com' }
    },
    willRespondWith: {
      status: 201,
      body: { id: 1, name: 'Bob' }
    }
  });
  
  // Get user
  provider.addInteraction({
    uponReceiving: 'get user request',
    withRequest: {
      method: 'GET',
      path: '/api/users/1'
    },
    willRespondWith: {
      status: 200,
      body: { id: 1, name: 'Bob' }
    }
  });
});
```

## Testing Patterns

### Happy Path

```javascript
test('create order successfully', () => {
  provider.addInteraction({
    uponReceiving: 'valid order creation',
    withRequest: {
      method: 'POST',
      path: '/api/orders',
      body: { items: [{ id: 1, qty: 2 }] }
    },
    willRespondWith: {
      status: 201,
      body: { id: 'order-123', total: 100 }
    }
  });
});
```

### Error Path

```javascript
test('handle validation error', () => {
  provider.addInteraction({
    uponReceiving: 'invalid order',
    withRequest: {
      method: 'POST',
      path: '/api/orders',
      body: { items: [] }  // Invalid: empty
    },
    willRespondWith: {
      status: 400,
      body: { error: 'Items required' }
    }
  });
});
```

### Authentication

```javascript
test('authorized request', () => {
  provider.addInteraction({
    uponReceiving: 'request with auth',
    withRequest: {
      method: 'GET',
      path: '/api/admin',
      headers: {
        'Authorization': 'Bearer token123'
      }
    },
    willRespondWith: {
      status: 200,
      body: { admin: true }
    }
  });
});
```

## Pact Broker (Optional)

### Configuration

```javascript
const provider = new Pact({
  consumer: 'WebClient',
  provider: 'UserAPI',
  pactBrokerUrl: 'https://your-broker.com',
  pactBrokerUsername: process.env.PACT_BROKER_USER,
  pactBrokerPassword: process.env.PACT_BROKER_PASS
});
```

### Benefits

- Central repository of contracts
- CI/CD integration
- Team collaboration
- Contract versioning

## Debugging

### View Generated Contract

```bash
cat pacts/*.json | jq
```

Output:
```json
{
  "consumer": { "name": "WebClient" },
  "provider": { "name": "UserAPI" },
  "interactions": [...]
}
```

### Provider Verification Errors

```
Expected:
  GET /api/users/1
  Response: { name: 'Alice' }

Actual:
  GET /api/users/1
  Response: { name: 'alice' }  // Lowercase!
```

Fix provider endpoint to match contract.

## Best Practices

1. **Consumer First** - Consumer defines needs
2. **Use Matchers** - Don't over-specify values
3. **Document States** - Clear preconditions
4. **Test Errors** - 4xx, 5xx paths
5. **Version APIs** - Different versions need contracts
6. **Review Contracts** - Check in version control
7. **Atomic Interactions** - One responsibility each
8. **Clean Up** - Reset handlers after tests

## Workflow Summary

```
1. Consumer writes test
   ↓
2. Contract generated (pacts/*.json)
   ↓
3. Share contract with provider
   ↓
4. Provider verifies contract
   ↓
5. Both teams confident about integration
```

## Next Steps

1. ✅ Write consumer test
2. ✅ Generate contract
3. ✅ Verify with provider
4. ✅ Add provider states
5. ✅ Test error scenarios

## Resources

- [Pact Documentation](https://docs.pact.foundation)
- [Provider Verification](https://docs.pact.foundation/provider)
- [Broker Setup](https://docs.pact.foundation/provider/using-pact-broker)
