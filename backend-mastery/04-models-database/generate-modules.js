#!/usr/bin/env node
// Script to generate content for all 28 database modules

const fs = require('fs');
const path = require('path');

const baseDir = '/Users/avishjain/Downloads/backend-mastery/04-models-database';

// Module configurations
const modules = [
  {
    num: '02',
    name: 'acid-transactions',
    title: 'ACID Transactions',
    description: 'Multi-document transactions ensuring atomicity, consistency, isolation, and durability',
    techs: ['MongoDB', 'Transactions', 'Session API'],
    topics: ['Transaction lifecycle', 'Commit/Rollback', 'Isolation levels', 'Conflict resolution']
  },
  {
    num: '03',
    name: 'sql-basic-queries',
    title: 'SQL Basic Queries',
    description: 'Foundational relational database querying with SELECT, INSERT, UPDATE, DELETE and JOINs',
    techs: ['PostgreSQL', 'SQL', 'Relational DB'],
    topics: ['SELECT/INSERT/UPDATE/DELETE', 'JOINs', 'GROUP BY', 'Aggregations']
  },
  {
    num: '04',
    name: 'db-transactions-commit-rollback',
    title: 'DB Transactions: Commit & Rollback',
    description: 'Managing transaction lifecycle in production systems with error handling',
    techs: ['PostgreSQL', 'pg client', 'Connection pooling'],
    topics: ['Transaction boundaries', 'Rollback procedures', 'Error handling', 'Connection state']
  },
  {
    num: '05',
    name: 'supabase-postgres-realtime',
    title: 'Supabase PostgreSQL Real-Time',
    description: 'Real-time database subscriptions and event-driven architecture',
    techs: ['Supabase', 'PostgreSQL', 'Real-time API'],
    topics: ['Real-time listeners', 'Subscriptions', 'Event system', 'Realtime subscriptions']
  },
  {
    num: '06',
    name: 'db-migrations-prisma-drizzle',
    title: 'Database Migrations: Prisma & Drizzle',
    description: 'Schema versioning and evolution with modern ORM frameworks',
    techs: ['Prisma', 'Drizzle', 'Migrations'],
    topics: ['Migration versioning', 'Forward/backward', 'Seed data', 'Rollback strategies']
  },
  {
    num: '07',
    name: 'firebase-firestore',
    title: 'Firebase Firestore',
    description: 'Google\'s real-time NoSQL database with mobile-first design',
    techs: ['Firebase', 'Firestore', 'Real-time'],
    topics: ['Collections/Documents', 'Real-time listeners', 'Offline persistence', 'Security rules']
  },
  {
    num: '08',
    name: 'redis-caching-session-store',
    title: 'Redis Caching & Session Store',
    description: 'In-memory data store for high-performance caching and session management',
    techs: ['Redis', 'Caching', 'In-memory'],
    topics: ['GET/SET operations', 'Sorted sets', 'Session management', 'Cache invalidation']
  },
  {
    num: '09',
    name: 'vector-db-embeddings',
    title: 'Vector Databases & Embeddings',
    description: 'Semantic search and similarity matching with vector embeddings',
    techs: ['Vector DB', 'Embeddings', 'Semantic search'],
    topics: ['Vector embeddings', 'Similarity search', 'Indexing', 'RAG systems']
  },
  {
    num: '10',
    name: 'n-plus-1-query-problem',
    title: 'N+1 Query Problem',
    description: 'Preventing performance degradation from excessive database queries',
    techs: ['DataLoader', 'Query optimization', 'Batch loading'],
    topics: ['N+1 scenarios', 'Batch loading', 'Eager loading', 'Profiling']
  },
  {
    num: '11',
    name: 'relational-schemas-design',
    title: 'Relational Schemas & Design',
    description: 'Structuring data relationships effectively with best practices',
    techs: ['Schema design', 'Foreign keys', 'ERD'],
    topics: ['Relationships', 'Foreign keys', 'One-to-Many', 'Many-to-Many']
  },
  {
    num: '12',
    name: 'indexes-btree-composite-partial',
    title: 'Indexes: B-Tree, Composite, Partial',
    description: 'Creating and maintaining indexes for query optimization',
    techs: ['Indexing', 'B-Tree', 'Query optimization'],
    topics: ['B-Tree structure', 'Composite indexes', 'Partial indexes', 'Query planning']
  },
  {
    num: '13',
    name: 'isolation-levels-dirty-phantom',
    title: 'Isolation Levels: Dirty & Phantom Reads',
    description: 'Understanding transaction isolation and concurrency control',
    techs: ['Isolation levels', 'Concurrency', 'ACID'],
    topics: ['Dirty reads', 'Phantom reads', 'Serializable', 'Lock management']
  },
  {
    num: '14',
    name: 'deadlock-causes-prevention',
    title: 'Deadlock: Causes & Prevention',
    description: 'Handling and preventing transaction deadlocks in production',
    techs: ['Deadlock detection', 'Lock ordering', 'Prevention'],
    topics: ['Deadlock detection', 'Timeout handling', 'Lock ordering', 'Recovery']
  },
  {
    num: '15',
    name: 'explain-analyze-query-plans',
    title: 'EXPLAIN & ANALYZE: Query Plans',
    description: 'Analyzing and optimizing query execution plans',
    techs: ['Query analysis', 'Performance tuning', 'EXPLAIN'],
    topics: ['Execution plans', 'Sequential scan', 'Index scan', 'Cost estimation']
  },
  {
    num: '16',
    name: 'db-normalisation-1nf-2nf-3nf',
    title: 'Database Normalization: 1NF, 2NF, 3NF',
    description: 'Reducing data redundancy through normalization forms',
    techs: ['Normalization', 'Database design', 'Schema theory'],
    topics: ['1NF', '2NF', '3NF', 'Denormalization']
  },
  {
    num: '17',
    name: 'soft-delete-deleted-at',
    title: 'Soft Delete with deleted_at',
    description: 'Non-destructive deletion patterns for data recovery and compliance',
    techs: ['Soft delete', 'Data recovery', 'GDPR compliance'],
    topics: ['Soft delete implementation', 'Timestamps', 'Query filtering', 'Recovery']
  },
  {
    num: '18',
    name: 'orm-vs-raw-sql',
    title: 'ORM vs Raw SQL',
    description: 'Comparing Object-Relational Mapping with raw SQL approaches',
    techs: ['ORM', 'TypeORM', 'Sequelize'],
    topics: ['ORM benefits', 'SQL control', 'Type safety', 'Hybrid approaches']
  },
  {
    num: '19',
    name: 'read-replicas',
    title: 'Read Replicas: Replication & Failover',
    description: 'Scaling read operations with replication and high availability',
    techs: ['Replication', 'Master-slave', 'Failover'],
    topics: ['Master-slave replication', 'Read consistency', 'Failover', 'Replica lag']
  },
  {
    num: '20',
    name: 'event-sourcing-cqrs',
    title: 'Event Sourcing & CQRS',
    description: 'Architectural patterns for complex state management and auditability',
    techs: ['Event sourcing', 'CQRS', 'Event log'],
    topics: ['Event log as source', 'CQRS pattern', 'Event replay', 'Audit trail']
  },
  {
    num: '21',
    name: 'row-level-security-rls',
    title: 'Row-Level Security (RLS)',
    description: 'Fine-grained database access control at the row level',
    techs: ['RLS', 'Security', 'Authorization'],
    topics: ['RLS policies', 'Policy enforcement', 'User context', 'Performance']
  },
  {
    num: '22',
    name: 'connection-pooling-pgbouncer',
    title: 'Connection Pooling: PgBouncer',
    description: 'Managing database connections efficiently in production',
    techs: ['Connection pooling', 'PgBouncer', 'Performance'],
    topics: ['Pool sizing', 'Pool modes', 'Connection recycling', 'Load balancing']
  },
  {
    num: '23',
    name: 'dynamodb-aws-nosql',
    title: 'DynamoDB: AWS NoSQL',
    description: 'Managed NoSQL database service with high scalability',
    techs: ['DynamoDB', 'AWS', 'NoSQL'],
    topics: ['Partition keys', 'Global secondary indexes', 'Capacity units', 'Streams']
  },
  {
    num: '24',
    name: 'neo4j-graph-database',
    title: 'Neo4j: Graph Database',
    description: 'Database optimized for relationship queries and graph algorithms',
    techs: ['Neo4j', 'Graph DB', 'Cypher'],
    topics: ['Nodes and relationships', 'Cypher queries', 'Graph algorithms', 'Recommendations']
  },
  {
    num: '25',
    name: 'elasticsearch-search-engine',
    title: 'Elasticsearch: Search Engine',
    description: 'Distributed search and analytics engine for full-text search',
    techs: ['Elasticsearch', 'Search', 'Analytics'],
    topics: ['Full-text search', 'Inverted indexes', 'Aggregations', 'Relevance scoring']
  },
  {
    num: '26',
    name: 'cassandra-distributed-columns',
    title: 'Cassandra: Distributed Columns',
    description: 'Highly scalable distributed database for big data',
    techs: ['Cassandra', 'Distributed DB', 'Scalability'],
    topics: ['Clustering keys', 'Replication factor', 'Consistency levels', 'Compaction']
  },
  {
    num: '27',
    name: 'timeseries-influx-tsdb',
    title: 'Time-Series DB: InfluxDB & TimescaleDB',
    description: 'Databases optimized for time-indexed data and metrics',
    techs: ['InfluxDB', 'TimescaleDB', 'Time-series'],
    topics: ['Time-series model', 'Retention policies', 'Aggregates', 'Query languages']
  },
  {
    num: '28',
    name: 'memcached-distributed-cache',
    title: 'Memcached: Distributed Cache',
    description: 'Distributed memory caching layer for high performance',
    techs: ['Memcached', 'Caching', 'Distribution'],
    topics: ['Distributed cache', 'Key hashing', 'TTL', 'LRU eviction']
  }
];

