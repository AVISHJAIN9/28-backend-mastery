# Database Transactions Theory

## ACID Properties
- **Atomicity**: All-or-nothing, no partial updates
- **Consistency**: Maintain data validity rules
- **Isolation**: Concurrent operations don't interfere
- **Durability**: Committed data survives failures

## Isolation Levels
- **Read Uncommitted**: Dirty reads allowed (fastest)
- **Read Committed**: Dirty reads prevented
- **Repeatable Read**: Phantom reads possible
- **Serializable**: Complete isolation (slowest)

## Common Issues
- **Deadlock**: Circular wait on resources
- **Dirty Read**: Reading uncommitted data
- **Phantom Read**: New rows appear mid-transaction
- **Lost Update**: Overwriting concurrent changes
