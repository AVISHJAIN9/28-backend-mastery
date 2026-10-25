# Database Models - Index

## 28 Modules Overview

### 1. MongoDB & Mongoose Models
- Document database patterns
- Schema validation with Mongoose
- CRUD operations
- Aggregation pipelines
- File: `01-mongodb-mongoose-models/`

### 2. ACID Transactions
- Transaction consistency
- Multi-document transactions
- Atomic operations
- Transaction rollback
- File: `02-acid-transactions/`

### 3. SQL Basic Queries
- SELECT, INSERT, UPDATE, DELETE
- JOIN operations (INNER, LEFT, OUTER)
- GROUP BY aggregation
- ORDER BY sorting
- File: `03-sql-basic-queries/`

### 4. Database Transactions: Commit & Rollback
- Transaction lifecycle
- SAVEPOINT operations
- RollBack procedures
- Connection state
- File: `04-db-transactions-commit-rollback/`

### 5. Supabase PostgreSQL Real-Time
- Real-time subscriptions
- PostgreSQL with REST API
- Event-driven updates
- Authentication integration
- File: `05-supabase-postgres-realtime/`

### 6. Database Migrations: Prisma & Drizzle
- Schema versioning
- Migration creation
- ORM frameworks
- Seed data
- File: `06-db-migrations-prisma-drizzle/`

### 7. Firebase Firestore
- Real-time NoSQL
- Document/collection model
- Offline support
- Security rules
- File: `07-firebase-firestore/`

### 8. Redis Caching & Session Store
- In-memory caching
- Session management
- Key expiration (TTL)
- Pub/Sub messaging
- File: `08-redis-caching-session-store/`

### 9. Vector Databases & Embeddings
- Semantic search
- Vector similarity
- Embedding generation
- RAG systems
- File: `09-vector-db-embeddings/`

### 10. N+1 Query Problem
- Query optimization
- DataLoader pattern
- Batch loading
- Lazy vs eager loading
- File: `10-n-plus-1-query-problem/`

### 11. Relational Schemas & Design
- Entity relationships
- Foreign keys
- Schema normalization
- Referential integrity
- File: `11-relational-schemas-design/`

### 12. Indexes: B-Tree, Composite, Partial
- Index structures
- Query optimization
- Composite indexes
- Partial indexes
- File: `12-indexes-btree-composite-partial/`

### 13. Isolation Levels: Dirty & Phantom Reads
- Concurrency control
- Read phenomena
- Isolation tradeoffs
- Transaction behavior
- File: `13-isolation-levels-dirty-phantom/`

### 14. Deadlock: Causes & Prevention
- Deadlock detection
- Lock ordering
- Timeout handling
- Recovery strategies
- File: `14-deadlock-causes-prevention/`

### 15. EXPLAIN & ANALYZE: Query Plans
- Query execution plans
- Performance metrics
- Join algorithms
- Cost analysis
- File: `15-explain-analyze-query-plans/`

### 16. Database Normalization: 1NF, 2NF, 3NF
- First normal form
- Second normal form
- Third normal form
- Redundancy elimination
- File: `16-db-normalisation-1nf-2nf-3nf/`

### 17. Soft Delete with deleted_at
- Non-destructive deletion
- Data recovery
- Compliance patterns
- Query filtering
- File: `17-soft-delete-deleted-at/`

### 18. ORM vs Raw SQL
- Sequelize patterns
- TypeORM patterns
- Drizzle ORM
- Raw SQL comparisons
- File: `18-orm-vs-raw-sql/`

### 19. Read Replicas: Replication & Failover
- Master-slave replication
- Consistency models
- Automatic failover
- Connection routing
- File: `19-read-replicas/`

### 20. Event Sourcing & CQRS
- Event log patterns
- Command/Query separation
- Event replay
- Audit trails
- File: `20-event-sourcing-cqrs/`

### 21. Row-Level Security (RLS)
- PostgreSQL RLS policies
- Access control
- User context
- Policy enforcement
- File: `21-row-level-security-rls/`

### 22. Connection Pooling: PgBouncer
- Connection management
- Pool modes
- Resource optimization
- Load balancing
- File: `22-connection-pooling-pgbouncer/`

### 23. DynamoDB: AWS NoSQL
- Partition keys
- Global secondary indexes
- Capacity management
- DynamoDB Streams
- File: `23-dynamodb-aws-nosql/`

### 24. Neo4j: Graph Database
- Node-property-relationship model
- Cypher queries
- Path finding
- Recommendations
- File: `24-neo4j-graph-database/`

### 25. Elasticsearch: Search Engine
- Full-text search
- Mapping and analyzers
- Aggregations
- Scoring and relevance
- File: `25-elasticsearch-search-engine/`

