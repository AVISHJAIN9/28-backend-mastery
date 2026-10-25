const express = require('express');
const cors = require('cors');
require('dotenv').config();

const { errorHandler } = require('./middleware');
const routes = require('./routes');

const app = express();
const PORT = process.env.HTTP_PORT || 4006;

// Middleware
app.use(cors());
app.use(express.json());

// Routes
app.use(routes);

// Error handler
app.use(errorHandler);

// 404 handler
app.use((req, res) => {
  res.status(404).json({ error: 'Not found' });
});

// Start server
app.listen(PORT, () => {
  console.log(`✓ Seeding & Fixtures server running on http://localhost:${PORT}`);
  console.log(`  GET  /api/health - Health check`);
  console.log(`  POST /api/secure/seed - Generate seed data`);
  console.log(`  POST /api/secure/seed/run - Run specific seeder`);
  console.log(`  POST /api/secure/seed/fixture - Load fixture data`);
});

module.exports = app;
