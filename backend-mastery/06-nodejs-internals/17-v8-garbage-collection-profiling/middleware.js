// Middleware for route handlers

const middleware = {
  validateRequest: (req, res, next) => {
    // Validate incoming request
    if (req.method === 'POST' || req.method === 'PUT') {
      if (!req.body || Object.keys(req.body).length === 0) {
        return res.status(400).json({ error: 'Request body is required' });
      }
    }
    next();
  },

  authenticate: (req, res, next) => {
    // Check for authentication token
    const token = req.headers.authorization?.split(' ')[1];
    if (!token) {
      return res.status(401).json({ error: 'No token provided' });
    }
    // Add user to request
    req.user = { id: 1 };
    next();
  },

  errorHandler: (err, req, res, next) => {
    console.error('Middleware error:', err);
    res.status(err.status || 500).json({
      error: err.message || 'Internal server error'
    });
  }
};

module.exports = middleware;