### 26. Cassandra: Distributed Columns
- Distributed architecture
- Clustering keys
- Replication
- Consistency levels
- File: `26-cassandra-distributed-columns/`

### 27. Time-Series DB: InfluxDB & TimescaleDB
- Time-indexed data
- Retention policies
- Continuous aggregates
- Metrics collection
- File: `27-timeseries-influx-tsdb/`

### 28. Memcached: Distributed Cache
- Distributed caching
- Consistent hashing
- TTL and eviction
- Cache strategies
- File: `28-memcached-distributed-cache/`

---

## Index by Technology

### SQL Databases
- 03: SQL Basic Queries
- 04: Transactions & Rollback
- 05: Supabase PostgreSQL
- 11: Relational Schemas
- 12: Indexes
- 13: Isolation Levels
- 14: Deadlocks
- 15: Query Plans
- 16: Normalization
- 21: Row-Level Security
- 22: Connection Pooling

### NoSQL & Document
- 01: MongoDB
- 07: Firebase Firestore
- 23: DynamoDB

### High-Performance
- 08: Redis Caching
- 28: Memcached
- 19: Read Replicas

### Specialized
- 09: Vector Databases
- 24: Neo4j (Graph)
- 25: Elasticsearch (Search)
- 26: Cassandra (Distributed)
- 27: Time-Series Databases

### Architectural Patterns
- 02: ACID Transactions
- 06: Migrations
- 10: N+1 Optimization
- 17: Soft Deletes
- 18: ORM vs SQL
- 20: Event Sourcing & CQRS

---

## Index by Use Case

### Building E-Commerce
- 03: SQL queries for product inventory
- 04: Transaction handling for payments
- 12: Indexes for performance
- 15: Query optimization
- 19: Read replicas for scaling
- 22: Connection pooling

### Real-Time Features
- 05: Supabase real-time
- 07: Firebase real-time
- 08: Redis pub/sub
- 20: Event sourcing for state
- 26: Cassandra for distribution

### Search & Discovery
- 09: Vector embeddings
- 24: Neo4j for recommendations
- 25: Elasticsearch for search

### Analytics & Metrics
- 27: Time-series databases
- 25: Elasticsearch aggregations
- 26: Cassandra for scale

### Compliance & Security
- 17: Soft deletes for GDPR
- 21: Row-level security
- 02: Audit with transactions
- 20: Event log for audit trails

---

## Quick Links to Key Patterns

### Database Selection
- For prototyping: 01 MongoDB, 07 Firebase
- For production SQL: 03, 04, 05 PostgreSQL
- For cloud-native: 23 DynamoDB, 07 Firebase
- For distributed: 26 Cassandra, 27 Time-Series
- For search: 25 Elasticsearch, 09 Vector DB
- For relationships: 24 Neo4j

### Performance Optimization
- Caching: 08 Redis, 28 Memcached
- Query optimization: 10 N+1, 12 Indexes, 15 Plans
- Scaling reads: 19 Read Replicas
- Connection efficiency: 22 Connection Pooling

### Schema & Data Design
- Relational design: 11 Schemas, 16 Normalization
- Transactions: 02 ACID, 04 Commit/Rollback
- Soft deletes: 17 deleted_at pattern
- Migrations: 06 Schema versioning

### Advanced Topics
- Event sourcing: 20 CQRS
- Security: 21 Row-Level Security
- Concurrency: 13 Isolation, 14 Deadlocks
- ORM frameworks: 18 ORM vs SQL

---

## Files Structure

Each module follows this pattern:
```
XX-module-name/
├── controller.js       # CRUD implementation
├── middleware.js       # Error handling
├── routes.js          # Express routes
├── schema.js          # Joi validation
├── .env.example       # Configuration
├── README.md          # Full documentation
├── theory.md          # Concepts
├── setup.md           # Installation
├── checklist.md       # Checklist
└── App.jsx            # React component
```

---

## Learning Path

**Beginners:**
1. Start with 03 SQL Basic Queries
2. Learn 02 ACID Transactions
3. Study 12 Indexes
4. Review 15 Query Plans

**Intermediate:**
1. Explore 01 MongoDB
2. Understand 04 Transactions
3. Learn 08 Caching
4. Study 19 Read Replicas

**Advanced:**
1. Implement 20 Event Sourcing
2. Master 26 Cassandra
3. Deploy with 23 DynamoDB
4. Optimize with 25 Elasticsearch

---

**Total Modules:** 28  
**Total Files:** 280  
**Patterns Covered:** 50+  
**Production Ready:** Yes ✓
