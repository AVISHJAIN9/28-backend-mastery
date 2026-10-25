#!/usr/bin/env node
// Generate preview.html files for all 28 modules

const fs = require('fs');
const path = require('path');

const baseDir = '/Users/avishjain/Downloads/backend-mastery/04-models-database';

function generatePreviewHTML(moduleNum, moduleName, moduleTitle) {
  return `<!DOCTYPE html>
<html lang="en">
<head>
  <meta charset="UTF-8">
  <meta name="viewport" content="width=device-width, initial-scale=1.0">
  <title>${moduleTitle} - Preview</title>
  <style>
    * {
      margin: 0;
      padding: 0;
      box-sizing: border-box;
    }
    
    body {
      font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, Oxygen, Ubuntu, sans-serif;
      background: linear-gradient(135deg, #667eea 0%, #764ba2 100%);
      min-height: 100vh;
      padding: 40px 20px;
    }
    
    .container {
      max-width: 800px;
      margin: 0 auto;
      background: white;
      border-radius: 10px;
      box-shadow: 0 20px 60px rgba(0, 0, 0, 0.3);
      overflow: hidden;
    }
    
    .header {
      background: linear-gradient(135deg, #667eea 0%, #764ba2 100%);
      color: white;
      padding: 40px;
      text-align: center;
    }
    
    .header h1 {
      font-size: 2.5em;
      margin-bottom: 10px;
      text-shadow: 2px 2px 4px rgba(0, 0, 0, 0.2);
    }
    
    .header p {
      font-size: 1.1em;
      opacity: 0.95;
    }
    
    .content {
      padding: 40px;
    }
    
    .module-info {
      margin-bottom: 30px;
    }
    
    .module-info h2 {
      color: #333;
      margin-bottom: 15px;
      font-size: 1.5em;
      border-bottom: 2px solid #667eea;
      padding-bottom: 10px;
    }
    
    .info-row {
      margin: 10px 0;
      padding: 10px;
      background: #f5f5f5;
      border-left: 4px solid #667eea;
    }
    
    .info-row strong {
      color: #667eea;
      min-width: 100px;
      display: inline-block;
    }
    
    .links {
      display: grid;
      grid-template-columns: repeat(auto-fit, minmax(150px, 1fr));
      gap: 10px;
      margin-bottom: 30px;
    }
    
    .link-btn {
      display: inline-block;
      padding: 10px;
      background: #667eea;
      color: white;
      text-decoration: none;
      border-radius: 5px;
      text-align: center;
      transition: all 0.3s ease;
      font-weight: 500;
    }
    
    .link-btn:hover {
      background: #764ba2;
      transform: translateY(-2px);
      box-shadow: 0 5px 15px rgba(102, 126, 234, 0.4);
    }
    
    .endpoints {
      background: #f9f9f9;
      border: 1px solid #e0e0e0;
      border-radius: 5px;
      padding: 20px;
      margin: 20px 0;
    }
    
    .endpoints h3 {
      color: #333;
      margin-bottom: 15px;
    }
    
    .endpoint {
      margin: 10px 0;
      padding: 8px;
      background: white;
      border-left: 4px solid #667eea;
      font-family: 'Courier New', monospace;
      font-size: 0.9em;
    }
    
    .method {
      display: inline-block;
      padding: 3px 8px;
      border-radius: 3px;
      font-weight: bold;
      margin-right: 10px;
      font-size: 0.85em;
    }
    
    .get { background: #61affe; color: white; }
    .post { background: #49cc90; color: white; }
    .put { background: #fca130; color: white; }
    .delete { background: #f93e3e; color: white; }
    
    .footer {
      background: #f5f5f5;
      padding: 20px;
      text-align: center;
      color: #666;
      border-top: 1px solid #e0e0e0;
    }
    
    .footer a {
      color: #667eea;
      text-decoration: none;
    }
    
    .footer a:hover {
      text-decoration: underline;
    }
    
    .status {
      display: inline-block;
      background: #49cc90;
      color: white;
      padding: 5px 10px;
      border-radius: 20px;
      font-size: 0.85em;
      font-weight: bold;
    }
    
    @media (max-width: 600px) {
      .header h1 {
        font-size: 1.5em;
      }
      .content {
        padding: 20px;
      }
      .links {
        grid-template-columns: 1fr;
      }
    }
  </style>
</head>
<body>
  <div class="container">
    <div class="header">
      <h1>Module ${moduleNum}: ${moduleTitle}</h1>
      <p>Database Patterns & Best Practices</p>
      <span class="status">Ready to Use</span>
    </div>
    
    <div class="content">
      <div class="module-info">
        <h2>📚 Documentation</h2>
        <div class="links">
          <a href="./theory.md" class="link-btn">📖 Theory</a>
          <a href="./README.md" class="link-btn">📘 README</a>
          <a href="./setup.md" class="link-btn">⚙️ Setup</a>
          <a href="./controller.js" class="link-btn">💻 Code</a>
        </div>
      </div>
      
      <div class="module-info">
        <h2>🚀 Quick Start</h2>
        <div class="info-row">
          <strong>1. Install:</strong> Run <code>npm install</code>
        </div>
        <div class="info-row">
          <strong>2. Configure:</strong> Edit <code>.env</code> file
        </div>
        <div class="info-row">
          <strong>3. Start:</strong> Run <code>npm start</code>
        </div>
        <div class="info-row">
          <strong>4. Test:</strong> Access the React UI
        </div>
      </div>
      
      <div class="module-info">
        <h2>🔌 API Endpoints</h2>
        <div class="endpoints">
          <h3>Available Operations</h3>
          <div class="endpoint">
            <span class="method post">POST</span> /api/resources - Create new resource
          </div>
          <div class="endpoint">
            <span class="method get">GET</span> /api/resources - Get all resources
          </div>
          <div class="endpoint">
            <span class="method get">GET</span> /api/resources/:id - Get single resource
          </div>
          <div class="endpoint">
            <span class="method put">PUT</span> /api/resources/:id - Update resource
          </div>
          <div class="endpoint">
            <span class="method delete">DELETE</span> /api/resources/:id - Delete resource
          </div>
          <div class="endpoint">
            <span class="method get">GET</span> /api/stats - Get statistics
          </div>
        </div>
      </div>
      
      <div class="module-info">
        <h2>📋 Module Details</h2>
        <div class="info-row">
          <strong>Module Number:</strong> ${moduleNum}
        </div>
        <div class="info-row">
          <strong>Folder:</strong> <code>${moduleNum}-${moduleName}</code>
        </div>
        <div class="info-row">
          <strong>Default Port:</strong> ${5100 + parseInt(moduleNum)}
        </div>
        <div class="info-row">
          <strong>Frontend URL:</strong> <code>http://localhost:3000</code>
        </div>
      </div>
      
      <div class="module-info">
        <h2>✅ Checklist</h2>
        <div class="info-row">
          ✓ Dependencies configured
        </div>
        <div class="info-row">
          ✓ Documentation complete
        </div>
        <div class="info-row">
          ✓ API endpoints ready
        </div>
        <div class="info-row">
          ✓ React UI included
        </div>
        <div class="info-row">
          ✓ Error handling implemented
        </div>
      </div>
    </div>
    
    <div class="footer">
      <p>Module ${moduleNum} - ${moduleTitle}</p>
      <p><small>Backend Mastery Database Series</small></p>
      <p><small>Last generated: ${new Date().toISOString()}</small></p>
    </div>
  </div>
</body>
</html>
`;
}

