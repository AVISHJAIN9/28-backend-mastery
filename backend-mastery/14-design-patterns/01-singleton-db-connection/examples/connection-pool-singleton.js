/**
 * Singleton with Connection Pool
 * 
 * A more realistic singleton that manages a pool of database connections
 * while maintaining a single manager instance.
 */

class DatabasePool {
  static instance = null;
  
  constructor(maxConnections = 5) {
    if (DatabasePool.instance) {
      return DatabasePool.instance;
    }

    this.maxConnections = maxConnections;
    this.connections = [];
    this.availableConnections = [];
    this.activeConnections = new Set();
    this.waitingQueue = [];
    
    // Initialize connection pool
    for (let i = 0; i < maxConnections; i++) {
      const conn = {
        id: `conn_${i}`,
        busy: false,
        createdAt: new Date()
      };
      this.connections.push(conn);
      this.availableConnections.push(conn);
    }

    console.log(`[Pool] Initialized with ${maxConnections} connections`);
    DatabasePool.instance = this;
  }

  static getInstance(maxConnections = 5) {
    if (!DatabasePool.instance) {
      DatabasePool.instance = new DatabasePool(maxConnections);
    }
    return DatabasePool.instance;
  }

  getConnection() {
    if (this.availableConnections.length > 0) {
      const conn = this.availableConnections.pop();
      conn.busy = true;
      this.activeConnections.add(conn.id);
      console.log(`[Pool] Allocated ${conn.id}, Active: ${this.activeConnections.size}`);
      return conn;
    }
    
    console.warn(`[Pool] No available connections, queuing request`);
    return null;
  }

  releaseConnection(conn) {
    if (conn && this.activeConnections.has(conn.id)) {
      conn.busy = false;
      this.activeConnections.delete(conn.id);
      this.availableConnections.push(conn);
      console.log(`[Pool] Released ${conn.id}, Available: ${this.availableConnections.length}`);
    }
  }

  getStatus() {
    return {
      total: this.maxConnections,
      available: this.availableConnections.length,
      active: this.activeConnections.size,
      queued: this.waitingQueue.length
    };
  }
}

// Usage
const pool1 = DatabasePool.getInstance(3);
const pool2 = DatabasePool.getInstance(10); // Returns same instance

console.log('\nPool instances are same:', pool1 === pool2);
console.log('Status:', pool1.getStatus());

const c1 = pool1.getConnection();
const c2 = pool1.getConnection();
console.log('\nAfter getting 2 connections:', pool1.getStatus());

pool1.releaseConnection(c1);
console.log('After releasing 1 connection:', pool1.getStatus());

module.exports = DatabasePool;
