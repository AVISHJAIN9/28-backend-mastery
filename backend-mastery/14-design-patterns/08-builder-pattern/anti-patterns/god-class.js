/**
 * ANTI-PATTERN: God Class (No Builder)
 * 
 * Complex object construction embedded in one massive class.
 */

class ConfigBad {
  constructor(data) {
    this.host = data.host || 'localhost';
    this.port = data.port || 3000;
    this.ssl = data.ssl || false;
    this.database = data.database || 'mydb';
    this.dbUser = data.dbUser || 'user';
    this.dbPass = data.dbPass || 'pass';
    this.logging = data.logging || false;
    this.caching = data.caching || false;
    this.cache_ttl = data.cache_ttl || 3600;
    this.workers = data.workers || 4;
    this.timeout = data.timeout || 5000;
    // ... and on and on
  }
}

console.log('=== ANTI-PATTERN: God Class ===\n');
console.log('✗ Constructor takes massive config object');
console.log('✗ Hard to understand what\'s required vs optional');
console.log('✗ Can\'t validate configuration step by step');
console.log('✗ No fluent/chaining interface');

module.exports = ConfigBad;
