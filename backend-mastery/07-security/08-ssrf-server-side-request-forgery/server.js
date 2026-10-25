const express = require('express');
const helmet = require('helmet');
const axios = require('axios');
const jwt = require('jsonwebtoken');
const winston = require('winston');
const cors = require('cors');
const url = require('url');
require('dotenv').config();

const app = express();
app.use(express.json());

const JWT_SECRET = process.env.JWT_SECRET || 'secret';
const PORT = process.env.HTTP_PORT || 4008;

app.use(helmet());
app.use(cors());

const logger = winston.createLogger({
  level: 'info',
  format: winston.format.json(),
  transports: [
    new winston.transports.File({ filename: 'error.log', level: 'error' }),
    new winston.transports.File({ filename: 'combined.log' })
  ]
});

const verifyToken = (req, res, next) => {
  const token = req.headers.authorization?.split(' ')[1];
  try {
    req.user = token ? jwt.verify(token, JWT_SECRET) : { id: 'anonymous' };
    next();
  } catch (e) {
    res.status(401).json({ error: 'Invalid token' });
  }
};

// VULNERABLE: No URL validation - SSRF risk
app.post('/api/vulnerable/fetch', async (req, res) => {
  const { target_url } = req.body;
  
  try {
    const response = await axios.get(target_url, { timeout: 5000 });
    logger.warn('SSRF: Arbitrary URL fetched', { url: target_url });
    res.json({ content: response.data.substring(0, 500) });
  } catch (e) {
    res.status(400).json({ error: e.message });
  }
});

// SECURE: URL validation - block internal IPs and ports
app.post('/api/secure/fetch', verifyToken, async (req, res) => {
  const { target_url } = req.body;
  
  const BLOCKED_IPS = ['127.0.0.1', 'localhost', '0.0.0.0', '192.168', '10.', '172.'];
  const BLOCKED_PORTS = [22, 23, 25, 3306, 5432, 27017];
  
  try {
    const parsed = url.parse(target_url);
    
    // Check protocol
    if (!parsed.protocol || !['http:', 'https:'].includes(parsed.protocol)) {
      throw new Error('Only HTTP/HTTPS allowed');
    }
    
    // Check hostname
    const hostname = parsed.hostname || '';
    for (const blocked of BLOCKED_IPS) {
      if (hostname.includes(blocked)) {
        logger.warn('SSRF blocked: Internal IP', { url: target_url, user: req.user.id });
        throw new Error('Internal network access blocked');
      }
    }
    
    // Check port
    const port = parsed.port || (parsed.protocol === 'https:' ? 443 : 80);
    if (BLOCKED_PORTS.includes(parseInt(port))) {
      throw new Error('Blocked port');
    }
    
    const response = await axios.get(target_url, { timeout: 5000 });
    res.json({ content: response.data.substring(0, 500) });
  } catch (e) {
    res.status(400).json({ error: e.message });
  }
});

app.get('/api/lab/endpoints', (req, res) => {
  res.json({ 
    vulnerable: 'POST /api/vulnerable/fetch with target_url',
    secure: 'POST /api/secure/fetch with target_url'
  });
});

app.get('/health', (req, res) => res.json({ status: 'ok' }));

app.listen(PORT, () => {
  logger.info(`SSRF module on port ${PORT}`);
  console.log(`🌐 Module 08 running on http://localhost:${PORT}`);
});

module.exports = app;
