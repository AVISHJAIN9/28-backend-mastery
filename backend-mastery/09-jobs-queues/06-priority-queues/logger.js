const fs = require('fs');
const path = require('path');

const logDir = path.join(__dirname, 'logs');
if (!fs.existsSync(logDir)) {
  fs.mkdirSync(logDir, { recursive: true });
}

const logger = {
  info: (message, data) => {
    const timestamp = new Date().toISOString();
    const logEntry = JSON.stringify({ timestamp, level: 'INFO', message, ...data });
    fs.appendFileSync(path.join(logDir, 'app.log'), logEntry + '\n');
  },
  error: (message, data) => {
    const timestamp = new Date().toISOString();
    const logEntry = JSON.stringify({ timestamp, level: 'ERROR', message, ...data });
    fs.appendFileSync(path.join(logDir, 'error.log'), logEntry + '\n');
    console.error(`❌ ${message}`, data);
  },
  warn: (message, data) => {
    const timestamp = new Date().toISOString();
    const logEntry = JSON.stringify({ timestamp, level: 'WARN', message, ...data });
    fs.appendFileSync(path.join(logDir, 'app.log'), logEntry + '\n');
    console.warn(`⚠️ ${message}`, data);
  }
};

module.exports = logger;