// Generate content for a module
function generateTheory(module) {
  return `# ${module.title} - Theory & Concepts

## Module Overview
${module.description}

**Technologies:** ${module.techs.join(', ')}  
**Complexity:** Intermediate to Advanced

---

## Key Concepts

${module.topics.map((topic, i) => `
### ${i + 1}. ${topic}
This concept covers ${topic.toLowerCase()} patterns and best practices for production systems.
`).join('\n')}

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
`;
}

function generateReadme(module) {
  return `# Module ${module.num}: ${module.title}

## Overview
${module.description}

**Complexity:** Intermediate to Advanced  
**Time to Learn:** 2-3 hours  
**Technologies:** ${module.techs.join(', ')}

---

## Key Concepts

${module.topics.map(topic => `- ${topic}`).join('\n')}

---

## Project Structure

\`\`\`
${module.num}-${module.name}/
├── controller.js       # Business logic
├── routes.js          # API endpoints
├── middleware.js      # Error handling
├── schema.js          # Validation schemas
├── server.js          # Express setup
├── App.jsx            # React testing UI
├── package.json       # Dependencies
├── .env.example       # Environment template
├── setup.md           # Installation guide
└── theory.md          # Concepts
\`\`\`

---

## Setup

### 1. Install Dependencies
\`\`\`bash
npm install
\`\`\`

### 2. Configure Environment
\`\`\`bash
cp .env.example .env
\`\`\`

Edit \`.env\` with your settings

### 3. Start Server
\`\`\`bash
npm start
\`\`\`

Server runs on \`http://localhost:${5100 + parseInt(module.num)}\`

---

## API Endpoints

### Create Resource
\`\`\`http
POST /api/resources
Content-Type: application/json

{ "name": "Example", "description": "Test resource" }
\`\`\`

### Get All Resources
\`\`\`http
GET /api/resources?page=1&limit=10
\`\`\`

### Get Single Resource
\`\`\`http
GET /api/resources/:id
\`\`\`

### Update Resource
\`\`\`http
PUT /api/resources/:id
Content-Type: application/json

{ "name": "Updated" }
\`\`\`

### Delete Resource
\`\`\`http
DELETE /api/resources/:id
\`\`\`

---

## Code Examples

See \`setup.md\` for detailed examples and \`theory.md\` for conceptual explanations.

---

## Best Practices

1. Always handle errors gracefully
2. Validate input before database operations
3. Use connection pooling
4. Monitor query performance
5. Implement appropriate logging
6. Test edge cases thoroughly
7. Document important patterns

---

## Common Issues

| Issue | Solution |
|-------|----------|
| Connection refused | Check database URL and credentials |
| Timeout errors | Increase timeout values |
| Query slow | Add indexes to frequently queried fields |
| Connection pool exhaustion | Increase pool size |
| Memory usage high | Check for connection leaks |

---

## Next Steps

1. Read \`theory.md\` for conceptual understanding
2. Follow \`setup.md\` for installation
3. Test API endpoints using the React UI
4. Review code examples in \`controller.js\`
5. Experiment and modify code

---

## Resources

- [Theory Documentation](./theory.md)
- [Setup Guide](./setup.md)
- [API Implementation](./controller.js)
- [Validation Schema](./schema.js)

---

## Testing

The \`App.jsx\` component provides an interactive UI for testing all endpoints. Access at \`http://localhost:3000\`.

---

## Checklists

### Initial Setup
- [ ] Dependencies installed
- [ ] Environment variables configured
- [ ] Database running
- [ ] Server starting without errors
- [ ] API responding

### Development
- [ ] CRUD operations working
- [ ] Error handling tested
- [ ] Input validation working
- [ ] Performance acceptable
- [ ] Logging functioning

### Production
- [ ] All tests passing
- [ ] Error handling robust
- [ ] Monitoring in place
- [ ] Performance optimized
- [ ] Documentation complete
`;
}

