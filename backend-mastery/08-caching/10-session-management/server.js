import express from 'express';
import redis from 'redis';
import cors from 'cors';
import helmet from 'helmet';
import crypto from 'crypto';
import dotenv from 'dotenv';

dotenv.config();

const app = express();
const PORT = process.env.HTTP_PORT || 6416;

// Redis client
const redisClient = redis.createClient({
  host: process.env.REDIS_HOST || 'localhost',
  port: process.env.REDIS_PORT || 6379,
  db: process.env.REDIS_DB || 0
});

// Middleware
app.use(helmet());
app.use(cors({ origin: 'http://localhost:3000', credentials: true }));
app.use(express.json());

// Connect to Redis
await redisClient.connect();

// Helper: Generate secure session ID
const generateSessionId = () => crypto.randomBytes(32).toString('hex');

// =====================================================
// SESSION STRATEGY 1: ABSOLUTE TIMEOUT (Hard Limit)
// =====================================================
const createSessionAbsolute = async (userId, email, req) => {
  const sessionId = generateSessionId();
  const TTL = parseInt(process.env.SESSION_TTL || 1800); // 30 minutes
  
  const sessionData = {
    userId,
    email,
    strategy: 'absolute',
    createdAt: Date.now(),
    lastActivityTime: Date.now(),
    ip: req.ip,
    userAgent: req.headers['user-agent'],
    expiresAt: Date.now() + TTL * 1000
  };
  
  await redisClient.setEx(
    `session:${sessionId}`,
    TTL,
    JSON.stringify(sessionData)
  );
  
  // Track user's sessions
  await redisClient.sAdd(`user:${userId}:sessions`, sessionId);
  await redisClient.incr('stats:active_sessions');
  
  return sessionId;
};

// =====================================================
// SESSION STRATEGY 2: IDLE TIMEOUT (Activity-Based)
// =====================================================
const createSessionIdle = async (userId, email, req) => {
  const sessionId = generateSessionId();
  const IDLE_TIMEOUT = parseInt(process.env.IDLE_TIMEOUT || 900); // 15 minutes
  
  const sessionData = {
    userId,
    email,
    strategy: 'idle',
    createdAt: Date.now(),
    lastActivityTime: Date.now(),
    ip: req.ip,
    userAgent: req.headers['user-agent']
  };
  
  await redisClient.setEx(
    `session:${sessionId}`,
    IDLE_TIMEOUT,
    JSON.stringify(sessionData)
  );
  
  await redisClient.sAdd(`user:${userId}:sessions`, sessionId);
  await redisClient.incr('stats:active_sessions');
  
  return sessionId;
};

// =====================================================
// SESSION STRATEGY 3: ROLLING EXPIRATION (Best UX)
// =====================================================
const createSessionRolling = async (userId, email, req) => {
  const sessionId = generateSessionId();
  const IDLE_TIMEOUT = parseInt(process.env.IDLE_TIMEOUT || 900); // 15 minutes
  
  const sessionData = {
    userId,
    email,
    strategy: 'rolling',
    createdAt: Date.now(),
    lastActivityTime: Date.now(),
    accessCount: 0,
    ip: req.ip,
    userAgent: req.headers['user-agent']
  };
  
  await redisClient.setEx(
    `session:${sessionId}`,
    IDLE_TIMEOUT,
    JSON.stringify(sessionData)
  );
  
  await redisClient.sAdd(`user:${userId}:sessions`, sessionId);
  await redisClient.incr('stats:active_sessions');
  
  return sessionId;
};

// =====================================================
// SESSION VERIFICATION & REFRESH
// =====================================================
const getSession = async (sessionId) => {
  const sessionStr = await redisClient.get(`session:${sessionId}`);
  return sessionStr ? JSON.parse(sessionStr) : null;
};

const refreshSessionRolling = async (sessionId) => {
  const IDLE_TIMEOUT = parseInt(process.env.IDLE_TIMEOUT || 900);
  const MAX_SESSION_AGE = parseInt(process.env.MAX_SESSION_AGE || 28800); // 8 hours
  
  const session = await getSession(sessionId);
  if (!session) return null;
  
  // Check max age
  const age = Date.now() - session.createdAt;
  if (age > MAX_SESSION_AGE * 1000) {
    await deleteSession(sessionId);
    return null;
  }
  
  // Refresh TTL (rolling window)
  await redisClient.expire(`session:${sessionId}`, IDLE_TIMEOUT);
  
  // Update activity
  session.lastActivityTime = Date.now();
  session.accessCount = (session.accessCount || 0) + 1;
  
  await redisClient.setEx(
    `session:${sessionId}`,
    IDLE_TIMEOUT,
    JSON.stringify(session)
  );
  
  return session;
};

const deleteSession = async (sessionId) => {
  const session = await getSession(sessionId);
  
  if (session) {
    await redisClient.sRem(`user:${session.userId}:sessions`, sessionId);
    await redisClient.decr('stats:active_sessions');
  }
  
  await redisClient.del(`session:${sessionId}`);
};

const logoutAllSessions = async (userId) => {
  const sessions = await redisClient.sMembers(`user:${userId}:sessions`);
  
  for (const sessionId of sessions) {
    await redisClient.del(`session:${sessionId}`);
    await redisClient.decr('stats:active_sessions');
  }
  
  await redisClient.del(`user:${userId}:sessions`);
};

// =====================================================
// ENDPOINTS
// =====================================================

