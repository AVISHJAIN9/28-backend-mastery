const ldap = require('ldapjs');
const { v4: uuidv4 } = require('uuid');

// In-memory cache
const userCache = new Map();
const sessionTokens = new Map();

/**
 * Create LDAP client connection
 * @returns {Object} LDAP client
 */
const createLdapClient = () => {
  return ldap.createClient({
    url: process.env.LDAP_URL || 'ldap://localhost:389',
    timeout: 5000,
    connectTimeout: 10000
  });
};

/**
 * Search user in LDAP directory
 * @param {string} username - Username or email
 * @returns {Promise<Object>} User object from LDAP
 */
const searchLdapUser = async (username) => {
  return new Promise((resolve, reject) => {
    const client = createLdapClient();
    const baseDn = process.env.LDAP_BASE_DN || 'dc=example,dc=com';
    const searchFilter = `(|(uid=${username})(mail=${username}))`;

    client.search(baseDn, { filter: searchFilter, scope: 'sub' }, (err, res) => {
      if (err) {
        client.unbind();
        return reject(err);
      }

      let user = null;

      res.on('searchEntry', entry => {
        user = entry.object;
      });

      res.on('error', err => {
        client.unbind();
        reject(err);
      });

      res.on('end', () => {
        client.unbind();
        if (user) {
          resolve(user);
        } else {
          reject(new Error('User not found in LDAP'));
        }
      });
    });
  });
};

/**
 * Bind user (verify credentials against LDAP)
 * @param {string} userDn - User's distinguished name
 * @param {string} password - User's password
 * @returns {Promise<boolean>} True if credentials valid
 */
const bindUser = async (userDn, password) => {
  return new Promise((resolve, reject) => {
    const client = createLdapClient();

    client.bind(userDn, password, (err) => {
      if (err) {
        client.unbind();
        return resolve(false);
      }
      client.unbind();
      resolve(true);
    });
  });
};

/**
 * Get user groups from LDAP
 * @param {string} userDn - User's distinguished name
 * @returns {Promise<Array>} Array of group DNs
 */
const getUserGroups = async (userDn) => {
  return new Promise((resolve, reject) => {
    const client = createLdapClient();
    const baseDn = process.env.LDAP_BASE_DN || 'dc=example,dc=com';

    // Search for groups containing this user
    const searchFilter = `(member=${userDn})`;

    client.search(baseDn, { filter: searchFilter, scope: 'sub' }, (err, res) => {
      if (err) {
        client.unbind();
        return reject(err);
      }

      const groups = [];

      res.on('searchEntry', entry => {
        groups.push({
          dn: entry.dn,
          cn: entry.object.cn,
          description: entry.object.description
        });
      });

      res.on('error', err => {
        client.unbind();
        reject(err);
      });

      res.on('end', () => {
        client.unbind();
        resolve(groups);
      });
    });
  });
};

/**
 * Login user using LDAP credentials
 * @param {Object} req - Express request
 * @param {Object} res - Express response
 */
exports.login = async (req, res) => {
  try {
    const { username, password } = req.body;

    if (!username || !password) {
      return res.status(400).json({
        error: 'Username and password required'
      });
    }

    // Search for user in LDAP
    const user = await searchLdapUser(username);

    // Verify password by binding
    const isValid = await bindUser(user.dn, password);

    if (!isValid) {
      return res.status(401).json({
        error: 'Invalid credentials'
      });
    }

    // Get user groups
    const groups = await getUserGroups(user.dn);

    // Create session token
    const sessionToken = require('crypto').randomBytes(32).toString('hex');
    const userId = uuidv4();

    sessionTokens.set(sessionToken, {
      userId,
      username: user.uid || user.mail,
      dn: user.dn,
      createdAt: new Date(),
      expiresAt: new Date(Date.now() + 24 * 60 * 60 * 1000)
    });

    // Cache user data
    userCache.set(userId, {
      id: userId,
      username: user.uid || user.mail,
      email: user.mail,
      fullName: user.cn,
      dn: user.dn,
      department: user.departmentNumber,
      groups: groups,
      lastLogin: new Date()
    });

    return res.status(200).json({
      message: 'Login successful',
      sessionToken,
      user: {
        id: userId,
        username: user.uid || user.mail,
        email: user.mail,
        fullName: user.cn,
        groups: groups.map(g => g.cn)
      },
      expiresIn: 86400
    });
  } catch (error) {
    console.error('LDAP login error:', error);
    return res.status(401).json({
      error: 'Authentication failed',
      details: error.message
    });
  }
};

/**
 * Search LDAP users
 * @param {Object} req - Express request
 * @param {Object} res - Express response
 */