function generateSetup(module) {
  return `# Setup & Installation Guide - ${module.title}

## Prerequisites

- Node.js 14+
- npm or yarn
- Required database/service running
- 2GB RAM minimum

---

## Step 1: Install Dependencies

\`\`\`bash
cd ${module.num}-${module.name}
npm install
\`\`\`

**Dependencies installed:**
- express
- mongoose (or relevant driver)
- joi
- helmet
- cors
- dotenv
- winston

---

## Step 2: Configure Environment

Create \`.env\` from template:

\`\`\`bash
cp .env.example .env
\`\`\`

Edit \`.env\` with your configuration:

\`\`\`env
HTTP_PORT=${5100 + parseInt(module.num)}
NODE_ENV=development
FRONTEND_URL=http://localhost:3000
DATABASE_URL=your_database_connection_string
LOG_LEVEL=info
\`\`\`

---

## Step 3: Setup Database

### Option A: Local Installation
[Database-specific instructions]

### Option B: Docker
\`\`\`bash
docker run -d -p 5432:5432 postgres:latest
\`\`\`

### Option C: Cloud Service
Use your cloud provider's managed database service

---

## Step 4: Initialize Database

\`\`\`bash
npm run init-db
\`\`\`

This creates sample data and indexes.

---

## Step 5: Start Server

\`\`\`bash
npm start
\`\`\`

Expected output:
\`\`\`
✓ Database connection established
✓ Server running on http://localhost:${5100 + parseInt(module.num)}
✓ Routes registered
\`\`\`

---

## Step 6: Test API

### Using curl
\`\`\`bash
curl http://localhost:${5100 + parseInt(module.num)}/api/health
\`\`\`

### Using Python
\`\`\`python
import requests
r = requests.get('http://localhost:${5100 + parseInt(module.num)}/api/resources')
print(r.json())
\`\`\`

---

## Troubleshooting

### Connection Refused
- Verify database is running
- Check connection string
- Verify credentials

### Port Already in Use
\`\`\`bash
# Find process using port
lsof -i :${5100 + parseInt(module.num)}
# Kill process
kill -9 <PID>
\`\`\`

### Timeout Errors
- Increase timeout in .env
- Check database performance
- Monitor network connectivity

---

## Advanced Configuration

### Connection Pooling
\`\`\`env
DATABASE_POOL_SIZE=20
DATABASE_POOL_TIMEOUT=5000
\`\`\`

### Logging
\`\`\`env
LOG_LEVEL=debug
LOG_FILE=./logs/app.log
\`\`\`

---

## Next Steps

1. ✓ Environment setup complete
2. ✓ Database configured
3. ✓ Server running
4. **Next**: Read \`theory.md\` for concepts
5. **Then**: Explore API in README.md
6. **Finally**: Run React UI tests

---

## Support

- Check logs for error details
- Review theory.md for concepts
- Consult README.md for API docs
- Test with provided React UI
`;
}

