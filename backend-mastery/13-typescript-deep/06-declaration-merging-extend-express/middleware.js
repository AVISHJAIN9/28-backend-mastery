/**
 * Module 13.6: Declaration Merging & Express Augmentation Middleware
 */

// Augment request with user data
export const augmentRequestWithUser = (req, res, next) => {
  const authHeader = req.headers.authorization;
  
  // Parse Bearer token
  if (authHeader && authHeader.startsWith('Bearer ')) {
    const userId = parseInt(authHeader.split(' ')[1]) || 1;
    req.user = {
      id: userId,
      name: 'User ' + userId,
      role: userId === 1 ? 'admin' : 'user'
    };
  }
  
  next();
};

// Augment request with validation tracking
export const augmentRequestWithValidation = (req, res, next) => {
  req.validated = {
    fields: [],
    errors: []
  };
  
  next();
};

// Augment request with context
export const augmentRequestWithContext = (req, res, next) => {
  req.context = {
    requestId: 'req_' + Date.now() + '_' + Math.random().toString(36).substr(2, 9),
    startTime: Date.now(),
    method: req.method,
    path: req.path,
    ip: req.ip,
    userAgent: req.get('user-agent')
  };
  
  next();
};

// Augment response with success helper
export const augmentResponseWithHelpers = (req, res, next) => {
  // Helper: Send success response
  res.sendSuccess = function(data, message = null) {
    return this.json({
      ok: true,
      data,
      message,
      requestId: req.context?.requestId,
      timestamp: Date.now()
    });
  };

  // Helper: Send error response
  res.sendError = function(message, code = 'ERROR') {
    return this.status(400).json({
      ok: false,
      error: { message, code },
      requestId: req.context?.requestId,
      timestamp: Date.now()
    });
  };

  // Helper: Send paginated response
  res.sendPaginated = function(items, total, page = 1, pageSize = 10) {
    return this.json({
      ok: true,
      data: {
        items,
        total,
        page,
        pageSize,
        pages: Math.ceil(total / pageSize),
        hasMore: (page * pageSize) < total
      },
      requestId: req.context?.requestId,
      timestamp: Date.now()
    });
  };

  next();
};

// Authentication middleware using augmented request
export const requireAuth = (req, res, next) => {
  if (!req.user) {
    return res.status(401).json({
      ok: false,
      error: 'Authentication required',
      requestId: req.context?.requestId
    });
  }
  next();
};

// Authorization middleware
export const requireRole = (role) => {
  return (req, res, next) => {
    if (!req.user || req.user.role !== role) {
      return res.status(403).json({
        ok: false,
        error: 'Insufficient permissions',
        required: role,
        current: req.user?.role
      });
    }
    next();
  };
};

// Validation middleware
export const validateRequestBody = (requiredFields) => {
  return (req, res, next) => {
    const errors = {};
    
    requiredFields.forEach(field => {
      if (!(field in req.body) || req.body[field] === '') {
        errors[field] = field + ' is required';
      }
    });

    if (Object.keys(errors).length > 0) {
      req.validated.errors = errors;
      return res.status(400).json({
        ok: false,
        errors,
        requestId: req.context?.requestId
      });
    }

    req.validated.fields = requiredFields;
    next();
  };
};

// Context enhancement middleware
export const enhanceContextWithUser = (req, res, next) => {
  if (req.user && req.context) {
    req.context.userId = req.user.id;
    req.context.userRole = req.user.role;
    req.context.userName = req.user.name;
  }
  next();
};

// Request duration tracking
export const trackRequestDuration = (req, res, next) => {
  const originalJson = res.json;

  res.json = function(data) {
    const duration = Date.now() - req.context.startTime;
    
    if (data && typeof data === 'object') {
      data.duration = duration + 'ms';
    }
    
    return originalJson.call(this, data);
  };

  next();
};

// Error handler for augmented middleware
export const handleAugmentationErrors = (err, req, res, next) => {
  console.error('Augmentation error:', err);
  
  res.status(500).json({
    ok: false,
    error: err.message || 'Internal server error',
    requestId: req.context?.requestId,
    timestamp: Date.now()
  });
};