exports.searchUsers = async (req, res) => {
  try {
    const { query, limit = 10 } = req.query;

    if (!query) {
      return res.status(400).json({
        error: 'Search query required'
      });
    }

    return new Promise((resolve, reject) => {
      const client = createLdapClient();
      const baseDn = process.env.LDAP_BASE_DN || 'dc=example,dc=com';
      const searchFilter = `(|(uid=*${query}*)(cn=*${query}*)(mail=*${query}*))`;

      client.search(baseDn, { filter: searchFilter, scope: 'sub' }, (err, res2) => {
        if (err) {
          client.unbind();
          return reject(err);
        }

        const users = [];

        res2.on('searchEntry', entry => {
          if (users.length < parseInt(limit)) {
            users.push({
              uid: entry.object.uid,
              mail: entry.object.mail,
              cn: entry.object.cn,
              department: entry.object.departmentNumber,
              dn: entry.dn
            });
          }
        });

        res2.on('error', err => {
          client.unbind();
          reject(err);
        });

        res2.on('end', () => {
          client.unbind();
          resolve(users);
        });
      });
    }).then(users => {
      res.status(200).json({
        total: users.length,
        users
      });
    }).catch(error => {
      res.status(500).json({
        error: 'User search failed',
        details: error.message
      });
    });
  } catch (error) {
    console.error('Search error:', error);
    res.status(500).json({
      error: 'Search failed'
    });
  }
};

/**
 * Get current user info
 * @param {Object} req - Express request
 * @param {Object} res - Express response
 */
exports.getCurrentUser = async (req, res) => {
  try {
    const userId = req.userId;

    if (!userId || !userCache.has(userId)) {
      return res.status(401).json({
        error: 'User not found'
      });
    }

    const user = userCache.get(userId);

    return res.status(200).json({
      user
    });
  } catch (error) {
    console.error('Get user error:', error);
    return res.status(500).json({
      error: 'Failed to fetch user'
    });
  }
};

/**
 * Get user groups
 * @param {Object} req - Express request
 * @param {Object} res - Express response
 */
exports.getUserGroups = async (req, res) => {
  try {
    const userId = req.userId;
    const user = userCache.get(userId);

    if (!user) {
      return res.status(401).json({
        error: 'User not found'
      });
    }

    return res.status(200).json({
      groups: user.groups || []
    });
  } catch (error) {
    console.error('Get groups error:', error);
    return res.status(500).json({
      error: 'Failed to fetch groups'
    });
  }
};

/**
 * Logout user
 * @param {Object} req - Express request
 * @param {Object} res - Express response
 */
exports.logout = async (req, res) => {
  try {
    const token = req.headers.authorization?.split(' ')[1];

    if (token) {
      sessionTokens.delete(token);
    }

    return res.status(200).json({
      message: 'Logout successful'
    });
  } catch (error) {
    console.error('Logout error:', error);
    return res.status(500).json({
      error: 'Logout failed'
    });
  }
};

/**
 * Verify session token
 * @param {Object} req - Express request
 * @param {Object} res - Express response
 */
exports.verifyToken = async (req, res) => {
  try {
    const token = req.headers.authorization?.split(' ')[1];

    if (!token || !sessionTokens.has(token)) {
      return res.status(401).json({
        error: 'Invalid token'
      });
    }

    const session = sessionTokens.get(token);

    if (session.expiresAt < new Date()) {
      sessionTokens.delete(token);
      return res.status(401).json({
        error: 'Token expired'
      });
    }

    return res.status(200).json({
      message: 'Token is valid',
      session: {
        username: session.username,
        expiresAt: session.expiresAt
      }
    });
  } catch (error) {
    console.error('Token verification error:', error);
    return res.status(500).json({
      error: 'Verification failed'
    });
  }
};

/**
 * Update password in LDAP
 * @param {Object} req - Express request
 * @param {Object} res - Express response
 */
exports.changePassword = async (req, res) => {
  try {
    const { oldPassword, newPassword } = req.body;
    const userId = req.userId;

    if (!userId || !userCache.has(userId)) {
      return res.status(401).json({
        error: 'User not found'
      });
    }

    const user = userCache.get(userId);

    // Verify old password
    const isValid = await bindUser(user.dn, oldPassword);
    if (!isValid) {
      return res.status(401).json({
        error: 'Invalid current password'
      });
    }

    // Note: Password modification in LDAP requires admin rights
    // This is a placeholder implementation
    // Real implementation would require LDAP admin context

    return res.status(200).json({
      message: 'Password change initiated',
      note: 'Contact LDAP administrator for password changes'
    });
  } catch (error) {
    console.error('Password change error:', error);
    return res.status(500).json({
      error: 'Password change failed'
    });
  }
};
