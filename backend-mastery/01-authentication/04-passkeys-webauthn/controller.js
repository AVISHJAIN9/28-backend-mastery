const crypto = require('crypto');
const { v4: uuidv4 } = require('uuid');
const jwt = require('jsonwebtoken');

const users = new Map();
const challenges = new Map();

/**
 * Start registration - generate challenge
 */
exports.startRegistration = (req, res) => {
  try {
    const { email, name } = req.body;
    
    if (users.has(email)) {
      return res.status(409).json({ error: 'User already exists' });
    }
    
    const challenge = crypto.randomBytes(32);
    const userId = uuidv4();
    
    challenges.set(userId, {
      challenge: challenge.toString('base64url'),
      email,
      name,
      createdAt: new Date()
    });
    
    res.json({
      challenge: challenge.toString('base64url'),
      rp: { name: 'My App', id: 'localhost' },
      user: {
        id: userId,
        name: email,
        displayName: name
      }
    });
  } catch (error) {
    console.error('Start registration error:', error);
    res.status(500).json({ error: 'Failed to start registration' });
  }
};

/**
 * Complete registration - verify credential
 */
exports.completeRegistration = async (req, res) => {
  try {
    const { userId, credential } = req.body;
    
    const challenge = challenges.get(userId);
    if (!challenge) {
      return res.status(400).json({ error: 'Invalid challenge' });
    }
    
    const user = {
      id: userId,
      email: challenge.email,
      name: challenge.name,
      credentials: [{
        id: credential.id,
        publicKey: credential.publicKey,
        counter: credential.counter || 0,
        createdAt: new Date()
      }],
      createdAt: new Date()
    };
    
    users.set(challenge.email, user);
    challenges.delete(userId);
    
    res.status(201).json({
      message: 'Registration successful',
      user: { id: user.id, email: user.email, name: user.name }
    });
  } catch (error) {
    console.error('Complete registration error:', error);
    res.status(500).json({ error: 'Registration failed' });
  }
};

/**
 * Start authentication - generate challenge
 */
exports.startAuthentication = (req, res) => {
  try {
    const { email } = req.body;
    
    const user = users.get(email);
    if (!user) {
      return res.status(404).json({ error: 'User not found' });
    }
    
    const challenge = crypto.randomBytes(32);
    const challengeId = uuidv4();
    
    challenges.set(challengeId, {
      challenge: challenge.toString('base64url'),
      userId: user.id,
      email,
      createdAt: new Date()
    });
    
    res.json({
      challenge: challenge.toString('base64url'),
      userVerification: 'preferred',
      credentials: user.credentials.map(cred => ({ id: cred.id }))
    });
  } catch (error) {
    console.error('Start auth error:', error);
    res.status(500).json({ error: 'Failed to start authentication' });
  }
};

/**
 * Complete authentication - verify credential signature
 */
exports.completeAuthentication = async (req, res) => {
  try {
    const { challengeId, credentialId, signature } = req.body;
    
    const challenge = challenges.get(challengeId);
    if (!challenge) {
      return res.status(400).json({ error: 'Invalid challenge' });
    }
    
    const user = Array.from(users.values()).find(u => u.id === challenge.userId);
    const credential = user.credentials.find(c => c.id === credentialId);
    
    if (!credential) {
      return res.status(400).json({ error: 'Credential not found' });
    }
    
    const verified = crypto
      .createVerify('sha256')
      .update(challenge.challenge)
      .verify(credential.publicKey, Buffer.from(signature, 'base64'));
    
    if (!verified) {
      return res.status(401).json({ error: 'Authentication failed' });
    }
    
    credential.counter++;
    credential.lastUsed = new Date();
    
    const accessToken = jwt.sign(
      { userId: user.id, email: user.email },
      process.env.JWT_SECRET || 'secret',
      { expiresIn: '15m' }
    );
    
    challenges.delete(challengeId);
    
    res.json({
      message: 'Authentication successful',
      user: { id: user.id, email: user.email, name: user.name },
      accessToken
    });
  } catch (error) {
    console.error('Complete auth error:', error);
    res.status(500).json({ error: 'Authentication failed' });
  }
};

/**
 * Get user credentials
 */
exports.getCredentials = (req, res) => {
  try {
    const user = Array.from(users.values()).find(u => u.id === req.user.userId);
    if (!user) {
      return res.status(404).json({ error: 'User not found' });
    }
    
    res.json({
      credentials: user.credentials.map(cred => ({
        id: cred.id,
        createdAt: cred.createdAt,
        lastUsed: cred.lastUsed
      }))
    });
  } catch (error) {
    console.error('Get credentials error:', error);
    res.status(500).json({ error: 'Failed to fetch credentials' });
  }
};

/**
 * Delete credential
 */
exports.deleteCredential = (req, res) => {
  try {
    const { credentialId } = req.params;
    const user = Array.from(users.values()).find(u => u.id === req.user.userId);
    
    if (!user) {
      return res.status(404).json({ error: 'User not found' });
    }
    
    user.credentials = user.credentials.filter(c => c.id !== credentialId);
    
    res.json({ message: 'Credential deleted' });
  } catch (error) {
    console.error('Delete credential error:', error);
    res.status(500).json({ error: 'Failed to delete credential' });
  }
};

