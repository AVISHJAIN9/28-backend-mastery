const logger = require('winston').createLogger({
  level: 'info',
  format: require('winston').format.json(),
  transports: [new (require('winston').transports.Console)()]
});

const EventEmitter = require('events');

// In-memory configuration storage
const config = {
  development: {
    database_url: 'mongodb://localhost:27017/dev_db',
    redis_url: 'redis://localhost:6379',
    api_timeout: 5000,
    max_retries: 3,
    cache_ttl: 300,
    log_level: 'debug',
    rate_limit_requests: 500,
    rate_limit_window: 60000
  },
  staging: {
    database_url: 'mongodb://staging.company.com:27017/staging_db',
    redis_url: 'redis://staging.company.com:6379',
    api_timeout: 8000,
    max_retries: 5,
    cache_ttl: 600,
    log_level: 'info',
    rate_limit_requests: 1000,
    rate_limit_window: 60000
  },
  production: {
    database_url: 'mongodb://prod.company.com:27017/prod_db',
    redis_url: 'redis://prod.company.com:6379',
    api_timeout: 10000,
    max_retries: 5,
    cache_ttl: 3600,
    log_level: 'warn',
    rate_limit_requests: 5000,
    rate_limit_window: 60000
  }
};

// Config change listeners
const configEmitter = new EventEmitter();
const configChangeLog = [];

/**
 * VULNERABLE: Hardcoded configuration
 */
const getConfigVulnerable = (req, res) => {
  try {
    const hardcodedConfig = {
      database_url: 'mongodb://hardcoded.com/db',
      api_timeout: 5000,
      debug: process.env.NODE_ENV !== 'production',
      warning: 'Config hardcoded in code. Changes require redeploy.'
    };

    logger.warn('VULNERABLE: Hardcoded config accessed', { source: req.path });

    return res.json({
      config: hardcodedConfig,
      method: 'hardcoded',
      message: 'Configuration is hardcoded. Redeploy required to change.'
    });
  } catch (error) {
    logger.error('Config fetch failed', { error: error.message });
    res.status(500).json({ error: 'Config fetch failed' });
  }
};

/**
 * SECURE: Get configuration with hot-reload support
 */
const getConfigSecure = (req, res) => {
  try {
    const environment = process.env.NODE_ENV || 'development';
    const { key } = req.query;

    const envConfig = config[environment];

    if (!envConfig) {
      logger.warn('Environment not found', { environment });
      return res.status(404).json({ error: `Environment '${environment}' not configured` });
    }

    if (key) {
      const value = envConfig[key];
      if (value === undefined) {
        return res.status(404).json({ error: `Config key '${key}' not found` });
      }
      return res.json({ key, value, environment });
    }

    logger.info('Config retrieved', { environment, keys: Object.keys(envConfig) });

    return res.json({
      environment,
      config: envConfig,
      method: 'database',
      hot_reload_enabled: true,
      message: 'Dynamic configuration with hot-reload support'
    });
  } catch (error) {
    logger.error('Config retrieval failed', { error: error.message });
    res.status(500).json({ error: 'Config retrieval failed' });
  }
};

/**
 * Update configuration (hot-reload)
 */
const updateConfig = (req, res) => {
  try {
    const environment = process.env.NODE_ENV || 'development';
    const updates = req.body;

    if (!config[environment]) {
      return res.status(400).json({ error: `Environment '${environment}' not found` });
    }

    const oldConfig = { ...config[environment] };

    // Apply updates
    Object.keys(updates).forEach(key => {
      config[environment][key] = updates[key];
    });

    // Log change
    const changeEntry = {
      timestamp: new Date(),
      environment,
      changes: updates,
      previous: oldConfig
    };
    configChangeLog.push(changeEntry);

    // Emit event for listeners
    configEmitter.emit('config-changed', {
      environment,
      changes: updates,
      timestamp: new Date()
    });

    logger.info('Configuration updated', {
      environment,
      changes: Object.keys(updates),
      subscribers_notified: configEmitter.listenerCount('config-changed')
    });

    return res.json({
      success: true,
      environment,
      updated_keys: Object.keys(updates),
      new_config: config[environment],
      message: 'Configuration updated (no restart required!)'
    });
  } catch (error) {
    logger.error('Config update failed', { error: error.message });
    res.status(500).json({ error: 'Config update failed' });
  }
};

/**
 * Validate configuration
 */
