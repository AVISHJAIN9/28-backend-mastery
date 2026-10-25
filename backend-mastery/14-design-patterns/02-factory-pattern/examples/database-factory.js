/**
 * Factory Pattern Examples - Basic Factory
 * 
 * Creates objects without specifying their exact classes.
 * The factory decides which class to instantiate based on parameters.
 */

// Product classes
class MySQLConnection {
  constructor(config) {
    this.type = 'MySQL';
    this.host = config.host;
    this.port = config.port || 3306;
  }

  connect() {
    return `Connected to MySQL at ${this.host}:${this.port}`;
  }

  query(sql) {
    return `MySQL executing: ${sql}`;
  }
}

class PostgreSQLConnection {
  constructor(config) {
    this.type = 'PostgreSQL';
    this.host = config.host;
    this.port = config.port || 5432;
  }

  connect() {
    return `Connected to PostgreSQL at ${this.host}:${this.port}`;
  }

  query(sql) {
    return `PostgreSQL executing: ${sql}`;
  }
}

class MongoDBConnection {
  constructor(config) {
    this.type = 'MongoDB';
    this.host = config.host;
    this.port = config.port || 27017;
  }

  connect() {
    return `Connected to MongoDB at ${this.host}:${this.port}`;
  }

  query(sql) {
    return `MongoDB executing: ${sql}`;
  }
}

// Factory
class DatabaseFactory {
  static createConnection(type, config) {
    switch (type.toLowerCase()) {
      case 'mysql':
        return new MySQLConnection(config);
      case 'postgresql':
      case 'postgres':
        return new PostgreSQLConnection(config);
      case 'mongodb':
        return new MongoDBConnection(config);
      default:
        throw new Error(`Unknown database type: ${type}`);
    }
  }
}

// Usage
const mysqlDb = DatabaseFactory.createConnection('mysql', { host: 'localhost' });
const postgresDb = DatabaseFactory.createConnection('postgresql', { host: 'localhost' });
const mongoDb = DatabaseFactory.createConnection('mongodb', { host: 'localhost' });

console.log(mysqlDb.connect());
console.log(postgresDb.connect());
console.log(mongoDb.connect());

module.exports = DatabaseFactory;
