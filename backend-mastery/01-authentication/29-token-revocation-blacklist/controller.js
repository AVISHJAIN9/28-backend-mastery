const { v4: uuidv4 } = require('uuid');
const jwt = require('jsonwebtoken');

// Token blacklist storage
const tokenBlacklist = new Set();
const whitelistTokens = new Map();
const revokedTokens = new Map();

/**
 * Verify token is not revoked
 */
exports.isTokenBlacklisted = (token) => {
  return tokenBlacklist.has(token);
};

/**
 * Add token to blacklist
 */
const blacklistToken = (token) => {
  const decoded = jwt.decode(token);
  tokenBlacklist.add(token);
  
  if (token.length > 1000) {
    // Store only hash for long tokens
    const hash = require('crypto').createHash('sha256').update(token).digest('hex');
    tokenBlacklist.add(hash);
  }
};

/**
 * Revoke a token manually
 */
exports.revokeToken = async (req, res) => {
  try {
    const { token, reason } = req.body;

    if (!token) {
      return res.status(400).json({ error: 'Token required' });
    }

    // Validate token format
    try {
      jwt.decode(token);
    } catch (err) {
      return res.status(400).json({ error: 'Invalid token format' });
    }

    // Add to blacklist
    blacklistToken(token);

    // Log revocation
    const decoded = jwt.decode(token);
    revokedTokens.set(require('crypto').randomBytes(16).toString('hex'), {
      token,
      reason: reason || 'manual',
      revokedAt: new Date(),
      userId: decoded?.userId,
      expiresAt: new Date(decoded?.exp * 1000)
    });

    return res.status(200).json({
      message: 'Token revoked successfully'
    });
  } catch (error) {
    console.error('Revocation error:', error);
    return res.status(500).json({ error: 'Revocation failed' });
  }
};

/**
 * Logout user (revoke all tokens)
 */
exports.logout = async (req, res) => {
  try {
    const token = req.headers.authorization?.split(' ')[1];

    if (!token) {
      return res.status(400).json({ error: 'Token required' });
    }

    blacklistToken(token);

    return res.status(200).json({
      message: 'Logout successful'
    });
  } catch (error) {
    console.error('Logout error:', error);
    return res.status(500).json({ error: 'Logout failed' });
  }
};

/**
 * Get revocation list
 */
exports.getRevocationList = async (req, res) => {
  try {
    const list = Array.from(revokedTokens.values()).slice(0, 100);

    return res.status(200).json({
      total: list.length,
      revoked: list
    });
  } catch (error) {
    console.error('Get revocation error:', error);
    return res.status(500).json({ error: 'Failed to fetch revocation list' });
  }
};

/**
 * Clear expired tokens from blacklist
 */
exports.cleanupExpiredTokens = async (req, res) => {
  try {
    const now = Date.now();
    let removed = 0;

    for (const [key, value] of revokedTokens.entries()) {
      if (value.expiresAt < now) {
        revokedTokens.delete(key);
        removed++;
      }
    }

    return res.status(200).json({
      message: 'Cleanup complete',
      removedTokens: removed
    });
  } catch (error) {
    console.error('Cleanup error:', error);
    return res.status(500).json({ error: 'Cleanup failed' });
  }
};
