# Cassandra: Distributed Columns - Theory & Concepts

## Module Overview
Highly scalable distributed database for big data

**Technologies:** Cassandra, Distributed DB, Scalability  
**Complexity:** Intermediate to Advanced

---

## Key Concepts


### 1. Clustering keys
This concept covers clustering keys patterns and best practices for production systems.


### 2. Replication factor
This concept covers replication factor patterns and best practices for production systems.


### 3. Consistency levels
This concept covers consistency levels patterns and best practices for production systems.


### 4. Compaction
This concept covers compaction patterns and best practices for production systems.


---

## ACID Properties

### Atomicity
- All-or-nothing transaction execution
- Either all operations succeed or all fail
- No partial updates

### Consistency
- Data integrity maintained
- Constraints always satisfied
- Referential integrity preserved

### Isolation
- Transactions don't interfere with each other
- Levels: READ UNCOMMITTED, READ COMMITTED, REPEATABLE READ, SERIALIZABLE
- Prevents dirty reads, phantom reads, non-repeatable reads

### Durability
- Committed data persists
- Survives system failures
- Recovery assured

---

## Advanced Patterns

### Transaction Lifecycle
1. BEGIN: Start transaction
2. EXECUTE: Run SQL operations
3. COMMIT: Make changes permanent
4. ROLLBACK: Revert on error

### Best Practices
- Keep transactions short
- Minimize lock time
- Handle errors gracefully
- Log transaction events
- Monitor for deadlocks
- Use appropriate isolation levels

---

## Common Pitfalls

- Long-running transactions causing locks
- Improper error handling leading to orphaned transactions
- Missing indexes causing performance issues
- Deadlocks from lock ordering violations
- Isolation level misconfigurations

---

## References
- [PostgreSQL Documentation](https://www.postgresql.org/docs/)
- [MongoDB Transactions](https://docs.mongodb.com/manual/core/transactions/)
- [Database ACID Properties](https://en.wikipedia.org/wiki/ACID)
