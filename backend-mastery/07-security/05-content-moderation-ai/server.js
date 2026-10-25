const express = require('express');
const helmet = require('helmet');
const jwt = require('jsonwebtoken');
const winston = require('winston');
const cors = require('cors');
require('dotenv').config();

const app = express();
app.use(express.json());

const JWT_SECRET = process.env.JWT_SECRET || 'secret';
const PORT = process.env.HTTP_PORT || 4005;

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

// Simulated AI content moderation
const BANNED_KEYWORDS = ['spam', 'abuse', 'inappropriate'];
const TOXICITY_THRESHOLD = 0.7;

const posts = {
  1: { id: 1, content: 'Great day today!', moderation: { flagged: false, reason: null } },
  2: { id: 2, content: 'This is spam content!!!', moderation: { flagged: true, reason: 'potential spam' } }
};

const verifyToken = (req, res, next) => {
  const token = req.headers.authorization?.split(' ')[1];
  if (!token) return res.status(401).json({ error: 'No token' });
  try {
    req.user = jwt.verify(token, JWT_SECRET);
    next();
  } catch (e) {
    res.status(401).json({ error: 'Invalid token' });
  }
};

// Simulated AI moderation check
const checkContent = (text) => {
  let toxicityScore = 0;
  for (const keyword of BANNED_KEYWORDS) {
    if (text.toLowerCase().includes(keyword)) {
      toxicityScore += 0.3;
    }
  }
  if (text.includes('!!!')) toxicityScore += 0.4;
  if (text.length > 1000) toxicityScore += 0.1;
  
  return {
    flagged: toxicityScore >= TOXICITY_THRESHOLD,
    toxicity: Math.min(toxicityScore, 1),
    reason: toxicityScore >= TOXICITY_THRESHOLD ? 'Content moderation triggered' : null
  };
};

// VULNERABLE: No content moderation
app.post('/api/vulnerable/posts', (req, res) => {
  const { content } = req.body;
  const post = { id: Math.random(), content, moderation: null };
  logger.warn('Unmoderated content posted', { content: content.substring(0, 50) });
  res.json(post);
});

// SECURE: AI-based content moderation
app.post('/api/secure/posts', verifyToken, (req, res) => {
  const { content } = req.body;
  if (!content || content.length === 0) {
    return res.status(400).json({ error: 'Content required' });
  }
  
  const moderation = checkContent(content);
  
  if (moderation.flagged) {
    logger.warn('Content flagged by AI moderation', { userId: req.user.id, reason: moderation.reason });
    return res.status(403).json({ error: 'Content violates policy', moderation });
  }
  
  const post = { id: Math.random(), content, moderation };
  logger.info('Post created after moderation check', { userId: req.user.id, toxicity: moderation.toxicity });
  res.json(post);
});

// Moderate uploaded content
app.post('/api/secure/moderate', verifyToken, (req, res) => {
  const { text } = req.body;
  const result = checkContent(text);
  res.json({ text: text.substring(0, 50) + '...', ...result });
});

app.post('/api/secure/login', (req, res) => {
  const token = jwt.sign({ id: 1 }, JWT_SECRET, { expiresIn: '1h' });
  res.json({ token });
});

app.get('/api/lab/posts', (req, res) => {
  res.json(Object.values(posts));
});

app.get('/health', (req, res) => res.json({ status: 'ok' }));

app.listen(PORT, () => {
  logger.info(`Content Moderation module on port ${PORT}`);
  console.log(`🤖 Module 05 running on http://localhost:${PORT}`);
});

module.exports = app;
