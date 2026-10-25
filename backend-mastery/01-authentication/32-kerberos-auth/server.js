import express from 'express';
import helmet from 'helmet';
import cors from 'cors';
import dotenv from 'dotenv';
import { v4 as uuidv4 } from 'uuid';
import { createLogger, format, transports } from 'winston';
import controller from './controller.js';
import middleware from './middleware.js';
import routes from './routes.js';

dotenv.config();

const app = express();
const PORT = parseInt(process.env.HTTP_PORT || 4032, 10);

// ==================== Logging ====================
const logger = createLogger({
  level: 'info',
  format: format.json(),
  transports: [
    new transports.File({ filename: 'error.log', level: 'error' }),
    new transports.File({ filename: 'combined.log' })
  ]
});

// ==================== Middleware ====================

// Security
app.use(helmet());
app.use(cors({'origin': process.env.FRONTEND_URL || 'http://localhost:3000'}));

// Body parsing
app.use(express.json());
app.use(express.urlencoded({ extended: true }));

// ==================== Routes ====================

// Health check
app.get('/health', (req, res) => {
  res.json({ status: 'Kerberos Auth Service Running', timestamp: new Date() });
});

// Auth routes
app.use('/auth', routes);

// ==================== Error Handling ====================

app.use((err, req, res, next) => {
  logger.error('Error occurred', { error: err, userId: req.user?.id });
  res.status(err.status || 500).json({ error: err.message || 'Internal Server Error' });
});

// 404 Handler
app.use((req, res) => {
  res.status(404).json({ error: 'Route not found' });
});

// ==================== Server Start ====================

app.listen(PORT, () => {
  console.log(`Kerberos Auth Service running on port ${PORT}`);
  console.log(`Frontend URL: ${process.env.FRONTEND_URL || 'http://localhost:3000'}`);
});

export default app;
