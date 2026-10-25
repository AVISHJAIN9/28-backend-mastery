require('dotenv').config();
const express = require('express');
const cors = require('cors');
const helmet = require('helmet');
const routes = require('./routes');
const { errorHandler } = require('./middleware');

const app = express();
const PORT = process.env.HTTP_PORT || 6309;

// ==================== Middleware ====================

app.use(helmet());
app.use(cors());

app.use(express.json());
app.get('/health', (req, res) => res.json({ status: 'ok' }));

app.use('/api', routes);
app.use(errorHandler);

// ==================== Start Server ====================

app.listen(PORT, () => {
  console.log(`📱 Twilio SMS & OTP running on port ${PORT}`);
  console.log(`📋 Health: http://localhost:${PORT}/health`);
});