function generateController(module) {
  return `// ==================== ${module.title} Controller ====================
// Module ${module.num}: ${module.description}

class DatabaseController {
  // CREATE: Insert new record
  static async create(req, res) {
    try {
      const data = req.body;
      
      // TODO: Implement create logic based on module specifics
      // - Validate input using Joi schema
      // - Execute database operation
      // - Handle transaction if needed
      // - Return created record
      
      res.status(201).json({
        message: 'Resource created successfully',
        data
      });
    } catch (error) {
      console.error('Create error:', error);
      res.status(500).json({ error: 'Failed to create resource', details: error.message });
    }
  }

  // READ: Get all records
  static async getAll(req, res) {
    try {
      const { page = 1, limit = 10 } = req.query;
      
      // TODO: Implement read logic
      // - Query database with pagination
      // - Apply filters if provided
      // - Sort results appropriately
      // - Return with pagination metadata
      
      res.json({
        data: [],
        pagination: {
          page: parseInt(page),
          limit: parseInt(limit),
          total: 0
        }
      });
    } catch (error) {
      console.error('GetAll error:', error);
      res.status(500).json({ error: 'Failed to fetch resources', details: error.message });
    }
  }

  // GET BY ID
  static async getById(req, res) {
    try {
      const { id } = req.params;
      
      // TODO: Implement getById logic
      // - Validate ID format
      // - Query single record
      // - Return 404 if not found
      
      res.json({ data: null });
    } catch (error) {
      console.error('GetById error:', error);
      res.status(500).json({ error: 'Failed to fetch resource', details: error.message });
    }
  }

  // UPDATE
  static async update(req, res) {
    try {
      const { id } = req.params;
      const data = req.body;
      
      // TODO: Implement update logic
      // - Validate ID and input
      // - Check record exists
      // - Update database
      // - Return updated record
      
      res.json({
        message: 'Resource updated successfully',
        data
      });
    } catch (error) {
      console.error('Update error:', error);
      res.status(500).json({ error: 'Failed to update resource', details: error.message });
    }
  }

  // DELETE
  static async delete(req, res) {
    try {
      const { id } = req.params;
      
      // TODO: Implement delete logic
      // - Validate ID
      // - Delete record
      // - Return deleted record
      
      res.json({
        message: 'Resource deleted successfully'
      });
    } catch (error) {
      console.error('Delete error:', error);
      res.status(500).json({ error: 'Failed to delete resource', details: error.message });
    }
  }

  // STATS: Get database statistics
  static async stats(req, res) {
    try {
      const stats = {
        totalRecords: 0,
        recentUpdates: 0,
        activeRecords: 0
      };
      
      res.json(stats);
    } catch (error) {
      console.error('Stats error:', error);
      res.status(500).json({ error: 'Failed to fetch stats', details: error.message });
    }
  }
}

module.exports = DatabaseController;
`;
}

// Write files for each module
console.log('Generating content for modules 02-28...\n');

modules.forEach(module => {
  const modulePath = path.join(baseDir, module.num + '-' + module.name);
  
  // Generate theory.md
  fs.writeFileSync(
    path.join(modulePath, 'theory.md'),
    generateTheory(module)
  );
  console.log('✓ Generated theory.md for module ' + module.num);
  
  // Generate README.md
  fs.writeFileSync(
    path.join(modulePath, 'README.md'),
    generateReadme(module)
  );
  console.log('✓ Generated README.md for module ' + module.num);
  
  // Generate setup.md
  fs.writeFileSync(
    path.join(modulePath, 'setup.md'),
    generateSetup(module)
  );
  console.log('✓ Generated setup.md for module ' + module.num);
  
  // Generate controller.js
  fs.writeFileSync(
    path.join(modulePath, 'controller.js'),
    generateController(module)
  );
  console.log('✓ Generated controller.js for module ' + module.num);
});

console.log('\n✓ All modules generated successfully!');
