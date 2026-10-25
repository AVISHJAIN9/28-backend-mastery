const jwt = require('jsonwebtoken');
const crypto = require('crypto');
const { v4: uuidv4 } = require('uuid');
const fs = require('fs');
const path = require('path');

// In-memory key storage (use database in production)
const keyStore = new Map(); // kid -> key object
const tokenAudit = new Map(); // Stores token validation attempts

// Initialize with initial key version
const initializeKeyStore = () => {
  if (keyStore.size === 0) {
    const initialKey = generateKeyPair();
    keyStore.set(initialKey.kid, initialKey);
  }
};

/**
 * Generate RSA key pair
 * @returns {Object} Key pair with metadata
 */
const generateKeyPair = () => {
  const { publicKey, privateKey } = crypto.generateKeyPairSync('rsa', {
    modulusLength: 2048,
    publicKeyEncoding: { type: 'spki', format: 'pem' },
    privateKeyEncoding: { type: 'pkcs8', format: 'pem' }
  });

  const kid = crypto.randomBytes(16).toString('hex'); // Key ID
  const now = new Date();

  return {
    kid,
    publicKey,
    privateKey,
    algorithm: 'RS256',
    createdAt: now,
    rotatedAt: null,
    status: 'active',
    version: 1,
    expiresAt: new Date(now.getTime() + 90 * 24 * 60 * 60 * 1000) // 90 days
  };
};

/**
 * Create JWT with key ID in header
 * @param {Object} payload - Token payload
 * @param {Object} options - JWT options
 * @returns {string} Signed JWT
 */
const createToken = (payload, options = {}) => {
  initializeKeyStore();
  
  // Get the active key
  const activeKey = Array.from(keyStore.values())
    .find(k => k.status === 'active');

  if (!activeKey) {
    throw new Error('No active signing key available');
  }

  const tokenDetails = {
    ...payload,
    iat: Math.floor(Date.now() / 1000)
  };

  return jwt.sign(tokenDetails, activeKey.privateKey, {
    algorithm: activeKey.algorithm,
    keyid: activeKey.kid, // Add key ID to JWT header
    expiresIn: options.expiresIn || '1h',
    issuer: options.issuer || 'auth-service',
    audience: options.audience || 'api'
  });
};

/**
 * Verify JWT with graceful key rotation
 * Supports both current and previous keys for smooth transition
 * @param {string} token - JWT to verify
 * @returns {Object} Decoded token payload
 */
const verifyToken = (token) => {
  initializeKeyStore();

  let decoded;
  try {
    // First, decode without verification to get kid
    decoded = jwt.decode(token, { complete: true });
    
    if (!decoded) {
      throw new Error('Invalid token format');
    }

    const kid = decoded.header.kid;
    const key = keyStore.get(kid);

    if (!key) {
      // Key not found - could be expired key or invalid
      logTokenAudit('key_not_found', { kid, status: 'failed' });
      throw new Error(`Key version ${kid} not found`);
    }

    // Verify with the specific key
    const verified = jwt.verify(token, key.publicKey, {
      algorithms: [key.algorithm]
    });

    logTokenAudit('verification_success', { kid, userId: verified.userId });
    return verified;

  } catch (error) {
    logTokenAudit('verification_failed', { error: error.message });
    throw error;
  }
};

/**
 * Rotate JWT signing keys
 * Mark current key as deprecated, create new active key
 * @param {Object} req - Express request
 * @param {Object} res - Express response
 */
exports.rotateKeys = async (req, res) => {
  try {
    initializeKeyStore();

    // Get current active key
    const oldKey = Array.from(keyStore.values())
      .find(k => k.status === 'active');

    if (!oldKey) {
      return res.status(400).json({ error: 'No active key found' });
    }

    // Mark old key as deprecated (keep for grace period)
    oldKey.status = 'deprecated';
    oldKey.rotatedAt = new Date();

    // Generate new active key
    const newKey = generateKeyPair();

    // Add new key
    keyStore.set(newKey.kid, newKey);

    // Log rotation
    console.log(`🔄 Key rotation completed: ${oldKey.kid} deprecated, ${newKey.kid} activated`);

    return res.status(200).json({
      message: 'Key rotation successful',
      previousKeyId: oldKey.kid,
      newKeyId: newKey.kid,
      gracePeriod: '24 hours',
      details: {
        depreciatedKey: {
          kid: oldKey.kid,
          status: oldKey.status,
          rotatedAt: oldKey.rotatedAt
        },
        newKey: {
          kid: newKey.kid,
          status: newKey.status,
          createdAt: newKey.createdAt,
          expiresAt: newKey.expiresAt
        }
      }
    });
  } catch (error) {
    console.error('Key rotation error:', error);
    return res.status(500).json({ error: 'Key rotation failed' });
  }
};

