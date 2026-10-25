const express = require('express');
const app = express();
app.use(express.json());

const PORT = process.env.PORT || 3012;

// Module 12: Express Routing Internals

// Basic routes
app.get('/api/routing/simple', (req, res) => {
  res.json({ method: 'GET', path: '/simple' });
});

app.post('/api/routing/simple', (req, res) => {
  res.json({ method: 'POST', path: '/simple' });
});

// Parameterized routes
app.get('/api/routing/users/:id', (req, res) => {
  res.json({
    path: '/users/:id',
    params: { id: req.params.id }
  });
});

// Regex routes
app.get('/api/routing/file/:filename(\\w+\\.\\w+)', (req, res) => {
  res.json({
    pattern: 'file/:filename(pattern)',
    filename: req.params.filename
  });
});

// Route matching principles
app.get('/api/routing/info', (req, res) => {
  res.json({
    priority: [
      '1. Literal paths (exact match)',
      '2. Parameterized paths',
      '3. Regex patterns',
      '4. Wildcards (*)'
    ],
    example: {
      '/users/123': 'Matches /users/:id with id=123',
      '/users/john': 'Also matches, id=john',
      '/posts/:id/comments/:commentId': 'Multiple params'
    }
  });
});

// Query parameters
app.get('/api/routing/search', (req, res) => {
  res.json({
    path: '/search',
    query: req.query,
    example: '/search?q=nodejs&limit=10'
  });
});

// Route handlers - multiple
app.get('/api/routing/multi',
  (req, res, next) => {
    req.step1 = 'initialized';
    next();
  },
  (req, res, next) => {
    req.step2 = 'processed';
    next();
  },
  (req, res) => {
    res.json({
      middleware: [req.step1, req.step2]
    });
  }
);

// Custom middleware
const loggingMiddleware = (req, res, next) => {
  req.timestamp = Date.now();
  next();
};

const authMiddleware = (req, res, next) => {
  if (req.query.token) {
    next();
  } else {
    res.status(401).json({ error: 'No token' });
  }
};

app.get('/api/routing/protected',
  loggingMiddleware,
  authMiddleware,
  (req, res) => {
    res.json({
      protected: true,
      loadTime: Date.now() - req.timestamp + 'ms'
    });
  }
);

// Error handling middleware
app.get('/api/routing/error', (req, res, next) => {
  next(new Error('Test error'));
});

app.use((err, req, res, next) => {
  res.status(500).json({
    error: err.message,
    middleware: 'Error handler'
  });
});

// Route groups
const router = express.Router();

router.get('/list', (req, res) => {
  res.json({ operation: 'list' });
});

router.post('/create', (req, res) => {
  res.json({ operation: 'create' });
});

router.put('/:id', (req, res) => {
  res.json({ operation: 'update', id: req.params.id });
});

router.delete('/:id', (req, res) => {
  res.json({ operation: 'delete', id: req.params.id });
});

app.use('/api/routing/items', router);

// Route versioning
const v1Router = express.Router();
v1Router.get('/data', (req, res) => {
  res.json({ version: 'v1', data: 'old format' });
});

const v2Router = express.Router();
v2Router.get('/data', (req, res) => {
  res.json({ version: 'v2', data: { format: 'new' } });
});

app.use('/api/v1', v1Router);
app.use('/api/v2', v2Router);

// Advanced routing info
app.get('/api/routing/advanced', (req, res) => {
  res.json({
    concepts: {
      ROUTING: {
        definition: 'Mapping URLs to handlers',
        key: 'Express router matches paths'
      },
      PATH_PARAMS: {
        syntax: '/:paramName',
        access: 'req.params.paramName'
      },
      QUERY_STRING: {
        syntax: '?key=value&key2=value2',
        access: 'req.query.key'
      },
      MIDDLEWARE: {
        purpose: 'Pre/post processing',
        execution: 'Sequential'
      },
      ROUTING_ORDER: {
        rule: 'First match wins',
        tip: 'Order matters!'
      }
    }
  });
});

// Performance optimization routes
app.get('/api/routing/performance', (req, res) => {
  res.json({
    tips: [
      'Group related routes with Router',
      'Place specific routes before general ones',
      'Use middleware only where needed',
      'Cache route matching when possible',
      'Avoid regex when literals work',
      'Profile slow routes'
    ],
    expressInternals: {
      routing: 'Trie-based path matching',
      params: 'Extracted via regex on demand',
      middleware: 'Chained function execution',
      matching: 'Left-to-right string comparison'
    }
  });
});

// Route inspection
app.get('/api/routing/inspect-routes', (req, res) => {
  const routes = [];

  app._router.stack.forEach(middleware => {
    if (middleware.route) {
      // Route
      routes.push({
        path: middleware.route.path,
        methods: Object.keys(middleware.route.methods)
      });
    } else if (middleware.name === 'router') {
      // Router
      middleware.handle.stack.forEach(handler => {
        if (handler.route) {
          routes.push({
            path: middleware.regexp.toString(),
            route: handler.route.path,
            methods: Object.keys(handler.route.methods)
          });
        }
      });
    }
  });

  res.json({ registeredRoutes: routes.length, routes: routes.slice(0, 20) });
});

app.listen(PORT, () => {
  console.log(`🚀 Express Routing server on http://localhost:${PORT}`);
  console.log('📚 API Endpoints:');
  console.log('  GET /api/routing/simple - Simple route');
  console.log('  GET /api/routing/users/:id - Parameterized route');
  console.log('  GET /api/routing/search?q=... - Query parameters');
  console.log('  GET /api/routing/protected?token=... - Protected route');
  console.log('  GET /api/routing/items/* - Router group');
  console.log('  GET /api/v1/data - API versioning v1');
  console.log('  GET /api/v2/data - API versioning v2');
  console.log('  GET /api/routing/advanced - Advanced concepts');
  console.log('  GET /api/routing/performance - Performance tips');
  console.log('  GET /api/routing/inspect-routes - Route inspection');
});

module.exports = app;
