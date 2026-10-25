const crypto = require('crypto');
const { v4: uuidv4 } = require('uuid');
const jwt = require('jsonwebtoken');
const bcrypt = require('bcryptjs');

const users = new Map();
const magicLinks = new Map();

exports.register = async (req, res) => {
  try {
    const { email, name } = req.body;
    if (users.has(email)) return res.status(409).json({ error: 'User already exists' });

    const user = { id: uuidv4(), email, name, createdAt: new Date() };
    users.set(email, user);
    res.status(201).json({ message: 'User registered', user });
  } catch (error) {
    res.status(500).json({ error: 'Registration failed' });
  }
};

exports.sendMagicLink = async (req, res) => {
  try {
    const { email } = req.body;
    const user = users.get(email);
    if (!user) return res.status(404).json({ error: 'User not found' });

    const token = crypto.randomBytes(32).toString('hex');
    const linkId = uuidv4();
    magicLinks.set(token, {
      userId: user.id,
      email,
      createdAt: new Date(),
      expiresAt: new Date(Date.now() + 15 * 60 * 1000),
      used: false
    });

    // In production, send email with magic link
    // const link = `${process.env.FRONTEND_URL}/auth/verify/${token}`;
    // await sendEmail(email, link);

    res.json({ message: 'Magic link sent', token }); // In production, don't return token
  } catch (error) {
    res.status(500).json({ error: 'Failed to send magic link' });
  }
};

exports.verifyMagicLink = async (req, res) => {
  try {
    const { token } = req.params;
    const magicLink = magicLinks.get(token);

    if (!magicLink || magicLink.used || new Date() > magicLink.expiresAt) {
      return res.status(401).json({ error: 'Invalid or expired link' });
    }

    magicLink.used = true;
    const user = Array.from(users.values()).find(u => u.id === magicLink.userId);
    const accessToken = jwt.sign({ userId: user.id, email: user.email }, process.env.JWT_SECRET || 'secret', { expiresIn: '15m' });

    res.json({ accessToken, user });
  } catch (error) {
    res.status(500).json({ error: 'Authentication failed' });
  }
};

exports.getCurrentUser = (req, res) => {
  try {
    const user = Array.from(users.values()).find(u => u.id === req.user.userId);
    if (!user) return res.status(404).json({ error: 'User not found' });
    res.json({ user });
  } catch (error) {
    res.status(500).json({ error: 'Failed to fetch user' });
  }
};

exports.logout = (req, res) => {
  res.json({ message: 'Logged out successfully' });
};
