# Module 21: Testing & Assertions - Checklist

## Assert Module Setup
- [ ] Import assert module
- [ ] Understand basic truthiness checks
- [ ] Learn strictEqual vs equal
- [ ] Know deepStrictEqual for objects
- [ ] Understand throws/doesNotThrow

## Assertion Methods
- [ ] assert(value, message)
- [ ] strictEqual(actual, expected)
- [ ] deepStrictEqual(obj1, obj2)
- [ ] throws(fn, errorType)
- [ ] doesNotThrow(fn)
- [ ] match(string, regex)
- [ ] rejects(promise)
- [ ] doesNotReject(promise)

## Testing Patterns
- [ ] Input validation pattern
- [ ] Type checking pattern
- [ ] State verification pattern
- [ ] Async testing pattern
- [ ] Error handling pattern

## Test Organization
- [ ] Create test suite class
- [ ] Implement test runner
- [ ] Add before/after hooks
- [ ] Use describe blocks
- [ ] Group related tests

## Error Messages
- [ ] Write clear assertion messages
- [ ] Include context in messages
- [ ] Use stack traces
- [ ] Debug failed assertions
- [ ] Log relevant state

## Common Patterns
- [ ] Boundary testing
- [ ] Type validation
- [ ] Deep object comparison
- [ ] Exception verification
- [ ] Async/await testing

## API Endpoints
- [ ] POST /api/tests/basic-assertions
- [ ] POST /api/tests/type-assertions
- [ ] POST /api/tests/deep-equality
- [ ] POST /api/tests/array-assertions
- [ ] POST /api/tests/throw-assertions
- [ ] POST /api/tests/range-assertions
- [ ] POST /api/tests/conditional-assertions
- [ ] GET /api/tests/run-suite
- [ ] GET /health
- [ ] GET /

## Best Practices
- [ ] Always use strictEqual
- [ ] Test one thing per assertion
- [ ] Provide helpful messages
- [ ] Clean up after tests
- [ ] Document test purpose

## Deployment
- [ ] .env.example configured
- [ ] PORT set to 3021
- [ ] Dependencies installed
- [ ] Server starts: npm start
- [ ] Tests run: npm test
