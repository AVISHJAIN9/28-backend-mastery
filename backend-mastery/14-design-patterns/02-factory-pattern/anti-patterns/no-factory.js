/**
 * ANTI-PATTERN: No Factory - Direct Instantiation
 * 
 * Creating objects directly without factory.
 * Problems: tight coupling, hard to extend, scattered creation logic
 */

class MySQLDB {
  connect() { return 'MySQL connected'; }
}

class PostgreSQL {
  connect() { return 'PostgreSQL connected'; }
}

// BAD: Direct instantiation everywhere
function initializeDatabaseBad(type) {
  let db;
  
  if (type === 'mysql') {
    db = new MySQLDB();
  } else if (type === 'postgres') {
    db = new PostgreSQL();
  } else {
    throw new Error('Unknown type');
  }
  
  return db;
}

// PROBLEMS with this approach:
console.log('=== ANTI-PATTERN: No Factory ===\n');

// 1. Code duplication
function setupDatabase1(type) {
  if (type === 'mysql') return new MySQLDB();
  else return new PostgreSQL();
}

function setupDatabase2(type) {
  if (type === 'mysql') return new MySQLDB();
  else return new PostgreSQL();
}

// 2. Hard to add new types - must modify multiple places
// 3. Testing is difficult - must mock different classes

console.log('✗ Same if/else logic scattered in multiple functions');
console.log('✗ Adding new database type requires changing many files');
console.log('✗ Tight coupling between client code and concrete classes');
console.log('✗ Violates Open/Closed Principle');

module.exports = { initializeDatabaseBad };
