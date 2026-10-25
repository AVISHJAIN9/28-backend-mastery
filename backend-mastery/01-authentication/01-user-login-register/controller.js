const bcrypt = require('bcryptjs');
const { v4: uuidv4 } = require('uuid');

// In-memory database (replace with actual DB in production)
const users = new Map();

/**
 * Register a new user
 * @param {Object} req - Express request
 * @param {Object} res - Express response
 */
exports.register = async (req, res) => {
  try {
    const { email, password, name } = req.body;

    // Validate input
    if (!email || !password || !name) {
      return res.status(400).json({ error: 'Email, password, and name are required' });
    }

    // Check if user already exists
    if (users.has(email)) {
      return res.status(409).json({ error: 'User already exists' });
    }

    // Hash password
    const hashedPassword = await bcrypt.hash(password, 10);

    // Create user
    const user = {
      id: uuidv4(),
      email,
      name,
      password: hashedPassword,
      createdAt: new Date(),
      status: 'active'
    };

    users.set(email, user);

    return res.status(201).json({
      message: 'User registered successfully',
      user: {
        id: user.id,
        email: user.email,
        name: user.name
      }
    });
  } catch (error) {
    console.error('Registration error:', error);
    return res.status(500).json({ error: 'Internal server error' });
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

    // Validate input
    if (!email || !password) {
      return res.status(400).json({ error: 'Email and password are required' });
    }

    // Find user
    const user = users.get(email);
    if (!user) {
      return res.status(401).json({ error: 'Invalid credentials' });
    }

    // Compare password
    const isPasswordValid = await bcrypt.compare(password, user.password);
    if (!isPasswordValid) {
      return res.status(401).json({ error: 'Invalid credentials' });
    }

    // Generate session token
    const sessionToken = uuidv4();
    user.sessionToken = sessionToken;
    user.lastLoginAt = new Date();

    return res.status(200).json({
      message: 'Login successful',
      sessionToken,
      user: {
        id: user.id,
        email: user.email,
        name: user.name
      }
    });
  } catch (error) {
    console.error('Login error:', error);
    return res.status(500).json({ error: 'Internal server error' });
  }
};

/**
 * Get current user
 * @param {Object} req - Express request
 * @param {Object} res - Express response
 */
exports.getCurrentUser = async (req, res) => {
  try {
    const sessionToken = req.headers.authorization?.split(' ')[1];

    if (!sessionToken) {
      return res.status(401).json({ error: 'Unauthorized' });
    }

    // Find user by session token
    let currentUser = null;
    for (const [, user] of users) {
      if (user.sessionToken === sessionToken) {
        currentUser = user;
        break;
      }
    }

    if (!currentUser) {
      return res.status(401).json({ error: 'Unauthorized' });
    }

    return res.status(200).json({
      user: {
        id: currentUser.id,
        email: currentUser.email,
        name: currentUser.name,
        createdAt: currentUser.createdAt
      }
    });
  } catch (error) {
    console.error('Get user error:', error);
    return res.status(500).json({ error: 'Internal server error' });
  }
};

/**
 * Logout user
 * @param {Object} req - Express request
 * @param {Object} res - Express response
 */
exports.logout = async (req, res) => {
  try {
    const sessionToken = req.headers.authorization?.split(' ')[1];

    if (!sessionToken) {
      return res.status(401).json({ error: 'Unauthorized' });
    }

    // Find and clear session
    for (const [, user] of users) {
      if (user.sessionToken === sessionToken) {
        delete user.sessionToken;
        break;
      }
    }

    return res.status(200).json({ message: 'Logout successful' });
  } catch (error) {
    console.error('Logout error:', error);
    return res.status(500).json({ error: 'Internal server error' });
  }
};

/**
 * Update user profile
 * @param {Object} req - Express request
 * @param {Object} res - Express response
 */
exports.updateProfile = async (req, res) => {
  try {
    const sessionToken = req.headers.authorization?.split(' ')[1];
    const { name, email } = req.body;

    if (!sessionToken) {
      return res.status(401).json({ error: 'Unauthorized' });
    }

    // Find user
    let currentUser = null;
    for (const [, user] of users) {
      if (user.sessionToken === sessionToken) {
        currentUser = user;
        break;
      }
    }

    if (!currentUser) {
      return res.status(401).json({ error: 'Unauthorized' });
    }

    if (name) currentUser.name = name;
    if (email && email !== currentUser.email) {
      if (users.has(email)) {
        return res.status(409).json({ error: 'Email already in use' });
      }
      users.delete(currentUser.email);
      currentUser.email = email;
      users.set(email, currentUser);
    }

    return res.status(200).json({
      message: 'Profile updated successfully',
      user: {
        id: currentUser.id,
        email: currentUser.email,
        name: currentUser.name
      }
    });
  } catch (error) {
    console.error('Update profile error:', error);
    return res.status(500).json({ error: 'Internal server error' });
  }
};

exports.users = users;
