const express = require('express');
const cors = require('cors');
const bodyParser = require('body-parser');
require('dotenv').config();

const app = express();
const PORT = process.env.HTTP_PORT || 4004;

// Middleware
app.use(cors({ origin: 'http://localhost:3000', credentials: true }));
app.use(bodyParser.json());
app.use(bodyParser.urlencoded({ extended: true }));

// Routes
const routes = require('./routes');
app.use('/', routes);

// Health check
app.get('/health', (req, res) => {
  res.json({ status: 'OK', port: PORT });
});

// 404 handler
app.use((req, res) => {
  res.status(404).json({ error: 'Not found' });
});

// Start server
app.listen(PORT, () => {
  console.log(`Feature Flags Server running on http://localhost:${PORT}`);
});

module.exports = app;