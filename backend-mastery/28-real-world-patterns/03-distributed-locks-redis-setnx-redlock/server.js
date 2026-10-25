require('dotenv').config();
const express = require('express');
const cors = require('cors');
const helmet = require('helmet');
const winston = require('winston');
const routes = require('./routes');
const { errorHandler } = require('./middleware');

const app = express();
const HTTP_PORT = process.env.HTTP_PORT || 4003;

// Logger setup
const logger = winston.createLogger({
  level: 'info',
  format: winston.format.json(),
  transports: [
    new winston.transports.Console(),
    new winston.transports.File({ filename: 'error.log', level: 'error' }),
    new winston.transports.File({ filename: 'combined.log' })
  ]
});

// Middleware
app.use(helmet());
app.use(cors({
  origin: process.env.ALLOWED_ORIGINS?.split(',') || '*',
  credentials: true
}));
app.use(express.json());

// Logging middleware
app.use((req, res, next) => {
  logger.info(`${req.method} ${req.path}`, {
    timestamp: new Date(),
    body: req.body
  });
  next();
});

// Routes
app.use('/api', routes);

// Health check
app.get('/health', (req, res) => {
  res.json({ 
    status: 'ok',
    module: 'Distributed Locks (Redis SETNX & Redlock)',
    port: HTTP_PORT,
    timestamp: new Date()
  });
});

// Error handling
app.use(errorHandler);

// Start server
app.listen(HTTP_PORT, () => {
  logger.info(`Server running on port ${HTTP_PORT}`);
  console.log(`
╔═══════════════════════════════════════════════╗
║         DISTRIBUTED LOCKS MODULE 03           ║
║        Redis SETNX & Redlock Pattern          ║
╚═══════════════════════════════════════════════╝

📍 Server: http://localhost:${HTTP_PORT}

🔒 SETNX Atomic Lock (Single Instance)
  POST ${HTTP_PORT}/api/secure/process-transaction

🔐 Redlock (Multi-Instance)
  POST ${HTTP_PORT}/api/advanced/batch-payment
  POST ${HTTP_PORT}/api/advanced/allocate-resource

⚠️  VULNERABLE (No Lock - Race Condition)
  POST ${HTTP_PORT}/api/vulnerable/process-transaction

📊 View Status
  GET ${HTTP_PORT}/api/secure/transactions
  GET ${HTTP_PORT}/api/vulnerable/transactions

🧹 Clear Data
  POST ${HTTP_PORT}/api/clear

🔗 Frontend: http://localhost:5173
  `);
});

module.exports = app;
