const bcrypt = require('bcrypt');
const crypto = require('crypto');

// Get info about hashing algorithms
const getInfo = (req, res) => {
  res.json({
    title: "Password Hashing: bcrypt, Argon2, Scrypt",
    description: "Secure password hashing using different algorithms",
    algorithms: {
      bcrypt: { rounds: 12, cost: "Adaptive", salt: "Automatic" },
      argon2: { memory: "65536 KB", iterations: 3, parallelism: 4 },
      scrypt: { N: 16384, r: 8, p: 1 }
    },
    endpoints: {
      '/api/hash/bcrypt': 'Hash password with bcrypt',
      '/api/verify/bcrypt': 'Verify bcrypt hash',
      '/api/hash/md5': 'Hash with MD5 (demo only)',
      '/api/hash/sha256': 'Hash with SHA256',
      '/api/test': 'Get test data'
    }
  });
};

// Get test endpoint
const getTest = (req, res) => {
  res.json({
    message: 'Cryptography hashing test endpoint',
    timestamp: new Date().toISOString(),
    examples: {
      bcryptHash: '/api/hash/bcrypt?password=myPassword123',
      bcryptVerify: '/api/verify/bcrypt?password=myPassword123&hash=',
      sha256: '/api/hash/sha256?text=hello%20world',
      md5: '/api/hash/md5?text=hello%20world'
    }
  });
};

// Hash with bcrypt
const hashBcrypt = async (req, res) => {
  const { password, rounds = 12 } = req.query;
  
  if (!password) {
    return res.status(400).json({ error: 'password query parameter required' });
  }

  try {
    const salt = await bcrypt.genSalt(parseInt(rounds));
    const hash = await bcrypt.hash(password, salt);
    const time = new Date();
    
    res.json({
      algorithm: 'bcrypt',
      password,
      salt,
      hash,
      rounds: parseInt(rounds),
      hashLength: hash.length,
      timestamp: time.toISOString(),
      example: 'bcrypt.compare(password, hash) returns true/false'
    });
  } catch (err) {
    res.status(400).json({ error: 'Hashing failed: ' + err.message });
  }
};

// Verify bcrypt hash
const verifyBcrypt = async (req, res) => {
  const { password, hash } = req.query;
  
  if (!password || !hash) {
    return res.status(400).json({ error: 'password and hash query parameters required' });
  }

  try {
    const match = await bcrypt.compare(password, hash);
    
    res.json({
      algorithm: 'bcrypt',
      password,
      hash,
      match,
      hashLength: hash.length,
      passwordLength: password.length,
      timestamp: new Date().toISOString(),
      explanation: match ? 'Password matches the hash' : 'Password does not match'
    });
  } catch (err) {
    res.status(400).json({ error: 'Verification failed: ' + err.message });
  }
};

// SHA256 hash
const hashSHA256 = (req, res) => {
  const { text } = req.query;
  
  if (!text) {
    return res.status(400).json({ error: 'text query parameter required' });
  }

  try {
    const hash = crypto.createHash('sha256').update(text).digest('hex');
    
    res.json({
      algorithm: 'SHA256',
      text,
      hash,
      hashLength: hash.length,
      hexEncoded: true,
      deterministic: true,
      reversible: false,
      example: 'crypto.createHash("sha256").update(text).digest("hex")'
    });
  } catch (err) {
    res.status(400).json({ error: 'Hashing failed: ' + err.message });
  }
};

// MD5 hash (demonstration - NOT for passwords!)
const hashMD5 = (req, res) => {
  const { text } = req.query;
  
  if (!text) {
    return res.status(400).json({ error: 'text query parameter required' });
  }

  try {
    const hash = crypto.createHash('md5').update(text).digest('hex');
    
    res.json({
      algorithm: 'MD5',
      text,
      hash,
      hashLength: hash.length,
      hexEncoded: true,
      deterministic: true,
      reversible: false,
      warning: 'MD5 is cryptographically broken - do NOT use for passwords',
      example: 'crypto.createHash("md5").update(text).digest("hex")'
    });
  } catch (err) {
    res.status(400).json({ error: 'Hashing failed: ' + err.message });
  }
};

// Compare two strings visually
const compare = (req, res) => {
  const { text1, text2 } = req.query;
  
  if (!text1 || !text2) {
    return res.status(400).json({ error: 'text1 and text2 query parameters required' });
  }

  const hash1 = crypto.createHash('sha256').update(text1).digest('hex');
  const hash2 = crypto.createHash('sha256').update(text2).digest('hex');
  
  res.json({
    text1,
    text2,
    hash1,
    hash2,
    match: hash1 === hash2,
    text1Length: text1.length,
    text2Length: text2.length,
    explanation: 'Even one character difference produces completely different hashes'
  });
};

module.exports = {
  getInfo,
  getTest,
  hashBcrypt,
  verifyBcrypt,
  hashSHA256,
  hashMD5,
  compare