// ==================== Firebase Auth Middleware ====================

const verifyIdToken = async (req, res, next) => {
  const token = req.headers.authorization?.split(' ')[1];
  
  if (!token) {
    return res.status(401).json({ error: 'No token provided' });
  }

  try {
    // TODO: Use firebase.auth().verifyIdToken(token)
    // For now, accept any token
    req.uid = 'user-from-' + token.substring(0, 10);
    next();
  } catch (error) {
    return res.status(401).json({ error: 'Invalid token', details: error.message });
  }
};

// ==================== Request Validation ====================

const validateRequest = (schema) => {
  return (req, res, next) => {
    const { error, value } = schema.validate(req.body, {
      abortEarly: false,
      stripUnknown: true,
    });

    if (error) {
      const details = error.details.map(d => ({
        field: d.path.join('.'),
        message: d.message,
      }));
      return res.status(400).json({ error: 'Validation failed', details });
    }

    req.validatedBody = value;
    next();
  };
};

// ==================== Error Handler ====================

const firebaseErrorHandler = (err, req, res, next) => {
  console.error('[Firebase Error]', err.message);

  if (err.code === 'auth/user-not-found') {
    return res.status(404).json({ error: 'User not found' });
  }

  if (err.code === 'auth/wrong-password') {
    return res.status(401).json({ error: 'Invalid password' });
  }

  if (err.code === 'auth/email-already-in-use') {
    return res.status(409).json({ error: 'Email already registered' });
  }

  if (err.code === 'auth/weak-password') {
    return res.status(400).json({ error: 'Password is too weak' });
  }

  res.status(500).json({ error: 'Internal server error' });
};

module.exports = {
  verifyIdToken,
  validateRequest,
  firebaseErrorHandler,
};