/**
 * Get all public keys (for token validation)
 * Used by clients to build their key cache
 * @param {Object} req - Express request
 * @param {Object} res - Express response
 */
exports.getPublicKeys = async (req, res) => {
  try {
    initializeKeyStore();

    const keys = Array.from(keyStore.values())
      .filter(k => k.status !== 'revoked')
      .map(k => ({
        kid: k.kid,
        kty: 'RSA', // Key Type
        use: 'sig', // Public key usage
        alg: k.algorithm,
        status: k.status,
        createdAt: k.createdAt,
        expiresAt: k.expiresAt,
        publicKey: k.publicKey
      }));

    return res.status(200).json({
      keys,
      total: keys.length
    });
  } catch (error) {
    console.error('Error fetching public keys:', error);
    return res.status(500).json({ error: 'Failed to fetch public keys' });
  }
};

/**
 * Register a user and issue JWT with current key
 * @param {Object} req - Express request
 * @param {Object} res - Express response
 */
exports.register = async (req, res) => {
  try {
    const { email, password, name } = req.body;

    if (!email || !password || !name) {
      return res.status(400).json({ error: 'Email, password, and name required' });
    }

    const userId = uuidv4();
    const user = {
      id: userId,
      email,
      name,
      password: password, // In production: hash with bcrypt
      createdAt: new Date()
    };

    // Create JWT with current active key
    const token = createToken(
      { userId: user.id, email: user.email, type: 'access' },
      { expiresIn: '1h' }
    );

    return res.status(201).json({
      message: 'User registered successfully',
      user: { id: user.id, email: user.email, name: user.name },
      token,
      expiresIn: 3600
    });
  } catch (error) {
    console.error('Registration error:', error);
    return res.status(500).json({ error: 'Registration failed' });
  }
};

/**
 * Verify a token
 * Returns decoded token if valid
 * @param {Object} req - Express request
 * @param {Object} res - Express response
 */
exports.verifyToken = async (req, res) => {
  try {
    const { token } = req.body;

    if (!token) {
      return res.status(400).json({ error: 'Token required' });
    }

    const decoded = verifyToken(token);

    return res.status(200).json({
      message: 'Token is valid',
      decoded,
      keyId: jwt.decode(token, { complete: true }).header.kid
    });
  } catch (error) {
    return res.status(401).json({
      error: 'Token verification failed',
      details: error.message
    });
  }
};

/**
 * Get current active key info
 * @param {Object} req - Express request
 * @param {Object} res - Express response
 */
exports.getActiveKey = async (req, res) => {
  try {
    initializeKeyStore();

    const activeKey = Array.from(keyStore.values())
      .find(k => k.status === 'active');

    if (!activeKey) {
      return res.status(404).json({ error: 'No active key found' });
    }

    return res.status(200).json({
      active: {
        kid: activeKey.kid,
        algorithm: activeKey.algorithm,
        createdAt: activeKey.createdAt,
        expiresAt: activeKey.expiresAt,
        status: activeKey.status
      }
    });
  } catch (error) {
    console.error('Error fetching active key:', error);
    return res.status(500).json({ error: 'Failed to fetch active key' });
  }
};

/**
 * Get key rotation audit trail
 * @param {Object} req - Express request
 * @param {Object} res - Express response
 */
exports.getKeyRotationHistory = async (req, res) => {
  try {
    initializeKeyStore();

    const history = Array.from(keyStore.values())
      .map(k => ({
        kid: k.kid,
        status: k.status,
        createdAt: k.createdAt,
        rotatedAt: k.rotatedAt,
        expiresAt: k.expiresAt,
        version: k.version
      }))
      .sort((a, b) => b.createdAt - a.createdAt);

    return res.status(200).json({
      history,
      total: history.length
    });
  } catch (error) {
    console.error('Error fetching rotation history:', error);
    return res.status(500).json({ error: 'Failed to fetch history' });
  }
};

/**
 * Log token audit events
 */
const logTokenAudit = (event, details) => {
  const entry = {
    timestamp: new Date(),
    event,
    ...details
  };
  
  // Keep last 1000 entries
  if (tokenAudit.size > 1000) {
    const firstKey = tokenAudit.keys().next().value;
    tokenAudit.delete(firstKey);
  }
  
  tokenAudit.set(uuidv4(), entry);
};

/**
 * Get token validation audit log
 */
exports.getAuditLog = async (req, res) => {
  try {
    const logs = Array.from(tokenAudit.values())
      .sort((a, b) => b.timestamp - a.timestamp)
      .slice(0, 100);

    return res.status(200).json({
      logs,
      total: logs.length
    });
  } catch (error) {
    console.error('Error fetching audit log:', error);
    return res.status(500).json({ error: 'Failed to fetch audit log' });
  }
};

// Export internal functions for testing
exports._createToken = createToken;
exports._verifyToken = verifyToken;
exports._generateKeyPair = generateKeyPair;
