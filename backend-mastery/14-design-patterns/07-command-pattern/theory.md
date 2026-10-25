# Command Pattern: Encapsulating Requests

## What is the Command Pattern?

The **Command Pattern** is a behavioral design pattern that encapsulates a request as an object, thereby letting you parameterize clients with different requests, queue requests, and support undoable operations.

## Key Characteristics

1. **Request Encapsulation** - Wrap request in an object
2. **Separation** - Decouple object sending request from object receiving it
3. **Queueing** - Queue commands for later execution
4. **Undo/Redo** - Support reverting operations
5. **Logging** - Log all executed commands

## Real-World Analogy

Restaurant order:
- Customer writes order on paper (command)
- Waiter carries order to kitchen (invoker)
- Chef executes the order (receiver)
- Order can be queued for later
- Can undo if needed before execution

## Why Use Command Pattern?

### 1. **Decouple Sender from Receiver**
Sender doesn't know details of receiver.

### 2. **Queue Commands**
Store commands for later execution.

### 3. **Undo/Redo Operations**
Revert or repeat actions.

### 4. **Logging and Auditing**
Log all executed commands.

### 5. **Macros and Scripts**
Compose commands into sequences.

## Command Execution

```javascript
const command = new CreateUserCommand(userData);
command.execute();   // Do operation
command.undo();      // Revert operation
```

## Common Use Cases

1. **Undo/Redo** - Text editors, design tools
2. **Task Queues** - Background job processing
3. **Transactions** - Database operations
4. **Macros** - Keyboard shortcuts, automation
5. **Logs** - Audit trails, command history
6. **Scheduled Tasks** - Run commands at specific times

## Benefits

1. **Flexibility** - Add new commands without changing existing code
2. **Decoupling** - Loose coupling between invoker and receiver
3. **Undo/Redo** - Easy to support reverting operations
4. **Composition** - Combine commands into macros
5. **Queueing** - Process commands asynchronously
6. **Logging** - Track all operations performed

## Real-World Examples

- **Text Editors** - Undo/redo functionality
- **Version Control** - Commit operations
- **Job Queues** - Background processing
- **Remote Controls** - Button command queueing
- **Database Transactions** - BEGIN, COMMIT, ROLLBACK
- **API Webhooks** - Queued async operations

## Conclusion

Command Pattern is essential for:
- Decoupling request sender from receiver
- Supporting undo/redo operations
- Queuing and asynchronous execution
- Logging and auditing operations
