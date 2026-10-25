require('dotenv').config();
const express = require('express');
const cors = require('cors');
const helmet = require('helmet');
const rateLimit = require('express-rate-limit');
const routes = require('./routes');

const app = express();
const HTTP_PORT = process.env.HTTP_PORT || 4010;

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

// Routes
app.use('/auth', loginLimiter, routes);

// Health check
app.get('/health', (req, res) => {
  res.json({ status: 'ok', module: 'Refresh Token Rotation & Family', port: HTTP_PORT });
});

// Start server
const server = app.listen(HTTP_PORT, () => {
  console.log(`✓ Refresh Token Rotation & Family Module running on http://localhost:${HTTP_PORT}`);
  console.log(`  - Login: POST /auth/login`);
  console.log(`  - Refresh: POST /auth/refresh`);
  console.log(`  - Me: GET /auth/me`);
  console.log(`  - Logout: POST /auth/logout`);
});

process.on('SIGTERM', () => {
  console.log('SIGTERM received, shutting down gracefully');
  server.close(() => {
    console.log('Server closed');
    process.exit(0);
  });
});

module.exports = app;
