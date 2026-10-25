import express from 'express';
import cors from 'cors';
import helmet from 'helmet';
import winston from 'winston';
import dotenv from 'dotenv';
import redis from 'redis';

dotenv.config();

const app = express();
const HTTP_PORT = process.env.HTTP_PORT || 6401;
const REDIS_URL = process.env.REDIS_URL || 'redis://localhost:6379';

// Middleware
app.use(cors({ origin: process.env.FRONTEND_URL || 'http://localhost:3000' }));
app.use(helmet());
app.use(express.json());

// Logger
const logger = winston.createLogger({
  level: 'info',
  format: winston.format.json(),
  transports: [
    new winston.transports.Console({
      format: winston.format.simple()
    })
  ]
});

// Redis client
const redisClient = redis.createClient({ url: REDIS_URL });
redisClient.on('error', (err) => logger.error('Redis client error', { error: err.message }));
(async () => {
  try {
    await redisClient.connect();
    logger.info('Connected to Redis');
  } catch (err) {
    logger.error('Failed to connect to Redis', { error: err.message });
    logger.info('Note: Redis server must be running (redis-server)');
  }
})();

// ==================== API Endpoints ====================

app.get('/api/health', (req, res) => {
  res.json({ status: 'ok', timestamp: new Date().toISOString() });
});

// ==================== STRING Operations ====================

// POST /api/string/set - Set a string value
app.post('/api/string/set', async (req, res) => {
  try {
    const { key, value, ttl } = req.body;
    if (!key || !value) {
      return res.status(400).json({ error: 'Missing key or value' });
    }

    if (ttl) {
      await redisClient.setEx(key, ttl, value);
    } else {
      await redisClient.set(key, value);
    }

    res.json({ success: true, key, value, ttl: ttl || 'never' });
  } catch (error) {
    logger.error('String set error', { error: error.message });
    res.status(500).json({ error: 'Internal error' });
  }
});

// GET /api/string/:key - Get a string value
app.get('/api/string/:key', async (req, res) => {
  try {
    const { key } = req.params;
    const value = await redisClient.get(key);
    const ttl = await redisClient.ttl(key);

    res.json({
      key,
      value: value || null,
      ttl: ttl === -1 ? 'never' : ttl === -2 ? 'not found' : ttl
    });
  } catch (error) {
    logger.error('String get error', { error: error.message });
    res.status(500).json({ error: 'Internal error' });
  }
});

// POST /api/string/:key/incr - Increment counter
app.post('/api/string/:key/incr', async (req, res) => {
  try {
    const { key } = req.params;
    const { amount = 1 } = req.body;

    const newValue = await redisClient.incrBy(key, amount);
    res.json({ key, newValue, increment: amount });
  } catch (error) {
    logger.error('Increment error', { error: error.message });
    res.status(500).json({ error: 'Internal error' });
  }
});

// ==================== LIST Operations ====================

// POST /api/list/:key/push - Push to list
app.post('/api/list/:key/push', async (req, res) => {
  try {
    const { key } = req.params;
    const { value, position = 'left' } = req.body;
    if (!value) return res.status(400).json({ error: 'Missing value' });

    let length;
    if (position === 'right') {
      length = await redisClient.rPush(key, value);
    } else {
      length = await redisClient.lPush(key, value);
    }

    res.json({ key, value, position, listLength: length });
  } catch (error) {
    logger.error('List push error', { error: error.message });
    res.status(500).json({ error: 'Internal error' });
  }
});

// GET /api/list/:key - Get list contents
app.get('/api/list/:key', async (req, res) => {
  try {
    const { key } = req.params;
    const { start = 0, end = -1 } = req.query;

    const items = await redisClient.lRange(key, parseInt(start), parseInt(end));
    const length = await redisClient.lLen(key);

    res.json({ key, items, length, range: `${start}-${end}` });
  } catch (error) {
    logger.error('List get error', { error: error.message });
    res.status(500).json({ error: 'Internal error' });
  }
});

// DELETE /api/list/:key/pop - Pop from list
app.delete('/api/list/:key/pop', async (req, res) => {
  try {
    const { key } = req.params;
    const { position = 'left' } = req.body;

    let value;
    if (position === 'right') {
      value = await redisClient.rPop(key);
    } else {
      value = await redisClient.lPop(key);
    }

    res.json({ key, value, position, popped: value !== null });
  } catch (error) {
    logger.error('List pop error', { error: error.message });
    res.status(500).json({ error: 'Internal error' });
  }
});

