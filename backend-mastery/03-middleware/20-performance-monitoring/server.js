require('dotenv').config();
const express = require('express');
const cors = require('cors');
const helmet = require('helmet');
const { performanceMiddleware } = require('./middleware');
const routes = require('./routes');

const app = express();
const HTTP_PORT = process.env.HTTP_PORT || 4020;

app.use(helmet());
app.use(cors({ origin: process.env.FRONTEND_URL || 'http://localhost:3000' }));
app.use(express.json());
app.use(express.urlencoded({ extended: true }));
app.use(performanceMiddleware);

app.use('/api', routes);

app.get('/health', (req, res) => {
  res.json({
    status: 'ok',
    module: '20 Performance Monitoring',
    port: HTTP_PORT,
    timestamp: new Date().toISOString()
  });
});

app.listen(HTTP_PORT, () => {
  console.log(`Performance Monitoring middleware running on port ${HTTP_PORT}`);
});

module.exports = app;
