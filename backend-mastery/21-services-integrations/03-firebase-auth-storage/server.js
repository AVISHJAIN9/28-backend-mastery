require('dotenv').config();
const express = require('express');
const cors = require('cors');
const helmet = require('helmet');
const routes = require('./routes');

const app = express();
const PORT = process.env.HTTP_PORT || 6303;

// ==================== Middleware ====================

app.use(helmet());
app.use(cors());

app.use(express.json());

// ==================== Routes ====================

app.use('/api', routes);

// ==================== Health Check ====================

app.get('/health', (req, res) => {
  res.json({
    status: 'ok',
    service: 'Firebase Auth & Storage',
    timestamp: new Date().toISOString(),
  });
});

// ==================== Error Handling ====================

app.use(require('./middleware').firebaseErrorHandler);

// ==================== 404 Handler ====================

app.use((req, res) => {
  res.status(404).json({ error: 'Endpoint not found' });
});

// ==================== Start Server ====================

app.listen(PORT, () => {
  console.log(`🔐 Firebase Auth & Storage service running on port ${PORT}`);
  console.log(`📋 Health check: http://localhost:${PORT}/health`);
  console.log(`
🔑 API Endpoints:
  POST   /api/auth/register - Register new user
  POST   /api/auth/login    - Login user
  POST   /api/auth/logout   - Logout
  GET    /api/profile       - Get user profile
  PUT    /api/profile       - Update profile
  POST   /api/documents     - Create document
  GET    /api/documents     - List documents
  GET    /api/documents/:id - Get document
  PUT    /api/documents/:id - Update document
  DELETE /api/documents/:id - Delete document
  POST   /api/files/upload  - Upload file
  GET    /api/files         - List files
  DELETE /api/files/:id     - Delete file
`);
});
