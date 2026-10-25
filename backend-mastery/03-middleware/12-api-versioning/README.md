# API Versioning Middleware

## What is this?
API versioning middleware manages different API versions, allowing servers to support old clients while introducing breaking changes in new versions.

## Why does it matter?
- **Backward Compatibility**: Old clients continue working
- **gradual Migration**: Give clients time to upgrade
- **Breaking Changes**: Introduce major changes without breaking users
- **Parallel Support**: Run multiple API versions simultaneously
- **Maintenance**: Eventually deprecate old versions
- **Clear Communication**: Clients know what version they use

## How it works (step by step)
1. Client specifies API version (URL path or header)
2. Middleware extracts version
3. Version-specific route selected
4. Version info attached to request
5. Route handler processes with version-specific logic
6. Response formatted for that version
7. Client receives version-appropriate response

## Key concepts
- **Semantic Versioning**: v1, v2, v3 (major versions)
- **URL Path**: /api/v1/users, /api/v2/users
- **Header-Based**: API-Version: v2 header
- **Deprecation**: Warn clients before removing old version
- **Feature Flagging**: New features in new version
- **Response Format**: Different schemas per version

## Common mistakes
- Supporting too many versions (maintenance burden)
- Not warning before deprecation
- Breaking changes without version bump
- Forgetting default version
- Not documenting version differences

## Real world usage
```javascript
// URL-based versioning
app.get('/api/:version/users', (req, res) => {
  const { version } = req.params;
  
  if (version === 'v1') {
    // Old format
    res.json({ users: [{ id: 1, name: 'John' }] });
  } else if (version === 'v2') {
    // New format with more fields
    res.json({ users: [{ id: 1, name: 'John', email: 'j@example.com' }], total: 1 });
  }
});

// Header-based versioning
app.get('/users', (req, res) => {
  const version = req.get('api-version') || 'v1';
  // Handle different versions...
});

// With defaults and validation
const supportedVersions = ['v1', 'v2'];
const defaultVersion = 'v2';
```
