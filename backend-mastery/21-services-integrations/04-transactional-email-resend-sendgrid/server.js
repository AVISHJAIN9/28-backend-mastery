require('dotenv').config();
const express = require('express');
const cors = require('cors');
const helmet = require('helmet');
const routes = require('./routes');
const { emailErrorHandler } = require('./middleware');

const app = express();
const PORT = process.env.HTTP_PORT || 6304;

// ==================== Middleware ====================

app.use(helmet());
app.use(cors());

// ==================== Health Check ====================

app.get('/health', (req, res) => {
  res.json({
    status: 'ok',
    service: 'Transactional Email - Resend & SendGrid',
    timestamp: new Date().toISOString(),
  });
});

// ==================== Routes ====================

app.use('/api', routes);

// ==================== Error Handling ====================

app.use(emailErrorHandler);

// ==================== 404 Handler ====================

app.use((req, res) => {
  res.status(404).json({ error: 'Endpoint not found' });
});

// ==================== Start Server ====================

app.listen(PORT, () => {
  console.log(`📧 Transactional Email service running on port ${PORT}`);
  console.log(`📋 Health check: http://localhost:${PORT}/health`);
  console.log(`
🔧 API Endpoints:
  POST   /api/send                - Send email
  POST   /api/send/verification   - Send verification email
  POST   /api/verify              - Verify email code
  POST   /api/send/receipt        - Send receipt email
  POST   /api/send/batch          - Send batch emails
  POST   /api/templates           - Create email template
  GET    /api/templates           - List templates
  GET    /api/logs                - Get email logs
`);
});
