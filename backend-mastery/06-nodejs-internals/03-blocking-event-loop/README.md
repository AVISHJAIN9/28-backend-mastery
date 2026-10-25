# Blocking the Event Loop

## What You'll Learn

- What causes event loop blocking
- How to detect blocking operations
- Solutions and patterns
- Performance impact
- Production monitoring

## Module Contents

- **theory.md**: Blocking causes and solutions
- **controller.js**: Detection and examples
- **setup.md**: Measurement setup
- **checklist.md**: Optimization checklist

## Common Blocking Operations

- Large synchronous loops
- Expensive computations
- Sync file operations
- Heavy JSON parsing
- Crypto operations

## Solutions Covered

- Breaking work into chunks
- setImmediate deferral
- Worker threads
- Async/await patterns
- Stream usage
