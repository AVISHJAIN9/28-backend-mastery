require('dotenv').config();
const express = require('express');
const cors = require('cors');
const helmet = require('helmet');
const routes = require('./routes');

const app = express();
const HTTP_PORT = process.env.HTTP_PORT || 4016;

app.use(helmet());
app.use(cors({ origin: process.env.FRONTEND_URL || 'http://localhost:3000' }));
app.use(express.json());
app.use(express.urlencoded({ extended: true }));

app.use('/api', routes);

app.get('/health', (req, res) => {
  res.json({
    status: 'ok',
    module: '16 Rate Limiting',
    port: HTTP_PORT,
    timestamp: new Date().toISOString()
  });
});

app.get('/', (req, res) => {
  res.json({
    name: '16 Rate Limiting',
    module: '03-middleware - 16',
    description: 'Rate limiting middleware to prevent abuse',
    version: '1.0.0',
    endpoints: {
      health: '/health',
      info: '/api/info',
      test: '/api/test'
    }
  });
});

app.listen(HTTP_PORT, () => {
  console.log(`Rate Limiting middleware running on port ${HTTP_PORT}`);
});

module.exports = app;
