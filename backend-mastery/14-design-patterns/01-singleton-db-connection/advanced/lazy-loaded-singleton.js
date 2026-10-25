/**
 * ADVANCED: Singleton with Lazy Loading and Destruction
 * 
 * Production-grade singleton with:
 * - Lazy initialization
 * - Proper cleanup/destruction
 * - Thread-safe behavior (in JS context)
 * - Error handling
 */

class AdvancedDatabaseConnection {
  static #instance = null;
  static #isInitializing = false;
  
  #config = null;
  #connected = false;
  #queryCount = 0;
  #connectionTime = null;

  constructor(config = {}) {
    if (AdvancedDatabaseConnection.#instance) {
      throw new Error('Database already initialized. Use getInstance() instead.');
    }

    this.#config = {
      host: config.host || 'localhost',
      port: config.port || 5432,
      timeout: config.timeout || 5000,
      retries: config.retries || 3,
      ...config
    };

    this.#connectionTime = Date.now();
    console.log(`[AdvancedDB] Initialized with config:`, this.#config);
    
    AdvancedDatabaseConnection.#instance = this;
  }

  static async getInstance(config = {}) {
    if (AdvancedDatabaseConnection.#instance) {
      return AdvancedDatabaseConnection.#instance;
    }

    if (AdvancedDatabaseConnection.#isInitializing) {
      throw new Error('Singleton initialization already in progress');
    }

    try {
      AdvancedDatabaseConnection.#isInitializing = true;
      const instance = new AdvancedDatabaseConnection(config);
      await instance.#connect();
      return instance;
    } finally {
      AdvancedDatabaseConnection.#isInitializing = false;
    }
  }

  async #connect() {
    try {
      console.log(`[AdvancedDB] Connecting to ${this.#config.host}:${this.#config.port}`);
      // Simulate connection
      await new Promise(resolve => setTimeout(resolve, 100));
      this.#connected = true;
      console.log('[AdvancedDB] Successfully connected');
    } catch (error) {
      throw new Error(`Failed to connect: ${error.message}`);
    }
  }

  async query(sql) {
    if (!this.#connected) {
      throw new Error('Not connected to database');
    }

    this.#queryCount++;
    console.log(`[AdvancedDB] Query #${this.#queryCount}: ${sql.substring(0, 50)}...`);
    
    // Simulate query
    await new Promise(resolve => setTimeout(resolve, 50));
    
    return {
      success: true,
      queryCount: this.#queryCount,
      executedAt: new Date()
    };
  }

  getStats() {
    return {
      connected: this.#connected,
      queryCount: this.#queryCount,
      uptime: Date.now() - this.#connectionTime,
      config: {
        host: this.#config.host,
        port: this.#config.port
      }
    };
  }

  static async destroy() {
    if (AdvancedDatabaseConnection.#instance) {
      console.log('[AdvancedDB] Destroying singleton instance...');
      AdvancedDatabaseConnection.#instance.#connected = false;
      AdvancedDatabaseConnection.#instance = null;
    }
  }
}

// Usage Example
async function example() {
  try {
    const db = await AdvancedDatabaseConnection.getInstance({
      host: 'postgres.example.com',
      port: 5432
    });

    const result = await db.query('SELECT * FROM users');
    console.log('Query result:', result);
    
    console.log('Stats:', db.getStats());

    // Cleanup
    await AdvancedDatabaseConnection.destroy();
  } catch (error) {
    console.error('Error:', error.message);
  }
}

module.exports = AdvancedDatabaseConnection;