const validateConfig = (req, res) => {
  try {
    const { key, value } = req.body;

    const validators = {
      database_url: (v) => /^mongodb:\/\//.test(v),
      redis_url: (v) => /^redis:\/\//.test(v),
      api_timeout: (v) => typeof v === 'number' && v > 0,
      max_retries: (v) => typeof v === 'number' && v >= 0,
      cache_ttl: (v) => typeof v === 'number' && v >= 0,
      log_level: (v) => ['debug', 'info', 'warn', 'error'].includes(v),
      rate_limit_requests: (v) => typeof v === 'number' && v > 0
    };

    if (!validators[key]) {
      return res.status(400).json({ error: `Unknown config key: '${key}'` });
    }

    const isValid = validators[key](value);

    logger.info('Config validation', { key, value, valid: isValid });

    return res.json({
      key,
      value,
      valid: isValid,
      message: isValid ? 'Config valid' : `Invalid value for '${key}'`
    });
  } catch (error) {
    logger.error('Config validation failed', { error: error.message });
    res.status(500).json({ error: 'Validation failed' });
  }
};

/**
 * Get configuration history (change log)
 */
const getConfigHistory = (req, res) => {
  try {
    const { limit, offset, environment } = req.query;

    let history = configChangeLog;
    if (environment) {
      history = history.filter(entry => entry.environment === environment);
    }

    const paged = history.slice(offset, offset + limit);

    logger.info('Config history retrieved', { total: history.length, limit, offset });

    return res.json({
      changes: paged,
      total: history.length,
      limit,
      offset
    });
  } catch (error) {
    logger.error('History retrieval failed', { error: error.message });
    res.status(500).json({ error: 'History retrieval failed' });
  }
};

/**
 * Get specific environment config
 */
const getEnvironmentConfig = (req, res) => {
  try {
    const { id } = req.params;

    if (!config[id]) {
      return res.status(404).json({ error: `Environment '${id}' not found` });
    }

    return res.json({
      environment: id,
      config: config[id],
      change_count: configChangeLog.filter(c => c.environment === id).length
    });
  } catch (error) {
    logger.error('Environment config fetch failed', { error: error.message });
    res.status(500).json({ error: 'Fetch failed' });
  }
};

/**
 * List all environments
 */
const listEnvironments = (req, res) => {
  try {
    const environments = Object.keys(config).map(env => ({
      name: env,
      config_keys: Object.keys(config[env]).length,
      recent_changes: configChangeLog.filter(c => c.environment === env).length
    }));

    return res.json({
      environments,
      total: environments.length
    });
  } catch (error) {
    logger.error('List environments failed', { error: error.message });
    res.status(500).json({ error: 'List failed' });
  }
};

/**
 * Subscribe to config changes (SSE - Server-Sent Events)
 */
const subscribeToConfigChanges = (req, res) => {
  try {
    // Set headers for SSE
    res.setHeader('Content-Type', 'text/event-stream');
    res.setHeader('Cache-Control', 'no-cache');
    res.setHeader('Connection', 'keep-alive');

    logger.info('Config change subscriber connected');

    // Send initial connection message
    res.write('data: {"message":"Connected to config change stream"}\n\n');

    // Handler for config changes
    const configChangeHandler = (data) => {
      res.write(`data: ${JSON.stringify(data)}\n\n`);
    };

    configEmitter.on('config-changed', configChangeHandler);

    // Client disconnect
    req.on('close', () => {
      configEmitter.removeListener('config-changed', configChangeHandler);
      logger.info('Config change subscriber disconnected');
      res.end();
    });
  } catch (error) {
    logger.error('SSE subscription failed', { error: error.message });
    res.status(500).json({ error: 'Subscription failed' });
  }
};

/**
 * Get config diff between environments
 */
const getConfigDiff = (req, res) => {
  try {
    const { from, to } = req.query;

    if (!config[from] || !config[to]) {
      return res.status(404).json({ error: 'One or both environments not found' });
    }

    const configFrom = config[from];
    const configTo = config[to];
    const diff = {};

    // Find differences
    const allKeys = new Set([...Object.keys(configFrom), ...Object.keys(configTo)]);

    for (const key of allKeys) {
      const val1 = configFrom[key];
      const val2 = configTo[key];

      if (val1 !== val2) {
        diff[key] = {
          [from]: val1,
          [to]: val2
        };
      }
    }

    return res.json({
      from,
      to,
      differences: diff,
      diff_count: Object.keys(diff).length
    });
  } catch (error) {
    logger.error('Config diff failed', { error: error.message });
    res.status(500).json({ error: 'Diff failed' });
  }
};

/**
 * Clear all config change history
 */
const clearConfigHistory = (req, res) => {
  try {
    const count = configChangeLog.length;
    configChangeLog.length = 0;

    logger.info('Config history cleared', { count });

    return res.json({
      success: true,
      cleared_entries: count,
      message: 'Configuration history cleared'
    });
  } catch (error) {
    logger.error('History clear failed', { error: error.message });
    res.status(500).json({ error: 'Clear failed' });
  }
};

module.exports = {
  getConfigVulnerable,
  getConfigSecure,
  updateConfig,
  validateConfig,
  getConfigHistory,
  getEnvironmentConfig,
  listEnvironments,
  subscribeToConfigChanges,
  getConfigDiff,
  clearConfigHistory,
  logger,
  configEmitter
};
