/**
 * Express Routing Internals Controller
 * Demonstrates routing patterns and middleware order
 */

// ============================================
// Basic Route Handler
// ============================================

exports.basicRoute = (req, res) => {
  res.json({
    operation: 'basic_route',
    method: req.method,
    path: req.path,
    url: req.url,
  });
};

// ============================================
// Route with Parameters
// ============================================

exports.routeWithParams = (req, res) => {
  const { id } = req.params;
  res.json({
    operation: 'route_with_params',
    id,
    param: 'Successfully extracted from URL',
  });
};

// ============================================
// Route with Query Parameters
// ============================================

exports.routeWithQuery = (req, res) => {
  const { page = 1, limit = 10, search = '' } = req.query;
  res.json({
    operation: 'route_with_query',
    pagination: {
      page: parseInt(page),
      limit: parseInt(limit),
    },
    search,
    note: 'Query params are accessible via req.query',
  });
};

// ============================================
// Nested Routes
// ============================================

exports.nestedRoute = (req, res) => {
  const { userId, itemId } = req.params;
  res.json({
    operation: 'nested_route',
    userId,
    itemId,
    pattern: '/users/:userId/items/:itemId',
  });
};

// ============================================
// Wildcard Routes
// ============================================

exports.wildcardRoute = (req, res) => {
  res.json({
    operation: 'wildcard_route',
    path: req.path,
    note: 'This matches any remaining path',
  });
};

// ============================================
// Middleware Order Demonstration
// ============================================

exports.middlewareOrder = (req, res) => {
  const middlewareTrace = req.middlewareTrace || [];
  res.json({
    operation: 'middleware_order',
    trace: middlewareTrace,
    note: 'Middleware executes in registration order',
  });
};

// ============================================
// Route Handler with Multiple Methods
// ============================================

exports.getItem = (req, res) => {
  const { id } = req.params;
  res.json({
    operation: 'get_item',
    method: 'GET',
    id,
    data: { id, name: `Item ${id}`, created: new Date() },
  });
};

exports.createItem = (req, res) => {
  const { name } = req.body;
  res.status(201).json({
    operation: 'create_item',
    method: 'POST',
    created: { id: 'new-id', name },
  });
};

exports.updateItem = (req, res) => {
  const { id } = req.params;
  const { name } = req.body;
  res.json({
    operation: 'update_item',
    method: 'PUT',
    id,
    updated: { id, name },
  });
};

exports.deleteItem = (req, res) => {
  const { id } = req.params;
  res.json({
    operation: 'delete_item',
    method: 'DELETE',
    id,
    deleted: true,
  });
};

// ============================================
// Route Matching Rules
// ============================================

exports.getRoutingRules = (req, res) => {
  res.json({
    operation: 'routing_rules',
    rules: [
      'Exact path match takes highest priority',
      'Dynamic segments match any URL segment',
      'Wildcard (*) matches any remaining path',
      'Regex patterns can be used for complex matching',
      'Later routes can override earlier routes if more specific',
    ],
    examples: {
      exact: '/api/users',
      dynamic: '/api/users/:id',
      dynamic_nested: '/api/users/:userId/posts/:postId',
      regex: '/api/users/\\d+',
      wildcard: '/api/*',
    },
  });
};

// ============================================
// Express Router Instance
// ============================================

exports.subrouterInfo = (req, res) => {
  res.json({
    operation: 'subrouter_info',
    note: 'This route is handled by an Express Router instance',
    pattern: 'router.get() / router.post() / etc',
    benefits: [
      'Organize routes into separate files',
      'Mount subrouters at different paths',
      'Share middleware across related routes',
      'Modularize API structure',
    ],
  });
};

// ============================================
// Regular Expression Routes
// ============================================

exports.regexRoute = (req, res) => {
  res.json({
    operation: 'regex_route',
    matched: req.params,
    regex: '/api/files/:filename(.*)',
    note: 'Filename can include multiple dots and extensions',
  });
};

// ============================================
// Optional Parameters
// ============================================

exports.optionalParams = (req, res) => {
  const { category, subCategory } = req.params;
  res.json({
    operation: 'optional_params',
    category: category || 'none',
    subCategory: subCategory || 'none',
    pattern: '/api/products/:category*/:subCategory*',
  });
};

// ============================================
// Route Priority
// ============================================

exports.routePriority = (req, res) => {
  res.json({
    operation: 'route_priority',
    rules: [
      'Exact routes: /api/users/me',
      'Dynamic routes: /api/users/:id',
      'Wildcard routes: /api/*',
    ],
    example:
      'For GET /api/users/me - exact route matches even though dynamic route also matches',
  });
};

// ============================================
// Route Chaining
// ============================================

exports.routeChaining = (req, res) => {
  res.json({
    operation: 'route_chaining',
    note: 'Multiple methods can be chained on the same path',
    example: "router.route('/api/items/:id').get(...).post(...).put(...).delete(...)",
  });
};
