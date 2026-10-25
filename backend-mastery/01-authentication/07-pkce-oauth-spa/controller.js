const { v4: uuidv4 } = require('uuid');
const jwt = require('jsonwebtoken');
const crypto = require('crypto');

const users = new Map();
const authorizationCodes = new Map(); // Store codes with PKCE challenges
const tokens = new Set(); // Blacklist for logout

const JWT_SECRET = process.env.JWT_SECRET || 'secret';
const CODE_EXPIRY = 10 * 60 * 1000; // 10 minutes

/**
 * PKCE OAuth SPA - Controller
 * Features: PKCE (Proof Key for Code Exchange), Authorization Code Flow, SPA safe
 * 
 * Flow:
 * 1. SPA generates code_verifier + code_challenge (SHA256)
 * 2. User initiates auth with code_challenge
 * 3. Server generates authorization code
 * 4. SPA exchanges code + code_verifier for token
 * 5. Server validates verifier against stored challenge
 */

// Mock user data
const mockUser = {
  id: uuidv4(),
  email: 'user@pkce.test',
  name: 'PKCE User',
  role: 'user'
};

/**
 * Validate PKCE code verifier
 * code_challenge = BASE64URL(SHA256(code_verifier))
 */
const validatePKCEChallenge = (verifier, challenge) => {
  const hash = crypto.createHash('sha256').update(verifier).digest();
  const computed = Buffer.from(hash).toString('base64')
    .replace(/\+/g, '-')
    .replace(/\//g, '_')
    .replace(/=/g, '');
  return computed === challenge;
};

/**
 * Step 1: Authorization endpoint - Generate authorization code
 * Client provides: code_challenge, redirect_uri
 */
exports.authorize = async (req, res) => {
  try {
    const { code_challenge, redirect_uri } = req.validatedData;

    if (!code_challenge || !redirect_uri) {
      return res.status(400).json({ error: 'Missing required PKCE parameters' });
    }

    // Generate authorization code
    const authCode = `code_${uuidv4()}`;
    const expiresAt = Date.now() + CODE_EXPIRY;

    // Store code with challenge
    authorizationCodes.set(authCode, {
      code_challenge,
      redirect_uri,
      expiresAt,
      used: false
    });

    console.log(`✓ Auth code issued: ${authCode} (expires in 10min)`);

    // In real OAuth, redirect to redirect_uri with code
    // For demo, return code directly
    return res.status(200).json({ code: authCode });
  } catch (error) {
    console.error('Authorization error:', error);
    return res.status(500).json({ error: 'Authorization failed' });
  }
};

/**
 * Step 2: Token endpoint - Exchange code + verifier for token
 * Client provides: code, code_verifier, redirect_uri
 */
exports.authenticate = async (req, res) => {
  try {
    const { code, code_verifier, redirect_uri } = req.validatedData;

    if (!code || !code_verifier || !redirect_uri) {
      return res.status(400).json({ error: 'Missing required PKCE parameters' });
    }

    // Validate authorization code exists
    const authData = authorizationCodes.get(code);
    if (!authData) {
      return res.status(400).json({ error: 'Invalid authorization code' });
    }

    // Check if code expired
    if (Date.now() > authData.expiresAt) {
      authorizationCodes.delete(code);
      return res.status(400).json({ error: 'Authorization code expired' });
    }

    // Prevent code reuse
    if (authData.used) {
      authorizationCodes.delete(code);
      return res.status(400).json({ error: 'Authorization code already used' });
    }

    // Validate redirect_uri matches
    if (authData.redirect_uri !== redirect_uri) {
      return res.status(400).json({ error: 'Invalid redirect_uri' });
    }

    // Validate PKCE challenge
    if (!validatePKCEChallenge(code_verifier, authData.code_challenge)) {
      console.warn('✗ PKCE validation failed - code_verifier does not match challenge');
      return res.status(400).json({ error: 'Invalid code_verifier' });
    }

    // Mark code as used
    authData.used = true;

    // Generate tokens
    const accessToken = jwt.sign(
      { id: mockUser.id, email: mockUser.email, role: mockUser.role },
      JWT_SECRET,
      { expiresIn: '1h' }
    );

    const refreshToken = jwt.sign(
      { id: mockUser.id, type: 'refresh' },
      JWT_SECRET,
      { expiresIn: '7d' }
    );

    // Store user
    users.set(mockUser.id, mockUser);

    console.log(`✓ Tokens issued - Access valid 1h, Refresh valid 7d`);

    return res.status(200).json({
      access_token: accessToken,
      refresh_token: refreshToken,
      token_type: 'Bearer',
      expires_in: 3600,
      user: mockUser
    });
  } catch (error) {
    console.error('Token exchange error:', error);
    return res.status(500).json({ error: 'Token exchange failed' });
  }
};

exports.getCurrentUser = async (req, res) => {
  try {
    const { id } = req.user;

    const user = users.get(id);
    if (!user) {
      return res.status(404).json({ error: 'User not found' });
    }

    return res.status(200).json({ user });
  } catch (error) {
    console.error('Get user error:', error);
    return res.status(500).json({ error: 'Internal server error' });
  }
};

exports.logout = async (req, res) => {
  try {
    const token = req.headers.authorization?.split(' ')[1];
    if (token) {
      tokens.add(token); // Add to blacklist
    }

    console.log(`✓ User logged out, token blacklisted`);
    return res.status(200).json({ message: 'Logout successful' });
  } catch (error) {
    console.error('Logout error:', error);
    return res.status(500).json({ error: 'Logout failed' });
  }
};

exports.users = users;
exports.tokens = tokens;