// Create session with absolute timeout
app.post('/api/session-absolute', async (req, res) => {
  try {
    const { userId, email } = req.body;
    
    if (!userId || !email) {
      return res.status(400).json({ error: 'userId and email required' });
    }
    
    const sessionId = await createSessionAbsolute(userId, email, req);
    const session = await getSession(sessionId);
    
    res.json({
      success: true,
      sessionId,
      session,
      strategy: 'absolute-timeout',
      ttl: parseInt(process.env.SESSION_TTL || 1800),
      expiresAt: session.expiresAt
    });
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
});

// Create session with idle timeout
app.post('/api/session-idle', async (req, res) => {
  try {
    const { userId, email } = req.body;
    
    if (!userId || !email) {
      return res.status(400).json({ error: 'userId and email required' });
    }
    
    const sessionId = await createSessionIdle(userId, email, req);
    const session = await getSession(sessionId);
    
    res.json({
      success: true,
      sessionId,
      session,
      strategy: 'idle-timeout',
      idleTtl: parseInt(process.env.IDLE_TIMEOUT || 900),
      note: 'Session extends on every access'
    });
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
});

// Create session with rolling expiration
app.post('/api/session-rolling', async (req, res) => {
  try {
    const { userId, email } = req.body;
    
    if (!userId || !email) {
      return res.status(400).json({ error: 'userId and email required' });
    }
    
    const sessionId = await createSessionRolling(userId, email, req);
    const session = await getSession(sessionId);
    
    res.json({
      success: true,
      sessionId,
      session,
      strategy: 'rolling-expiration',
      idleTtl: parseInt(process.env.IDLE_TIMEOUT || 900),
      maxAge: parseInt(process.env.MAX_SESSION_AGE || 28800),
      note: 'Best UX: extends on access, but max 8 hours total'
    });
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
});

// Get session (absolute/idle)
app.get('/api/session/:sessionId', async (req, res) => {
  try {
    const session = await getSession(req.params.sessionId);
    
    if (!session) {
      return res.status(401).json({ error: 'Session not found or expired' });
    }
    
    return res.json({ success: true, session });
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
});

// Refresh session (rolling only)
app.post('/api/session/:sessionId/refresh', async (req, res) => {
  try {
    const session = await refreshSessionRolling(req.params.sessionId);
    
    if (!session) {
      return res.status(401).json({ error: 'Session expired' });
    }
    
    res.json({
      success: true,
      session,
      message: 'Session refreshed (TTL extended)',
      accessCount: session.accessCount,
      sessionAge: Date.now() - session.createdAt
    });
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
});

// Logout single session
app.post('/api/session/:sessionId/logout', async (req, res) => {
  try {
    const session = await getSession(req.params.sessionId);
    
    if (!session) {
      return res.status(404).json({ error: 'Session not found' });
    }
    
    await deleteSession(req.params.sessionId);
    
    res.json({
      success: true,
      message: 'Session logged out',
      sessionId: req.params.sessionId
    });
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
});

// Logout all sessions for a user (logout all devices)
app.post('/api/user/:userId/logout-all', async (req, res) => {
  try {
    const sessions = await redisClient.sMembers(`user:${req.params.userId}:sessions`);
    
    await logoutAllSessions(req.params.userId);
    
    res.json({
      success: true,
      message: 'All sessions logged out',
      userId: req.params.userId,
      sessionsTerminated: sessions.length
    });
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
});

// Get user's active sessions
app.get('/api/user/:userId/sessions', async (req, res) => {
  try {
    const sessionIds = await redisClient.sMembers(`user:${req.params.userId}:sessions`);
    const sessions = [];
    
    for (const sessionId of sessionIds) {
      const session = await getSession(sessionId);
      if (session) {
        sessions.push({
          sessionId,
          ...session,
          age: Date.now() - session.createdAt
        });
      }
    }
    
    res.json({
      success: true,
      userId: req.params.userId,
      activeSessionCount: sessions.length,
      sessions
    });
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
});

// Clear all sessions (testing only)
app.post('/api/sessions/clear-all', async (req, res) => {
  try {
    const keys = await redisClient.keys('session:*');
    
    for (const key of keys) {
      await redisClient.del(key);
    }
    
    await redisClient.set('stats:active_sessions', '0');
    
    res.json({
      success: true,
      message: 'All sessions cleared',
      count: keys.length
    });
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
});

// Get statistics
app.get('/api/stats/sessions', async (req, res) => {
  try {
    const activeCount = await redisClient.get('stats:active_sessions') || 0;
    const keys = await redisClient.keys('session:*');
    
    res.json({
      success: true,
      stats: {
        activeSessionCount: parseInt(activeCount),
        totalSessions: keys.length,
        storageSize: `${(keys.length * 1).toFixed(2)} KB approx`
      }
    });
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
});

// Health check
app.get('/health', (req, res) => {
  res.json({ status: 'ok', service: 'Session Management Module' });
});

// Start server
app.listen(PORT, () => {
  console.log(`\n✅ Session Management Server running on http://localhost:${PORT}`);
  console.log(`📊 Redis connected on ${process.env.REDIS_HOST || 'localhost'}:${process.env.REDIS_PORT || 6379}`);
  console.log(`\n📚 Available Strategies:`);
  console.log(`  1. Absolute Timeout: /api/session-absolute`);
  console.log(`  2. Idle Timeout: /api/session-idle`);
  console.log(`  3. Rolling Expiration: /api/session-rolling`);
  console.log(`\n🔍 Utilities:`);
  console.log(`  - Get session: GET /api/session/{sessionId}`);
  console.log(`  - Refresh session: POST /api/session/{sessionId}/refresh`);
  console.log(`  - Logout session: POST /api/session/{sessionId}/logout`);
  console.log(`  - Logout all: POST /api/user/{userId}/logout-all`);
  console.log(`  - View sessions: GET /api/user/{userId}/sessions`);
  console.log(`  - Statistics: GET /api/stats/sessions\n`);
});

process.on('SIGINT', async () => {
  await redisClient.quit();
  process.exit(0);
});
