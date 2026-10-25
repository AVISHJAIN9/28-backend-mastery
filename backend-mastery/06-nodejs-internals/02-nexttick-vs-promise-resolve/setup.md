# nextTick vs Promise - Setup & Testing

## Installation

```bash
npm init -y
npm install --save-dev mocha chai
```

## Running Examples

```bash
node controller.js
npm test
```

## Test Scenarios

1. Execution order with both
2. Multiple nextTick calls
3. Promise chaining
4. Mixed nextTick and Promises
5. Starvation scenarios

## Understanding Output

Run examples and observe:
- Order of console.log outputs
- Timing differences
- Priority handling
- Edge cases
