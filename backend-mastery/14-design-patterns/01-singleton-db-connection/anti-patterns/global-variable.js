/**
 * ANTI-PATTERN: Global Variable (Poor Man's Singleton)
 * 
 * Using a global variable instead of a proper singleton pattern.
 * Problems: namespace pollution, testing difficulty, implicit dependencies
 */

// BAD: Global variable
let globalDb = null;

function getGlobalDb() {
  if (!globalDb) {
    globalDb = {
      id: Math.random(),
      queries: 0
    };
    console.log('[GLOBAL] Created global database object');
  }
  return globalDb;
}

// PROBLEM: Implicit dependency
function processUser(userId) {
  const db = getGlobalDb(); // Hidden dependency on global
  db.queries++;
  console.log(`Processing user ${userId} with connection ${db.id}`);
  return { userId, db: db.id, query: db.queries };
}

// PROBLEM: Testing is difficult
function executeQueries() {
  return procesUser(1) + processUser(2) + processUser(3);
}

console.log('=== ANTI-PATTERN: Global Variable ===\n');
console.log(processUser(1));
console.log(processUser(2));

console.log('\nPROBLEMS:');
console.log('✗ Hidden dependencies - not clear what getGlobalDb() does');
console.log('✗ Testing nightmare - can\'t easily mock or replace db');
console.log('✗ Namespace pollution - "globalDb" is in global scope');
console.log('✗ Race conditions - multiple parts of code modify same global');
console.log('✗ Memory never cleaned up - global reference persists');

module.exports = { getGlobalDb, processUser };
