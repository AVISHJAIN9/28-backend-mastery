require('dotenv').config();
const express = require('express');
const cors = require('cors');
const helmet = require('helmet');
const routes = require('./routes');
const { errorHandler } = require('./middleware');

const app = express();
const PORT = process.env.HTTP_PORT || 6305;

// ==================== Middleware ====================

app.use(helmet());
app.use(cors());

app.use(express.json());

// ==================== Health Check ====================

app.get('/health', (req, res) => {
  res.json({ status: 'ok', service: 'Supabase Storage & Realtime' });
});

// ==================== Routes ====================

app.use('/api', routes);

// ==================== Error Handling ====================

app.use(errorHandler);

// ==================== Start Server ====================

app.listen(PORT, () => {
  console.log(`🗄️ Supabase Storage & Realtime running on port ${PORT}`);
  console.log(`📋 Health: http://localhost:${PORT}/health`);
});
