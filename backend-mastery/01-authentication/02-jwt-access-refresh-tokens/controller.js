const jwt = require('jsonwebtoken');
const bcrypt = require('bcryptjs');
const { v4: uuidv4 } = require('uuid');

// In-memory stores (replace with database in production)
const users = new Map();
const refreshTokens = new Map(); // Store refresh tokens with their metadata

const ACCESS_TOKEN_EXPIRY = '15m';
const REFRESH_TOKEN_EXPIRY = '7d';

/**
 * Generate JWT tokens
 * @param {string} userId - User ID
 * @param {string} email - User email
 * @returns {Object} Access and refresh tokens
 */
const generateTokens = (userId, email) => {
  const accessToken = jwt.sign(
    { userId, email, type: 'access' },
    process.env.JWT_SECRET || 'your-secret-key',
    { expiresIn: ACCESS_TOKEN_EXPIRY }
  );

  const refreshToken = jwt.sign(
    { userId, email, type: 'refresh', tokenId: uuidv4() },
    process.env.JWT_REFRESH_SECRET || 'your-refresh-secret',
    { expiresIn: REFRESH_TOKEN_EXPIRY }
  );

  return { accessToken, refreshToken };
};

/**
 * Register a new user
 * @param {Object} req - Express request
 * @param {Object} res - Express response
 */
exports.register = async (req, res) => {
  try {
    const { email, password, name } = req.body;

    if (users.has(email)) {
      return res.status(409).json({ error: 'User already exists' });
    }

    const hashedPassword = await bcrypt.hash(password, 10);
    const userId = uuidv4();

    const user = {
      id: userId,
      email,
      name,
      password: hashedPassword,
      createdAt: new Date()
    };

    users.set(email, user);

    // Generate tokens on registration
    const { accessToken, refreshToken } = generateTokens(userId, email);
    
    // Store refresh token
    refreshTokens.set(refreshToken, {
      userId,
      email,
      createdAt: new Date(),
      expiresAt: new Date(Date.now() + 7 * 24 * 60 * 60 * 1000)
    });

    return res.status(201).json({
      message: 'User registered successfully',
      user: { id: user.id, email: user.email, name: user.name },
      tokens: { accessToken, refreshToken, expiresIn: '15m' }
    });
  } catch (error) {
    console.error('Registration error:', error);
    return res.status(500).json({ error: 'Registration failed' });
  }
};

/**
 * Login user
 * @param {Object} req - Express request
 * @param {Object} res - Express response
 */
exports.login = async (req, res) => {
  try {
    const { email, password } = req.body;

    const user = users.get(email);
    if (!user) {
      return res.status(401).json({ error: 'Invalid credentials' });
    }

    const validPassword = await bcrypt.compare(password, user.password);
    if (!validPassword) {
      return res.status(401).json({ error: 'Invalid credentials' });
    }

    const { accessToken, refreshToken } = generateTokens(user.id, user.email);

    refreshTokens.set(refreshToken, {
      userId: user.id,
      email: user.email,
      createdAt: new Date(),
      expiresAt: new Date(Date.now() + 7 * 24 * 60 * 60 * 1000)
    });

    return res.status(200).json({
      message: 'Login successful',
      user: { id: user.id, email: user.email, name: user.name },
      tokens: { accessToken, refreshToken, expiresIn: '15m' }
    });
  } catch (error) {
    console.error('Login error:', error);
    return res.status(500).json({ error: 'Login failed' });
  }
};

/**
 * Refresh access token using refresh token
 * @param {Object} req - Express request
 * @param {Object} res - Express response
 */
exports.refreshToken = async (req, res) => {
  try {
    const { refreshToken } = req.body;

    if (!refreshToken) {
      return res.status(400).json({ error: 'Refresh token is required' });
    }

    if (!refreshTokens.has(refreshToken)) {
      return res.status(401).json({ error: 'Invalid refresh token' });
    }

    const decoded = jwt.verify(
      refreshToken,
      process.env.JWT_REFRESH_SECRET || 'your-refresh-secret'
    );

    const tokenData = refreshTokens.get(refreshToken);

    if (new Date() > tokenData.expiresAt) {
      refreshTokens.delete(refreshToken);
      return res.status(401).json({ error: 'Refresh token expired' });
    }

    const newAccessToken = jwt.sign(
      { userId: decoded.userId, email: decoded.email, type: 'access' },
      process.env.JWT_SECRET || 'your-secret-key',
      { expiresIn: ACCESS_TOKEN_EXPIRY }
    );

    return res.status(200).json({
      message: 'Token refreshed successfully',
      accessToken: newAccessToken,
      expiresIn: '15m'
    });
  } catch (error) {
    console.error('Token refresh error:', error);
    if (error.name === 'TokenExpiredError') {
      return res.status(401).json({ error: 'Refresh token expired' });
    }
    return res.status(401).json({ error: 'Invalid refresh token' });
  }
};

/**
 * Get current user
 * @param {Object} req - Express request
 * @param {Object} res - Express response
 */
exports.getCurrentUser = (req, res) => {
  try {
    const user = users.get(req.user.email);
    if (!user) {
      return res.status(404).json({ error: 'User not found' });
    }

    res.status(200).json({
      user: { id: user.id, email: user.email, name: user.name, createdAt: user.createdAt }
    });
  } catch (error) {
    console.error('Get user error:', error);
    res.status(500).json({ error: 'Failed to fetch user' });
  }
};

/**
 * Logout user - invalidate refresh token
 * @param {Object} req - Express request
 * @param {Object} res - Express response
 */
exports.logout = (req, res) => {
  try {
    const { refreshToken } = req.body;
    if (refreshToken) {
      refreshTokens.delete(refreshToken);
    }
    res.status(200).json({ message: 'Logout successful' });
  } catch (error) {
    console.error('Logout error:', error);
    res.status(500).json({ error: 'Logout failed' });
  }
};

/**
 * Revoke all refresh tokens for a user (logout from all devices)
 * @param {Object} req - Express request
 * @param {Object} res - Express response
 */
exports.revokeAllTokens = (req, res) => {
  try {
    const userId = req.user.userId;
    let revokedCount = 0;
    
    for (const [token, data] of refreshTokens.entries()) {
      if (data.userId === userId) {
        refreshTokens.delete(token);
        revokedCount++;
      }
    }

    res.status(200).json({
      message: 'All refresh tokens revoked',
      revokedCount
    });
  } catch (error) {
    console.error('Revoke tokens error:', error);
    res.status(500).json({ error: 'Failed to revoke tokens' });
  }
};

/**
 * Get all active refresh tokens for user
 * @param {Object} req - Express request
 * @param {Object} res - Express response
 */
exports.getActiveSessions = (req, res) => {
  try {
    const userId = req.user.userId;
    const sessions = [];

    for (const [token, data] of refreshTokens.entries()) {
      if (data.userId === userId) {
        sessions.push({
          createdAt: data.createdAt,
          expiresAt: data.expiresAt,
          isExpired: new Date() > data.expiresAt
        });
      }
    }

    res.status(200).json({
      sessions,
      totalSessions: sessions.length
    });
  } catch (error) {
    console.error('Get sessions error:', error);
    res.status(500).json({ error: 'Failed to fetch sessions' });
  }
};

