# Contract Testing with Pact - Theory

## What is Contract Testing?

Contract testing verifies that independent services can interact correctly without coupling to implementation details. A "contract" documents the expected request/response between consumer and provider.

### Why Not Integration Testing?

```
Integration Test:
┌─────────────┐      HTTP       ┌─────────────┐
│  Consumer   │─────────────────│  Provider   │
│   (real)    │                 │   (real)    │
└─────────────┘                 └─────────────┘
   Slow, needs both services running

Contract Test:
┌─────────────┐      CONTRACT    ┌─────────────┐
│  Consumer   │  (agreement)    │  Provider   │
│   (real)    │                 │   (mock)    │
└─────────────┘                 └─────────────┘
   Fast, only consumer runs
   Provider can verify separately
```

### Benefits

- **Fast** - No real backend needed
- **Parallel** - Test independently
- **Catches Breakage** - Before deployment
- **Documentation** - Contracts show API
- **Confidence** - Both sides tested

## Pact Workflow

### 1. Consumer Test (Creates Contract)

```javascript
// consumer.test.js
import { Pact } from '@pact-foundation/pact';

const provider = new Pact({
  consumer: 'WeatherClient',
  provider: 'WeatherService'
});

test('should get weather', async () => {
  provider.addInteraction({
    state: 'weather for London exists',
    uponReceiving: 'a request for weather',
    withRequest: {
      method: 'GET',
      path: '/api/weather',
      query: { city: 'London' }
    },
    willRespondWith: {
      status: 200,
      body: {
        city: 'London',
        temp: 15,
        humid: 70
      }
    }
  });

  const weather = await client.getWeather('London');
  expect(weather.city).toBe('London');
});

afterAll(() => provider.finalize()); // Writes contract to file
```

### 2. Provider Verification

```javascript
// provider.pact.test.js
import { Verifier } from '@pact-foundation/pact';

test('should validate consumer contract', async () => {
  const opts = {
    provider: 'WeatherService',
    providerBaseUrl: 'http://localhost:3000',
    pactUrls: ['./pacts/WeatherClient-WeatherService.json']
  };
  
  return new Verifier(opts).verifyProvider();
});
```

## Contract File Example

```json
{
  "consumer": { "name": "WeatherClient" },
  "provider": { "name": "WeatherService" },
  "interactions": [
    {
      "description": "a request for weather",
      "request": {
        "method": "GET",
        "path": "/api/weather",
        "query": { "city": "London" }
      },
      "response": {
        "status": 200,
        "body": {
          "city": "London",
          "temp": 15
        }
      }
    }
  ]
}
```

## Advanced Patterns

### Provider States

States document preconditions:

```javascript
provider.addInteraction({
  state: 'user 123 exists and is admin',
  uponReceiving: 'a request to delete user 456',
  withRequest: {
    method: 'DELETE',
    path: '/api/users/456',
    headers: { 'Authorization': 'Bearer token' }
  },
  willRespondWith: {
    status: 200,
    body: { success: true }
  }
});
```

### Matchers (Flexible Contracts)

```javascript
import { matchers } from '@pact-foundation/pact';
const { uuid, iso8601DateTime, arrayContaining } = matchers;

provider.addInteraction({
  uponReceiving: 'a user exists',
  willRespondWith: {
    status: 200,
    body: {
      id: uuid('12345678-1234-5678-1234-567812345678'),
      createdAt: iso8601DateTime('2024-01-01T00:00:00Z'),
      roles: arrayContaining(['admin'])
    }
  }
});
```

### Multiple Interactions

```javascript
test('should handle full workflow', async () => {
  // Create
  provider.addInteraction({
    uponReceiving: 'create user request',
    withRequest: { method: 'POST', path: '/api/users', body: {...} },
    willRespondWith: { status: 201, body: { id: 1 } }
  });
  
  // Read
  provider.addInteraction({
    uponReceiving: 'get user request',
    withRequest: { method: 'GET', path: '/api/users/1' },
    willRespondWith: { status: 200, body: { id: 1, name: 'Alice' } }
  });
  
  // Update
  provider.addInteraction({
    uponReceiving: 'update user request',
    withRequest: { method: 'PUT', path: '/api/users/1', body: {...} },
    willRespondWith: { status: 200 }
  });
  
  // Delete
  provider.addInteraction({
    uponReceiving: 'delete user request',
    withRequest: { method: 'DELETE', path: '/api/users/1' },
    willRespondWith: { status: 204 }
  });
});
```

## Pact Broker

Pact Broker stores contracts and enables:

- **Central Repository** - All contracts in one place
- **Versioning** - Track changes over time
- **CI/CD Integration** - Fail deployments if contracts broken
- **Team Collaboration** - Multiple services coordinate

```javascript
const provider = new Pact({
  consumer: 'WeatherClient',
  provider: 'WeatherService',
  pactBrokerUrl: 'https://broker.example.com'
});
```

## Best Practices

1. **Test Realistic Scenarios** - Not just happy path
2. **Use Matchers** - Don't over-specify
3. **Document States** - Clear preconditions
4. **Handle Errors** - 4xx and 5xx responses
5. **Version APIs** - Different versions need different tests
6. **Atomic Contracts** - One responsibility per interaction
7. **CI/CD Integration** - Run on every commit
8. **Consumer Driven** - Consumer defines needs
9. **Keep Contracts Fresh** - Remove old unused contracts
10. **Monitor Failures** - Track which services broke

## Common Mistakes

### ❌ Over-Coupling

```javascript
// BAD - too specific
provider.addInteraction({
  willRespondWith: {
    body: {
      id: 123,        // exact ID
      name: 'Alice',  // exact name
      age: 30         // exact age
    }
  }
});

// GOOD - use matchers
provider.addInteraction({
  willRespondWith: {
    body: {
      id: uuid(),
      name: fromProviderState(), // from state
      age: integer()
    }
  }
});
```

### ❌ Missing Error Cases

```javascript
// BAD - only happy path
provider.addInteraction({ willRespondWith: { status: 200 } });

// GOOD - include errors
provider.addInteraction({ willRespondWith: { status: 200 } });
provider.addInteraction({ willRespondWith: { status: 400 } });
provider.addInteraction({ willRespondWith: { status: 401 } });
```

### ❌ Ignoring Provider States

```javascript
// BAD - no state
provider.addInteraction({
  uponReceiving: 'delete user',
  willRespondWith: { status: 204 }
});

// GOOD - state documented
provider.addInteraction({
  state: 'user 123 exists and is deletable',
  uponReceiving: 'delete user',
  willRespondWith: { status: 204 }
});
```

## Conclusion

Contract testing bridges the gap between isolated unit tests and full integration tests. It allows services to develop independently while providing confidence that they can interoperate correctly.
