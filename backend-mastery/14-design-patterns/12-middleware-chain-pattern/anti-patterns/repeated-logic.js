/**
 * ANTI-PATTERN: No Middleware - Repeated Logic
 * 
 * Same logic duplicated in every handler.
 */

app.post('/api/users', (req, res) => {
  // Logging
  console.log('Request:', req.path);
  
  // Auth check
  if (!req.headers.authorization) {
    return res.status(401).send('Unauthorized');
  }
  
  // Business logic
  const user = createUser(req.body);
  res.json(user);
});

app.post('/api/posts', (req, res) => {
  // Same logging
  console.log('Request:', req.path);
  
  // Same auth check
  if (!req.headers.authorization) {
    return res.status(401).send('Unauthorized');
  }
  
  // Different business logic
  const post = createPost(req.body);
  res.json(post);
});

console.log('=== ANTI-PATTERN: Repeated Logic ===\n');
console.log('✗ Auth check duplicated');
console.log('✗ Logging duplicated');
console.log('✗ Hard to change auth logic globally');
console.log('✗ Violates DRY principle');

module.exports = {};
