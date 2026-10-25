const express = require('express');
const helmet = require('helmet');
const sqlite3 = require('sqlite3').verbose();
const jwt = require('jsonwebtoken');
const winston = require('winston');
const cors = require('cors');
require('dotenv').config();

const app = express();
app.use(express.json());

const JWT_SECRET = process.env.JWT_SECRET || 'secret';
const PORT = process.env.HTTP_PORT || 4014;

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

// In-memory mock data
const users = {
  1: { id: 1, username: 'alice', email: 'alice@test.com' },
  2: { id: 2, username: 'bob', email: 'bob@test.com' }
};

// VULNERABLE: SQL injection via string concatenation
app.get('/api/vulnerable/users/:username', (req, res) => {
  const username = req.params.username;
  
  // UNSAFE: String concatenation allows SQL injection
  const query = `SELECT * FROM users WHERE username = '${username}'`;
  
  logger.warn('SQL injection risk', { query });
  
  // Simulate query execution
  const user = Object.values(users).find(u => u.username === username);
  
  if (!user) return res.status(404).json({ error: 'Not found' });
  res.json(user);
});

// VULNERABLE: Search with injection
app.get('/api/vulnerable/search', (req, res) => {
  const q = req.query.q;
  
  // UNSAFE: String concatenation in search
  const query = `SELECT * FROM users WHERE username LIKE '%${q}%'`;
  
  logger.warn('Search injection risk', { query });
  
  res.json({ results: [] });
});

// SECURE: Parameterized queries
app.get('/api/secure/users/:username', verifyToken, (req, res) => {
  const username = req.params.username;
  
  // SAFE: Parameterized query - parameter is separate from code
  const query = 'SELECT * FROM users WHERE username = ?';
  const params = [username];
  
  logger.info('Parameterized query executed', { user: req.user.id });
  
  // Simulate safe query
  const user = Object.values(users).find(u => u.username === username);
  
  if (!user) return res.status(404).json({ error: 'Not found' });
  res.json(user);
});

// SECURE: Parameterized search
app.get('/api/secure/search', verifyToken, (req, res) => {
  const q = req.query.q;
  
  // SAFE: Parameterized with LIKE
  const query = 'SELECT * FROM users WHERE username LIKE ?';
  const params = [`%${q}%`];
  
  logger.info('Safe search', { user: req.user.id });
  
  res.json({ results: [], query: query });
});

// Get all users (for testing)
app.get('/api/lab/users', (req, res) => {
  res.json(Object.values(users));
});

app.get('/health', (req, res) => res.json({ status: 'ok' }));

app.listen(PORT, () => {
  logger.info(`SQL Injection Prevention module on port ${PORT}`);
  console.log(`🛡️  Module 14 running on http://localhost:${PORT}`);
});

module.exports = app;
