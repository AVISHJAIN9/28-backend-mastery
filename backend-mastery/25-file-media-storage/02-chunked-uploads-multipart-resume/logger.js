/**
 * Simple logging utility for the chunked uploads module
 * Supports different log levels and formats
 */

const LOG_LEVELS = {
  error: 0,
  warn: 1,
  info: 2,
  debug: 3
};

const currentLogLevel = LOG_LEVELS[process.env.LOG_LEVEL || 'debug'];
const logFormat = process.env.LOG_FORMAT || 'json';

/**
 * Format log entry
 */
function formatLog(level, message, data = {}) {
  const timestamp = new Date().toISOString();
  
  if (logFormat === 'json') {
    return JSON.stringify({
      timestamp,
      level,
      message,
      ...data
    });
  }

  // Simple text format
  return `[${timestamp}] [${level.toUpperCase()}] ${message} ${Object.keys(data).length > 0 ? JSON.stringify(data) : ''}`;
}

/**
 * Logger object with methods for different log levels
 */
const logger = {
  error: (message, data = {}) => {
    if (currentLogLevel >= LOG_LEVELS.error) {
      console.error(formatLog('error', message, data));
    }
  },

  warn: (message, data = {}) => {
    if (currentLogLevel >= LOG_LEVELS.warn) {
      console.warn(formatLog('warn', message, data));
    }
  },

  info: (message, data = {}) => {
    if (currentLogLevel >= LOG_LEVELS.info) {
      console.log(formatLog('info', message, data));
    }
  },

  debug: (message, data = {}) => {
    if (currentLogLevel >= LOG_LEVELS.debug) {
      console.log(formatLog('debug', message, data));
    }
  }
};

module.exports = logger;
