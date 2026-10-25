/**
 * ADVANCED: Singleton with Dependency Injection
 * 
 * A more testable singleton pattern that accepts dependencies.
 * Useful for mocking in tests while maintaining singleton behavior.
 */

class TestableDatabaseSingleton {
  static #instance = null;

  constructor(adapter = null) {
    if (TestableDatabaseSingleton.#instance) {
      return TestableDatabaseSingleton.#instance;
    }

    this.adapter = adapter || new RealDatabaseAdapter();
    this.queryLog = [];
    console.log(`[TestableDB] Initialized with ${this.adapter.constructor.name}`);
    
    TestableDatabaseSingleton.#instance = this;
  }

  static getInstance(adapter = null) {
    if (!TestableDatabaseSingleton.#instance) {
      TestableDatabaseSingleton.#instance = new TestableDatabaseSingleton(adapter);
    }
    return TestableDatabaseSingleton.#instance;
  }

  async query(sql) {
    const result = await this.adapter.execute(sql);
    this.queryLog.push({ sql, timestamp: Date.now(), result });
    return result;
  }

  getQueryLog() {
    return this.queryLog;
  }

  static resetForTesting() {
    TestableDatabaseSingleton.#instance = null;
  }
}

class RealDatabaseAdapter {
  async execute(sql) {
    // Real database call
    await new Promise(resolve => setTimeout(resolve, 100));
    return { rows: [], affected: 0 };
  }
}

class MockDatabaseAdapter {
  async execute(sql) {
    // Mock for testing
    return { rows: [{ id: 1, name: 'Test' }], affected: 1 };
  }
}

// Testing Example
async function testExample() {
  console.log('\n=== TESTING WITH MOCK ===');
  
  // Use mock for tests
  TestableDatabaseSingleton.resetForTesting();
  const mockDb = TestableDatabaseSingleton.getInstance(new MockDatabaseAdapter());
  
  const result = await mockDb.query('SELECT * FROM users');
  console.log('Mock result:', result);
  console.log('Query log:', mockDb.getQueryLog());
}

module.exports = { TestableDatabaseSingleton, MockDatabaseAdapter, RealDatabaseAdapter };
