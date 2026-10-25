/**
 * Basic Singleton Pattern - Database Connection
 * 
 * The simplest form of singleton: a class that ensures only one instance exists
 * and provides global access to that single instance.
 */

class DatabaseConnection {
  static instance = null;

  constructor() {
    if (DatabaseConnection.instance) {
      return DatabaseConnection.instance;
    }
    
    this.connectionId = Math.random();
    this.connectedAt = new Date();
    console.log(`[DB] New connection created: ${this.connectionId}`);
    
    DatabaseConnection.instance = this;
  }

  static getInstance() {
    if (!DatabaseConnection.instance) {
      DatabaseConnection.instance = new DatabaseConnection();
    }
    return DatabaseConnection.instance;
  }

  query(sql) {
    return {
      id: this.connectionId,
      sql: sql,
      timestamp: new Date(),
      result: 'mocked result'
    };
  }

  getStatus() {
    return {
      isConnected: true,
      connectionId: this.connectionId,
      connectedSince: this.connectedAt
    };
  }
}

// Usage Example
const db1 = new DatabaseConnection();
const db2 = DatabaseConnection.getInstance();
const db3 = new DatabaseConnection();

console.log('db1 === db2:', db1 === db2); // true
console.log('db2 === db3:', db2 === db3); // true
console.log('Same instance ID:', db1.connectionId === db2.connectionId); // true

module.exports = DatabaseConnection;