// ==================== SET Operations ====================

// POST /api/set/:key/add - Add to set
app.post('/api/set/:key/add', async (req, res) => {
  try {
    const { key } = req.params;
    const { member } = req.body;
    if (!member) return res.status(400).json({ error: 'Missing member' });

    const added = await redisClient.sAdd(key, member);
    const size = await redisClient.sCard(key);

    res.json({ key, member, added: added === 1, setSize: size });
  } catch (error) {
    logger.error('Set add error', { error: error.message });
    res.status(500).json({ error: 'Internal error' });
  }
});

// GET /api/set/:key - Get set members
app.get('/api/set/:key', async (req, res) => {
  try {
    const { key } = req.params;
    const members = await redisClient.sMembers(key);
    const size = await redisClient.sCard(key);

    res.json({ key, members, size });
  } catch (error) {
    logger.error('Set get error', { error: error.message });
    res.status(500).json({ error: 'Internal error' });
  }
});

// GET /api/set/:key/member - Check membership
app.get('/api/set/:key/member/:member', async (req, res) => {
  try {
    const { key, member } = req.params;
    const isMember = await redisClient.sIsMember(key, member);

    res.json({ key, member, isMember });
  } catch (error) {
    logger.error('Set membership error', { error: error.message });
    res.status(500).json({ error: 'Internal error' });
  }
});

// ==================== HASH Operations ====================

// POST /api/hash/:key/set - Set hash field(s)
app.post('/api/hash/:key/set', async (req, res) => {
  try {
    const { key } = req.params;
    const { fields } = req.body;
    if (!fields || typeof fields !== 'object') {
      return res.status(400).json({ error: 'Missing fields object' });
    }

    await redisClient.hSet(key, fields);
    const size = await redisClient.hLen(key);

    res.json({ key, fields, hashSize: size });
  } catch (error) {
    logger.error('Hash set error', { error: error.message });
    res.status(500).json({ error: 'Internal error' });
  }
});

// GET /api/hash/:key - Get all hash fields
app.get('/api/hash/:key', async (req, res) => {
  try {
    const { key } = req.params;
    const hash = await redisClient.hGetAll(key);
    const size = await redisClient.hLen(key);

    res.json({ key, hash, size });
  } catch (error) {
    logger.error('Hash get error', { error: error.message });
    res.status(500).json({ error: 'Internal error' });
  }
});

// GET /api/hash/:key/:field - Get hash field
app.get('/api/hash/:key/:field', async (req, res) => {
  try {
    const { key, field } = req.params;
    const value = await redisClient.hGet(key, field);
    const exists = await redisClient.hExists(key, field);

    res.json({ key, field, value, exists });
  } catch (error) {
    logger.error('Hash field get error', { error: error.message });
    res.status(500).json({ error: 'Internal error' });
  }
});

// ==================== SORTED SET Operations ====================

// POST /api/zset/:key/add - Add to sorted set
app.post('/api/zset/:key/add', async (req, res) => {
  try {
    const { key } = req.params;
    const { member, score } = req.body;
    if (!member || score === undefined) {
      return res.status(400).json({ error: 'Missing member or score' });
    }

    const added = await redisClient.zAdd(key, { score: parseFloat(score), value: member });
    const size = await redisClient.zCard(key);

    res.json({ key, member, score, added, zsetSize: size });
  } catch (error) {
    logger.error('Sorted set add error', { error: error.message });
    res.status(500).json({ error: 'Internal error' });
  }
});

// GET /api/zset/:key - Get sorted set (highest to lowest score)
app.get('/api/zset/:key', async (req, res) => {
  try {
    const { key } = req.params;
    const { limit = 10 } = req.query;

    const items = await redisClient.zRangeByScore(key, { count: parseInt(limit), byScore: true, reverse: true }, 0, -1);
    // Note: Need to get scores separately
    const size = await redisClient.zCard(key);

    res.json({
      key,
      items: items || [],
      size,
      limit: parseInt(limit),
      note: 'Items shown highest to lowest score'
    });
  } catch (error) {
    logger.error('Sorted set get error', { error: error.message });
    res.status(500).json({ error: 'Internal error' });
  }
});

