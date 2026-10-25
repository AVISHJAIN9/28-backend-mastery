/**
 * ANTI-PATTERN: Multiple Database Connections (No Singleton)
 * 
 * This demonstrates what happens when you DON'T use singleton pattern.
 * Each time you need a connection, you create a new one = memory waste, resource leak
 */

class BadDatabaseConnection {
  constructor() {
    // No singleton check - every instantiation creates a new connection
    this.connectionId = Math.random();
    this.connectedAt = new Date();
    console.log(`[BAD] New connection created: ${this.connectionId}`);
    // In real life, this would consume system resources, open sockets, etc.
  }

  query(sql) {
    return {
      connectionId: this.connectionId,
      sql: sql,
      result: 'query result'
    };
  }
}

// PROBLEM: Creating multiple connections
console.log('=== ANTI-PATTERN: Multiple Connections ===\n');

const badDb1 = new BadDatabaseConnection();
const badDb2 = new BadDatabaseConnection();
const badDb3 = new BadDatabaseConnection();

console.log('\nAre they the same instance?');
console.log('badDb1 === badDb2:', badDb1 === badDb2); // FALSE - Problem!
console.log('badDb2 === badDb3:', badDb2 === badDb3); // FALSE - Problem!

console.log('\nEach has different connection ID:');
console.log('badDb1.connectionId:', badDb1.connectionId);
console.log('badDb2.connectionId:', badDb2.connectionId);
console.log('badDb3.connectionId:', badDb3.connectionId);

console.log('\nCONSEQUENCES:');
console.log('✗ Memory waste: 3 separate connection objects');
console.log('✗ Resource leak: 3 open database sockets');
console.log('✗ Inconsistency: Queries may go to different connections');
console.log('✗ Connection pool exhaustion: Quickly runs out of available connections');

module.exports = BadDatabaseConnection;
