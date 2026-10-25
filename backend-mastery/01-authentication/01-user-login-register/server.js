require('dotenv').config();
const express = require('express');
const cors = require('cors');
const helmet = require('helmet');
const rateLimit = require('express-rate-limit');
const path = require('path');
const routes = require('./routes');
const apiRoutes = require('./api-routes');

const app = express();
const HTTP_PORT = process.env.HTTP_PORT || 4001;

// Middleware
app.use(helmet());
app.use(cors({ origin: '*', credentials: false }));
app.use(express.json());

// Root route - serve dashboard
app.get('/', (req, res) => {
  res.sendFile(path.join(__dirname, 'dashboard.html'));
});

// Full access route
app.get('/fullaccess', (req, res) => {
  res.sendFile(path.join(__dirname, 'fullaccess.html'));
});

// Mobile explorer route
app.get('/explorer', (req, res) => {
  res.sendFile(path.join(__dirname, 'explorer.html'));
});

// Login/Auth route
app.get('/auth', (req, res) => {
  res.sendFile(path.join(__dirname, 'index.html'));
});
app.use('/api', apiRoutes);

// Static files (after custom routes)
app.use(express.static(__dirname, { index: false }));

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
  res.json({ status: 'ok', module: 'User Login & Register', port: HTTP_PORT });
});

// Start server
const server = app.listen(HTTP_PORT, '0.0.0.0', () => {
  console.log(`\n✓ Backend Mastery Portal running on http://0.0.0.0:${HTTP_PORT}\n`);
  console.log('📱 Access Points:');
  console.log(`  - Dashboard: /`);
  console.log(`  - Full Access: /fullaccess`);
  console.log(`  - Login: /login`);
  console.log(`  - API Modules: /api/modules`);
  console.log(`  - Health: /health\n`);
});

process.on('SIGTERM', () => {
  console.log('SIGTERM received, shutting down gracefully');
  server.close(() => {
    console.log('Server closed');
    process.exit(0);
  });
});

module.exports = app;
