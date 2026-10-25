/**
 * ADVANCED: Builder with Validation
 * 
 * Builder that validates at each step.
 */

class ConfigBuilder {
  constructor() {
    this.config = {};
  }

  setHost(host) {
    if (!host || typeof host !== 'string') {
      throw new Error('Invalid host');
    }
    this.config.host = host;
    return this;
  }

  setPort(port) {
    if (port < 1 || port > 65535) {
      throw new Error('Invalid port: 1-65535');
    }
    this.config.port = port;
    return this;
  }

  setDatabase(db) {
    if (!db) throw new Error('Database required');
    this.config.database = db;
    return this;
  }

  build() {
    const required = ['host', 'port', 'database'];
    const missing = required.filter(key => !this.config[key]);
    
    if (missing.length > 0) {
      throw new Error(`Missing required: ${missing.join(', ')}`);
    }

    return this.config;
  }
}

// Usage
try {
  const config = new ConfigBuilder()
    .setHost('localhost')
    .setPort(5432)
    .setDatabase('myapp')
    .build();
  
  console.log('Config:', config);
} catch (error) {
  console.error('Error:', error.message);
}

module.exports = ConfigBuilder;
