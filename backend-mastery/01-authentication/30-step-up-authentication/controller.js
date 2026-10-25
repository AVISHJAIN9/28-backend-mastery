const { v4: uuidv4 } = require('uuid');
const crypto = require('crypto');
const jwt = require('jsonwebtoken');

// Step-up session store
const stepUpSessions = new Map();
const frequentOperations = new Map();

/**
 * Initiate step-up authentication
 * User must re-authenticate before sensitive operation
 */
exports.initiateStepUp = async (req, res) => {
  try {
    const { operation, details } = req.body;
    const userId = req.user?.id || uuidv4();

    if (!operation) {
      return res.status(400).json({ error: 'Operation required' });
    }

    // Create challenge
    const challenge = crypto.randomBytes(32).toString('hex');
    const sessionId = uuidv4();

    stepUpSessions.set(sessionId, {
      userId,
      operation,
      challenge,
      createdAt: new Date(),
      expiresAt: new Date(Date.now() + 10 * 60 * 1000), // 10 minutes
      verified: false,
      details
    });

    return res.status(200).json({
      message: 'Step-up authentication required',
      sessionId,
      challenge,
      expiresIn: 600 // seconds
    });
  } catch (error) {
    console.error('Step-up initiation error:', error);
    return res.status(500).json({ error: 'Failed to initiate step-up' });
  }
};

/**
 * Verify step-up with password/MFA
 */
exports.verifyStepUp = async (req, res) => {
  try {
    const { sessionId, password, mfaCode } = req.body;

    if (!sessionId || !password) {
      return res.status(400).json({ error: 'SessionId and password required' });
    }

    const session = stepUpSessions.get(sessionId);

    if (!session) {
      return res.status(404).json({ error: 'Step-up session not found' });
    }

    if (session.expiresAt < new Date()) {
      stepUpSessions.delete(sessionId);
      return res.status(401).json({ error: 'Step-up session expired' });
    }

    // Verify password (in production: bcrypt compare)
    // This is simplified - always succeeds for demo
    if (!password || password.length < 6) {
      return res.status(401).json({ error: 'Invalid credentials' });
    }

    // Verify MFA if required
    if (session.details?.requireMfa && !mfaCode) {
      return res.status(401).json({ error: 'MFA code required' });
    }

    // Mark session as verified
    session.verified = true;
    session.verifiedAt = new Date();

    // Create step-up token
    const stepUpToken = jwt.sign(
      { sessionId, operation: session.operation, level: 'step-up' },
      process.env.JWT_SECRET || 'secret',
      { expiresIn: '1h' }
    );

    // Track operation
    if (!frequentOperations.has(session.userId)) {
      frequentOperations.set(session.userId, []);
    }
    frequentOperations.get(session.userId).push({
      operation: session.operation,
      timestamp: new Date(),
      status: 'allowed'
    });

    return res.status(200).json({
      message: 'Step-up authentication verified',
      stepUpToken,
      operation: session.operation,
      expiresIn: 3600
    });
  } catch (error) {
    console.error('Step-up verification error:', error);
    return res.status(500).json({ error: 'Verification failed' });
  }
};

/**
 * Check if operation requires step-up
 */
exports.requiresStepUp = async (req, res) => {
  try {
    const { operation } = req.query;

    if (!operation) {
      return res.status(400).json({ error: 'Operation required' });
    }

    // Define sensitive operations
    const sensitiveOps = [
      'change_password',
      'delete_account',
      'modify_payment',
      'change_email',
      'enable_2fa',
      'disable_2fa',
      'modify_permissions'
    ];

    const requires = sensitiveOps.includes(operation);

    return res.status(200).json({
      operation,
      requiresStepUp: requires
    });
  } catch (error) {
    console.error('Error checking step-up requirement:', error);
    return res.status(500).json({ error: 'Check failed' });
  }
};

/**
 * Perform sensitive operation (requires valid step-up token)
 */
exports.performSensitiveOperation = async (req, res) => {
  try {
    const token = req.headers['x-step-up-token'];

    if (!token) {
      return res.status(401).json({ error: 'Step-up token required' });
    }

    let decoded;
    try {
      decoded = jwt.verify(token, process.env.JWT_SECRET || 'secret');
    } catch (err) {
      return res.status(401).json({ error: 'Invalid step-up token' });
    }

    if (decoded.level !== 'step-up') {
      return res.status(401).json({ error: 'Not a step-up token' });
    }

    const { operation, data } = req.body;

    if (decoded.operation !== operation) {
      return res.status(403).json({ error: 'Step-up operation mismatch' });
    }

    // Perform operation
    const result = await performOperation(operation, data);

    return res.status(200).json({
      message: `${operation} completed successfully`,
      result
    });
  } catch (error) {
    console.error('Operation error:', error);
    return res.status(500).json({ error: 'Operation failed' });
  }
};

/**
 * Get user's recent operations
 */
exports.getRecentOperations = async (req, res) => {
  try {
    const userId = req.user?.id;

    if (!userId) {
      return res.status(401).json({ error: 'User not found' });
    }

    const operations = frequentOperations.get(userId) || [];
    const recent = operations.slice(-20);

    return res.status(200).json({
      operations: recent
    });
  } catch (error) {
    console.error('Error fetching operations:', error);
    return res.status(500).json({ error: 'Failed to fetch operations' });
  }
};

/**
 * Perform the actual operation
 */
const performOperation = async (operation, data) => {
  switch (operation) {
    case 'change_password':
      return { message: 'Password changed' };
    case 'delete_account':
      return { message: 'Account scheduled for deletion' };
    case 'modify_payment':
      return { message: 'Payment method updated' };
    case 'change_email':
      return { message: 'Email change initiated' };
    default:
      return { message: 'Operation completed' };
  }
};
