require('dotenv').config();
const express = require('express');
const cors = require('cors');
const helmet = require('helmet');
const rateLimit = require('express-rate-limit');
const routes = require('./routes');

const app = express();
const HTTP_PORT = process.env.HTTP_PORT || 4015;

// Middleware
app.use(helmet());
app.use(cors({ origin: process.env.ALLOWED_ORIGINS || 'http://localhost:3000', credentials: true }));
app.use(express.json());

// Rate limiting
const loginLimiter = rateLimit({
  windowMs: 15 * 60 * 1000,
  max: 5,
  message: 'Too many login attempts, try again later'
});

const bruteforceLimiter = rateLimit({
  windowMs: 1 * 60 * 1000,
  max: 3,
  message: 'Too many failed attempts, account locked for 1 minute'
});

// Routes
app.use('/auth/login', bruteforceLimiter, routes);
app.use('/auth', loginLimiter, routes);

// Health check
app.get('/health', (req, res) => {
  res.json({ status: 'ok', module: 'Brute Force Lockout', port: HTTP_PORT });
});

// Start server
const server = app.listen(HTTP_PORT, () => {
  console.log(`✓ Brute Force Lockout Module running on http://localhost:${HTTP_PORT}`);
  console.log(`  - Login: POST /auth/login`);
  console.log(`  - Check Status: GET /auth/status`);
  console.log(`  - Unlock: POST /auth/unlock`);
});

process.on('SIGTERM', () => {
  console.log('SIGTERM received, shutting down gracefully');
  server.close(() => {
    console.log('Server closed');
    process.exit(0);
  });
});

module.exports = app;