// GET /api/zset/:key/rank/:member - Get rank of member
app.get('/api/zset/:key/rank/:member', async (req, res) => {
  try {
    const { key, member } = req.params;

    const rank = await redisClient.zRevRank(key, member);
    const score = await redisClient.zScore(key, member);

    res.json({
      key,
      member,
      rank: rank !== null ? rank + 1 : null, // Convert 0-indexed to 1-indexed
      score,
      found: score !== null
    });
  } catch (error) {
    logger.error('Rank error', { error: error.message });
    res.status(500).json({ error: 'Internal error' });
  }
});

// ==================== KEY Management ====================

// DELETE /api/key/:key - Delete key
app.delete('/api/key/:key', async (req, res) => {
  try {
    const { key } = req.params;
    const deleted = await redisClient.del(key);

    res.json({ key, deleted: deleted === 1 });
  } catch (error) {
    logger.error('Key delete error', { error: error.message });
    res.status(500).json({ error: 'Internal error' });
  }
});

// GET /api/key/:key/ttl - Get key TTL
app.get('/api/key/:key/ttl', async (req, res) => {
  try {
    const { key } = req.params;
    const ttl = await redisClient.ttl(key);

    res.json({
      key,
      ttl: ttl === -1 ? 'never' : ttl === -2 ? 'not found' : ttl,
      seconds: ttl > 0 ? ttl : null
    });
  } catch (error) {
    logger.error('TTL error', { error: error.message });
    res.status(500).json({ error: 'Internal error' });
  }
});

// POST /api/key/:key/expire - Set expiration
app.post('/api/key/:key/expire', async (req, res) => {
  try {
    const { key } = req.params;
    const { seconds = 3600 } = req.body;

    const set = await redisClient.expire(key, seconds);

    res.json({
      key,
      ttl: seconds,
      set: set === 1,
      expiresAt: new Date(Date.now() + seconds * 1000).toISOString()
    });
  } catch (error) {
    logger.error('Expire error', { error: error.message });
    res.status(500).json({ error: 'Internal error' });
  }
});

// ==================== Utility ====================

// GET /api/demo/load-data - Load demo data
app.get('/api/demo/load-data', async (req, res) => {
  try {
    // Clear old demo data
    await redisClient.del(['demo:string', 'demo:list', 'demo:set', 'demo:hash', 'demo:zset']);

    // Load demo String
    await redisClient.set('demo:string', 'Hello Redis!', { EX: 3600 });

    // Load demo List (activity feed)
    await redisClient.lPush('demo:list', ['Event 3', 'Event 2', 'Event 1']);

    // Load demo Set (unique tags)
    await redisClient.sAdd('demo:set', ['nodejs', 'redis', 'caching', 'nodejs']); // nodejs added twice, set ignores duplicate

    // Load demo Hash (user profile)
    await redisClient.hSet('demo:hash', {
      name: 'Alice Johnson',
      email: 'alice@test.com',
      role: 'admin',
      created: '2024-01-15'
    });

    // Load demo Sorted Set (leaderboard)
    await redisClient.zAdd('demo:zset', [
      { score: 1500, value: 'Player A' },
      { score: 1200, value: 'Player B' },
      { score: 950, value: 'Player C' }
    ]);

    res.json({ success: true, message: 'Demo data loaded' });
  } catch (error) {
    logger.error('Demo load error', { error: error.message });
    res.status(500).json({ error: 'Internal error' });
  }
});

// GET /api/demo - Get demo data
app.get('/api/demo', async (req, res) => {
  try {
    const string = await redisClient.get('demo:string');
    const list = await redisClient.lRange('demo:list', 0, -1);
    const set = await redisClient.sMembers('demo:set');
    const hash = await redisClient.hGetAll('demo:hash');
    const zset = await redisClient.zRangeByScore('demo:zset', { byScore: true, reverse: true }, 0, -1);

    res.json({
      string: { value: string, type: 'String' },
      list: { items: list, type: 'List' },
      set: { members: set, type: 'Set' },
      hash: { fields: hash, type: 'Hash' },
      zset: { members: zset, type: 'Sorted Set' }
    });
  } catch (error) {
    logger.error('Demo get error', { error: error.message });
    res.status(500).json({ error: 'Internal error' });
  }
});

// Start server
app.listen(HTTP_PORT, () => {
  logger.info(`Redis Data Structures API running on http://localhost:${HTTP_PORT}`);
  logger.info(`Test: curl http://localhost:${HTTP_PORT}/api/health`);
  logger.info(`Load demo: curl http://localhost:${HTTP_PORT}/api/demo/load-data`);
});