const modules = [
  { num: '01', name: 'mongodb-mongoose-models', title: 'MongoDB & Mongoose Models' },
  { num: '02', name: 'acid-transactions', title: 'ACID Transactions' },
  { num: '03', name: 'sql-basic-queries', title: 'SQL Basic Queries' },
  { num: '04', name: 'db-transactions-commit-rollback', title: 'DB Transactions: Commit & Rollback' },
  { num: '05', name: 'supabase-postgres-realtime', title: 'Supabase PostgreSQL Real-Time' },
  { num: '06', name: 'db-migrations-prisma-drizzle', title: 'Database Migrations: Prisma & Drizzle' },
  { num: '07', name: 'firebase-firestore', title: 'Firebase Firestore' },
  { num: '08', name: 'redis-caching-session-store', title: 'Redis Caching & Session Store' },
  { num: '09', name: 'vector-db-embeddings', title: 'Vector Databases & Embeddings' },
  { num: '10', name: 'n-plus-1-query-problem', title: 'N+1 Query Problem' },
  { num: '11', name: 'relational-schemas-design', title: 'Relational Schemas & Design' },
  { num: '12', name: 'indexes-btree-composite-partial', title: 'Indexes: B-Tree, Composite, Partial' },
  { num: '13', name: 'isolation-levels-dirty-phantom', title: 'Isolation Levels: Dirty & Phantom Reads' },
  { num: '14', name: 'deadlock-causes-prevention', title: 'Deadlock: Causes & Prevention' },
  { num: '15', name: 'explain-analyze-query-plans', title: 'EXPLAIN & ANALYZE: Query Plans' },
  { num: '16', name: 'db-normalisation-1nf-2nf-3nf', title: 'Database Normalization: 1NF, 2NF, 3NF' },
  { num: '17', name: 'soft-delete-deleted-at', title: 'Soft Delete with deleted_at' },
  { num: '18', name: 'orm-vs-raw-sql', title: 'ORM vs Raw SQL' },
  { num: '19', name: 'read-replicas', title: 'Read Replicas: Replication & Failover' },
  { num: '20', name: 'event-sourcing-cqrs', title: 'Event Sourcing & CQRS' },
  { num: '21', name: 'row-level-security-rls', title: 'Row-Level Security (RLS)' },
  { num: '22', name: 'connection-pooling-pgbouncer', title: 'Connection Pooling: PgBouncer' },
  { num: '23', name: 'dynamodb-aws-nosql', title: 'DynamoDB: AWS NoSQL' },
  { num: '24', name: 'neo4j-graph-database', title: 'Neo4j: Graph Database' },
  { num: '25', name: 'elasticsearch-search-engine', title: 'Elasticsearch: Search Engine' },
  { num: '26', name: 'cassandra-distributed-columns', title: 'Cassandra: Distributed Columns' },
  { num: '27', name: 'timeseries-influx-tsdb', title: 'Time-Series DB: InfluxDB & TimescaleDB' },
  { num: '28', name: 'memcached-distributed-cache', title: 'Memcached: Distributed Cache' }
];

console.log('Generating preview.html files for all 28 modules...\n');

modules.forEach(module => {
  const modulePath = path.join(baseDir, module.num + '-' + module.name);
  const previewPath = path.join(modulePath, 'preview.html');
  
  fs.writeFileSync(
    previewPath,
    generatePreviewHTML(module.num, module.name, module.title)
  );
  console.log('✓ Generated preview.html for module ' + module.num);
});

console.log('\n✓ All preview.html files generated successfully!');
