/**
 * Module 13.4: Utility Types Middleware
 */

// Validation middleware for Partial pattern
export const validatePartialUpdate = (req, res, next) => {
  if (!req.body || Object.keys(req.body).length === 0) {
    return res.status(400).json({
      ok: false,
      error: 'Request body cannot be empty'
    });
  }
  next();
};

// Validation middleware for user creation
export const validateUserCreation = (req, res, next) => {
  const { name, email, password } = req.body;

  const errors = {};
  if (!name) errors.name = 'Name is required';
  if (!email) errors.email = 'Email is required';
  if (!email?.includes('@')) errors.email = 'Invalid email format';
  if (!password) errors.password = 'Password is required';
  if (password?.length < 6) errors.password = 'Password must be at least 6 characters';

  if (Object.keys(errors).length > 0) {
    return res.status(400).json({ ok: false, errors });
  }

  next();
};

// Validation middleware for role validation
export const validateRole = (req, res, next) => {
  const validRoles = ['admin', 'moderator', 'user', 'guest'];
  const { role } = req.body;

  if (role && !validRoles.includes(role)) {
    return res.status(400).json({
      ok: false,
      error: 'Invalid role: ' + role
    });
  }

  next();
};

// Validation middleware for permission checking
export const validatePermissionCheck = (req, res, next) => {
  const { role, action } = req.body;

  if (!role) {
    return res.status(400).json({ ok: false, error: 'Role is required' });
  }

  if (!action) {
    return res.status(400).json({ ok: false, error: 'Action is required' });
  }

  next();
};

// Logging middleware for Utility Types operations
export const logUtilityTypesOperation = (req, res, next) => {
  const originalJson = res.json;

  res.json = function(data) {
    if (data.pattern) {
      console.log(`[Utility Type] ${data.pattern} at ${req.method} ${req.path}`);
    }
    return originalJson.call(this, data);
  };

  next();
};

// Error handling middleware for type operations
export const handleUtilityTypeErrors = (err, req, res, next) => {
  if (err.message && err.message.includes('required fields')) {
    return res.status(400).json({
      ok: false,
      error: err.message,
      pattern: 'Required<T> validation'
    });
  }

  res.status(500).json({
    ok: false,
    error: err.message || 'Internal server error'
  });
};

// Middleware to enforce readonly fields
export const enforceReadOnlyFields = (req, res, next) => {
  // Prevent modification of certain fields
  if (req.body.id) delete req.body.id;
  if (req.body.createdAt) delete req.body.createdAt;

  next();
};

// Middleware to pick only allowed fields
export const pickAllowedFields = (allowedFields) => {
  return (req, res, next) => {
    const filtered = {};
    allowedFields.forEach(field => {
      if (field in req.body) {
        filtered[field] = req.body[field];
      }
    });
    req.body = filtered;
    next();
  };
};

