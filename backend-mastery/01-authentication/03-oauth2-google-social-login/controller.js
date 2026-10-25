const axios = require('axios');
const { v4: uuidv4 } = require('uuid');
const jwt = require('jsonwebtoken');

// In-memory stores (use database in production)
const users = new Map();
const oauthSessions = new Map();

/**
 * Generate JWT tokens
 */
const generateTokens = (userId, email) => {
  const accessToken = jwt.sign(
    { userId, email, type: 'access' },
    process.env.JWT_SECRET || 'secret',
    { expiresIn: '15m' }
  );
  
  const refreshToken = jwt.sign(
    { userId, email, type: 'refresh' },
    process.env.JWT_REFRESH_SECRET || 'refresh-secret',
    { expiresIn: '7d' }
  );
  
  return { accessToken, refreshToken };
};

/**
 * Get OAuth authorization URL
 */
exports.getAuthUrl = (req, res) => {
  try {
    const state = uuidv4();
    oauthSessions.set(state, { createdAt: new Date() });
    
    const params = new URLSearchParams({
      client_id: process.env.GOOGLE_CLIENT_ID,
      redirect_uri: process.env.GOOGLE_REDIRECT_URI,
      response_type: 'code',
      scope: 'openid profile email',
      state: state,
      access_type: 'offline'
    });
    
    const authUrl = `https://accounts.google.com/o/oauth2/v2/auth?${params.toString()}`;
    
    res.json({ authUrl });
  } catch (error) {
    console.error('Get auth URL error:', error);
    res.status(500).json({ error: 'Failed to get auth URL' });
  }
};

/**
 * Handle OAuth callback and exchange code for tokens
 */
exports.handleCallback = async (req, res) => {
  try {
    const { code, state } = req.query;
    
    if (!code || !state) {
      return res.status(400).json({ error: 'Missing code or state' });
    }
    
    // Verify state to prevent CSRF
    if (!oauthSessions.has(state)) {
      return res.status(401).json({ error: 'Invalid state parameter' });
    }
    
    oauthSessions.delete(state);
    
    // Exchange code for tokens from Google
    const tokenResponse = await axios.post(
      'https://oauth2.googleapis.com/token',
      {
        code,
        client_id: process.env.GOOGLE_CLIENT_ID,
        client_secret: process.env.GOOGLE_CLIENT_SECRET,
        redirect_uri: process.env.GOOGLE_REDIRECT_URI,
        grant_type: 'authorization_code'
      }
    );
    
    const { id_token } = tokenResponse.data;
    
    // Verify and decode ID token
    const response = await axios.get(
      `https://www.googleapis.com/oauth2/v3/tokeninfo?id_token=${id_token}`
    );
    
    const { email, name, picture, sub: googleId } = response.data;
    
    // Find or create user
    let user = Array.from(users.values()).find(u => u.email === email);
    
    if (!user) {
      const userId = uuidv4();
      user = {
        id: userId,
        email,
        name,
        picture,
        googleId,
        provider: 'google',
        createdAt: new Date(),
        lastLogin: new Date()
      };
      users.set(email, user);
    } else {
      user.lastLogin = new Date();
    }
    
    // Generate JWT tokens
    const { accessToken, refreshToken } = generateTokens(user.id, user.email);
    
    // Redirect to frontend with tokens
    const redirectUrl = new URL(process.env.FRONTEND_REDIRECT_URI || 'http://localhost:5173/auth/callback');
    redirectUrl.searchParams.set('accessToken', accessToken);
    redirectUrl.searchParams.set('refreshToken', refreshToken);
    redirectUrl.searchParams.set('userId', user.id);
    
    res.redirect(redirectUrl.toString());
  } catch (error) {
    console.error('OAuth callback error:', error);
    res.redirect(`${process.env.FRONTEND_REDIRECT_URI || 'http://localhost:5173'}?error=auth_failed`);
  }
};

/**
 * Get current user
 */
exports.getCurrentUser = (req, res) => {
  try {
    const user = Array.from(users.values()).find(u => u.id === req.user.userId);
    
    if (!user) {
      return res.status(404).json({ error: 'User not found' });
    }
    
    res.json({
      user: {
        id: user.id,
        email: user.email,
        name: user.name,
        picture: user.picture,
        provider: user.provider,
        createdAt: user.createdAt
      }
    });
  } catch (error) {
    console.error('Get user error:', error);
    res.status(500).json({ error: 'Failed to fetch user' });
  }
};

/**
 * Logout user
 */
exports.logout = (req, res) => {
  try {
    res.json({ message: 'Logout successful' });
  } catch (error) {
    console.error('Logout error:', error);
    res.status(500).json({ error: 'Logout failed' });
  }
};

/**
 * Link additional OAuth provider to existing account
 */
exports.linkProvider = async (req, res) => {
  try {
    const { code, state, provider } = req.body;
    const userId = req.user.userId;
    
    const user = Array.from(users.values()).find(u => u.id === userId);
    if (!user) {
      return res.status(404).json({ error: 'User not found' });
    }
    
    // Exchange code based on provider
    let userInfo;
    if (provider === 'google') {
      userInfo = await exchangeGoogleCode(code, state);
    }
    
    if (!userInfo) {
      return res.status(400).json({ error: 'Failed to link provider' });
    }
    
    // Link provider to user
    user[`${provider}Id`] = userInfo.id;
    user.linkedProviders = user.linkedProviders || [];
    if (!user.linkedProviders.includes(provider)) {
      user.linkedProviders.push(provider);
    }
    
    res.json({
      message: `${provider} linked successfully`,
      user: {
        id: user.id,
        email: user.email,
        linkedProviders: user.linkedProviders
      }
    });
  } catch (error) {
    console.error('Link provider error:', error);
    res.status(500).json({ error: 'Failed to link provider' });
  }
};

/**
 * Get linked providers for user
 */
exports.getLinkedProviders = (req, res) => {
  try {
    const user = Array.from(users.values()).find(u => u.id === req.user.userId);
    
    if (!user) {
      return res.status(404).json({ error: 'User not found' });
    }
    
    const providers = [];
    if (user.googleId) providers.push('google');
    if (user.githubId) providers.push('github');
    if (user.linkedProviders) {
      providers.push(...user.linkedProviders);
    }
    
    res.json({
      linkedProviders: [...new Set(providers)],
      primaryProvider: user.provider
    });
  } catch (error) {
    console.error('Get providers error:', error);
    res.status(500).json({ error: 'Failed to fetch providers' });
  }
};

/**
 * Helper function to exchange Google authorization code
 */
async function exchangeGoogleCode(code, state) {
  try {
    const tokenResponse = await axios.post(
      'https://oauth2.googleapis.com/token',
      {
        code,
        client_id: process.env.GOOGLE_CLIENT_ID,
        client_secret: process.env.GOOGLE_CLIENT_SECRET,
        redirect_uri: process.env.GOOGLE_REDIRECT_URI,
        grant_type: 'authorization_code'
      }
    );
    
    const { id_token } = tokenResponse.data;
    const response = await axios.get(
      `https://www.googleapis.com/oauth2/v3/tokeninfo?id_token=${id_token}`
    );
    
    return {
      id: response.data.sub,
      email: response.data.email,
      name: response.data.name,
      picture: response.data.picture
    };
  } catch (error) {
    throw error;
  }
}

