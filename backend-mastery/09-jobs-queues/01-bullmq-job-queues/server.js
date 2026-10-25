/**
 * BullMQ Server - Express Backend with Job Queue Management
 * Port: 4009
 */

const express = require('express');
const cors = require('cors');
const dotenv = require('dotenv');
const { Queue, Worker } = require('bullmq');

dotenv.config();

const app = express();
const PORT = process.env.HTTP_PORT || 4009;

// Middleware
app.use(cors());
app.use(express.json());
app.use(express.static('public'));

// Redis connection config
const connection = {
  host: process.env.REDIS_HOST || 'localhost',
  port: parseInt(process.env.REDIS_PORT || 6379)
};

// Initialize queues
const emailQueue = new Queue('emails', { connection });
const reportQueue = new Queue('reports', { connection });
const importQueue = new Queue('imports', { connection });

// Import routes and middleware
const routes = require('./routes');
const { validateQueueExists, logQueueOperation, handleQueueErrors } = require('./middleware');
const controller = require('./controller');

app.use(logQueueOperation);

// Routes
app.use(routes);
app.use(handleQueueErrors);

// Basic Health Check
app.get('/health', async (req, res) => {
  try {
    const counts = await emailQueue.getJobCounts();
    res.json({
      status: 'healthy',
      redis: 'connected',
      queues: {
        emails: counts,
        reports: await reportQueue.getJobCounts(),
        imports: await importQueue.getJobCounts()
      }
    });
  } catch (error) {
    res.status(503).json({
      status: 'unhealthy',
      error: error.message
    });
  }
});

// Start Server
app.listen(PORT, () => {
  console.log(`✅ BullMQ Server running on http://localhost:${PORT}`);
  console.log(`📊 Redis: ${connection.host}:${connection.port}`);
  console.log(`🔬 API: http://localhost:${PORT}/health`);
});

module.exports = app;
