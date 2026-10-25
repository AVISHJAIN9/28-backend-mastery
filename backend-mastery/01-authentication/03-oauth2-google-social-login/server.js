require('dotenv').config();
const express = require('express');
const cors = require('cors');
const helmet = require('helmet');
const rateLimit = require('express-rate-limit');
const routes = require('./routes');

const app = express();
const HTTP_PORT = process.env.HTTP_PORT || 4003;

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
  res.json({ status: 'ok', module: 'OAuth2 Google Social Login', port: HTTP_PORT });
});

// Start server
const server = app.listen(HTTP_PORT, () => {
  console.log(`✓ OAuth2 Google Social Login Module running on http://localhost:${HTTP_PORT}`);
  console.log(`  - Google Auth: POST /auth/google`);
  console.log(`  - Callback: GET /auth/google/callback`);
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
