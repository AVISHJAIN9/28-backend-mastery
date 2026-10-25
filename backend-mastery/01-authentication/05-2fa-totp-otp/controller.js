const bcrypt = require('bcryptjs');
const speakeasy = require('speakeasy');
const QRCode = require('qrcode');
const { v4: uuidv4 } = require('uuid');
const jwt = require('jsonwebtoken');

const users = new Map();
const sessions = new Map();

exports.register = async (req, res) => {
  try {
    const { email, password, name } = req.body;
    if (users.has(email)) {
      return res.status(409).json({ error: 'User already exists' });
    }

    const hashedPassword = await bcrypt.hash(password, 10);
    const user = { id: uuidv4(), email, name, password: hashedPassword, mfaEnabled: false };
    users.set(email, user);

    res.status(201).json({ message: 'User registered', user: { id: user.id, email, name } });
  } catch (error) {
    res.status(500).json({ error: 'Registration failed' });
  }
};

exports.login = async (req, res) => {
  try {
    const { email, password } = req.body;
    const user = users.get(email);

    if (!user || !(await bcrypt.compare(password, user.password))) {
      return res.status(401).json({ error: 'Invalid credentials' });
    }

    if (user.mfaEnabled) {
      const sessionToken = uuidv4();
      sessions.set(sessionToken, { userId: user.id, email, expiresAt: new Date(Date.now() + 5 * 60 * 1000) });
      return res.status(200).json({ message: 'MFA required', sessionToken, requiresMFA: true });
    }

    const accessToken = jwt.sign({ userId: user.id, email, mfaVerified: true }, process.env.JWT_SECRET || 'secret', { expiresIn: '15m' });
    res.json({ accessToken, user });
  } catch (error) {
    res.status(500).json({ error: 'Login failed' });
  }
};

exports.setupMFA = async (req, res) => {
  try {
    const user = Array.from(users.values()).find(u => u.id === req.user.userId);
    if (!user) return res.status(404).json({ error: 'User not found' });

    const secret = speakeasy.generateSecret({ name: `MyApp (${user.email})`, issuer: 'MyApp' });
    const qrCode = await QRCode.toDataURL(secret.otpauth_url);

    user.tempSecret = secret.base32;
    res.json({ qrCode, secret: secret.base32, backupCodes: generateBackupCodes(10) });
  } catch (error) {
    res.status(500).json({ error: 'MFA setup failed' });
  }
};

exports.verifyMFA = async (req, res) => {
  try {
    const { token, sessionToken } = req.body;
    const session = sessions.get(sessionToken);

    if (!session || new Date() > session.expiresAt) {
      return res.status(401).json({ error: 'Session expired' });
    }

    const user = Array.from(users.values()).find(u => u.id === session.userId);
    const verified = speakeasy.totp.verify({ secret: user.mfaSecret || user.tempSecret, encoding: 'base32', token });

    if (!verified) return res.status(401).json({ error: 'Invalid token' });

    if (!user.mfaEnabled) {
      user.mfaEnabled = true;
      user.mfaSecret = user.tempSecret;
      delete user.tempSecret;
    }

    const accessToken = jwt.sign({ userId: user.id, email: user.email, mfaVerified: true }, process.env.JWT_SECRET || 'secret', { expiresIn: '15m' });
    sessions.delete(sessionToken);
    res.json({ accessToken, message: 'MFA verified' });
  } catch (error) {
    res.status(500).json({ error: 'Verification failed' });
  }
};

exports.getBackupCodes = async (req, res) => {
  try {
    const user = Array.from(users.values()).find(u => u.id === req.user.userId);
    if (!user) return res.status(404).json({ error: 'User not found' });

    const backupCodes = generateBackupCodes(10);
    user.backupCodes = backupCodes.map(code => ({ code: bcrypt.hashSync(code, 10), used: false }));

    res.json({ backupCodes: backupCodes.map(c => ({ code: c })), message: 'Save these codes in a secure place' });
  } catch (error) {
    res.status(500).json({ error: 'Failed to generate backup codes' });
  }
};

exports.getCurrentUser = (req, res) => {
  try {
    const user = Array.from(users.values()).find(u => u.id === req.user.userId);
    if (!user) return res.status(404).json({ error: 'User not found' });

    res.json({ user: { id: user.id, email: user.email, name: user.name, mfaEnabled: user.mfaEnabled } });
  } catch (error) {
    res.status(500).json({ error: 'Failed to fetch user' });
  }
};

function generateBackupCodes(count) {
  const codes = [];
  for (let i = 0; i < count; i++) {
    codes.push(Math.random().toString(36).substring(2, 10).toUpperCase());
  }
  return codes;
}

