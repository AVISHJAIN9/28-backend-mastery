# Child Processes - spawn, exec, fork

## What You'll Learn

- spawn() for streaming
- exec() for simple commands
- execFile() for efficiency
- fork() for Node process IPC
- Error handling and cleanup

## Module Contents

- **theory.md**: All 4 methods explained
- **controller.js**: Practical examples
- **setup.md**: Integration patterns
- **checklist.md**: Implementation guide

## Method Comparison

| Method | Use Case | Output |
|--------|----------|--------|
| spawn | Large/streaming | Events |
| exec | Simple commands | Buffer |
| execFile | No shell needed | Buffer |
| fork | Node-to-Node | IPC |

## Common Use Cases

- Running system commands
- External scripts/programs
- Data processing
- Worker processes
