# process.nextTick vs Promise.resolve()

## What You'll Learn

- Difference between nextTick and Promises
- Execution order and timing
- Use cases for each
- Performance implications
- Real-world scenarios

## Module Contents

- **theory.md**: nextTick vs Promises theory
- **controller.js**: Comparison examples
- **setup.md**: Testing setup
- **checklist.md**: Verification steps

## Quick Comparison

| Feature | nextTick | Promise |
|---------|----------|---------|
| Queue | nextTick Q | Microtask Q |
| Priority | Higher | Lower |
| Speed | Immediate | After nextTick |
| Use | Error handlers | General async |

## Key Concepts

- Microtask queue between event loop phases
- process.nextTick highest priority
- Both before macrotasks
- Common mistakes and how to avoid them
