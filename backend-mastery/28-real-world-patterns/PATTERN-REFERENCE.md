# Backend Mastery Module Patterns (Modules 01-05)
## Comprehensive Implementation Guide

---

## 1. SERVER.JS STRUCTURE & PORT ASSIGNMENTS

### Port Assignment Strategy
```
Module 01: 6801 (default)
Module 02: 6802 (default)
Module 03: 4003 (varies)
Module 04: 4004 (varies)
Module 05: 4005 (varies)
```

**Pattern:** Environment variable `HTTP_PORT` with fallback default
```javascript
const HTTP_PORT = process.env.HTTP_PORT || 6801;  // or 4003, 4004, etc.
```

### Complete server.js Template (Consistent Structure)
```javascript
require('dotenv').config();
const express = require('express');
const cors = require('cors');
const helmet = require('helmet');
const routes = require('./routes');

const app = express();
const HTTP_PORT = process.env.HTTP_PORT || 4001;  // Default for new modules

// ==================== MIDDLEWARE ====================

// Security
app.use(helmet());
app.use(cors({
  origin: process.env.FRONTEND_URL || 'http://localhost:3000'
}));

// Body parsing
app.use(express.json());
app.use(express.urlencoded({ extended: true }));

// ==================== ROUTES ====================

app.use('/api', routes);

// ==================== HEALTH CHECK ====================

app.get('/health', (req, res) => {
  res.json({ 
    status: 'ok',
    module: '[MODULE_NAME]',
    category: '28 Real World Patterns',
    port: HTTP_PORT,
    timestamp: new Date().toISOString()
  });
});

// ==================== ROOT ENDPOINT ====================

app.get('/', (req, res) => {
  res.json({
    name: '[MODULE_NAME]',
    module: '28-real-world-patterns - [NUMBER]',
    description: 'Real-world application patterns',
    version: '1.0.0',
    category: '28 Real World Patterns',
    endpoints: {
      health: '/health',
      api: '/api'
    }
  });
});

// ==================== ERROR HANDLER ====================

app.use((err, req, res, next) => {
  console.error('Error:', err.message);
  res.status(err.status || 500).json({
    error: err.message || 'Internal server error',
    status: err.status || 500
  });
});

// ==================== START SERVER ====================

const server = app.listen(HTTP_PORT, () => {
  console.log(`✓ [MODULE_NAME] running on http://localhost:${HTTP_PORT}`);
  console.log(`✓ Health check: http://localhost:${HTTP_PORT}/health`);
  console.log(`✓ API root: http://localhost:${HTTP_PORT}/api`);
});

// Graceful shutdown
process.on('SIGTERM', () => {
  console.log('SIGTERM received, shutting down gracefully');
  server.close(() => {
    console.log('Server closed');
    process.exit(0);
  });
});

module.exports = app;
```

### Key Properties Observed
- **Always imports**: `dotenv`, `express`, `cors`, `helmet`, `routes`
- **Always uses**: `/api` prefix for all routes
- **Always has**: Health check at `/health`, root at `/`
- **Always includes**: Graceful shutdown handler for SIGTERM
- **Always last**: Error handler middleware (4-param signature with `err, req, res, next`)

---

## 2. CONTROLLER.JS IMPLEMENTATION PATTERNS

### File Organization Pattern
```javascript
const { logger } = require('./middleware');

// In-memory database (simulating persistence)
const [resourceName] = {
  1: { id: 1, name: 'Example', role: 'user', deleted_at: null, created_at: new Date() },
  2: { id: 2, name: 'Another', role: 'admin', deleted_at: null, created_at: new Date() },
  // ...
};

let nextId = [NEXT_AVAILABLE_ID];

// ============= SECURE ENDPOINTS =============
const function1 = (req, res) => { /* ... */ };
const function2 = (req, res) => { /* ... */ };

// ============= VULNERABLE ENDPOINTS =============
const functionVulnerable = (req, res) => { /* ... */ };

// ============= HELPER FUNCTIONS =============
const helperFunction = () => { /* ... */ };

module.exports = { function1, function2, functionVulnerable };
```

### Standard Controller Function Pattern
```javascript
const actionName = (req, res) => {
  try {
    // 1. Extract data from request
    const { param1, param2 } = req.body;
    const { id } = req.params;
    
    // 2. Fetch resource (if needed)
    const resource = resources[id];
    
    // 3. Validate state/permissions
    if (!resource) {
      return res.status(404).json({ error: 'Resource not found' });
    }
    if (resource.deleted_at) {
      return res.status(404).json({ error: 'Resource has been deleted' });
    }
    
    // 4. Perform business logic
    resource.field = newValue;
    resource.updated_at = new Date();
    
    // 5. Log action
    logger.info('Action completed', { resourceId: id, field: newValue });
    
    // 6. Return success response
    res.status([201|200]).json({
      success: true,
      data: resource,
      message: 'Action completed successfully'
    });
    
  } catch (err) {
    logger.error('Error performing action', { error: err.message });
    res.status(500).json({ error: 'Failed to perform action' });
  }
};
```

### Common Endpoint Implementations

#### List Endpoint
```javascript
const listResources = (req, res) => {
  try {
    const items = Object.values(resources)
      .filter(r => !r.deleted_at); // Filter out soft-deleted
    
    logger.info('Listed resources', { count: items.length });
    res.json({
      success: true,
      data: items,
      message: `Retrieved ${items.length} resources`
    });
  } catch (err) {
    logger.error('Error listing resources', { error: err.message });
    res.status(500).json({ error: 'Failed to list resources' });
  }
};
```

#### Get Single Endpoint
```javascript
const getResource = (req, res) => {
  try {
    const resource = resources[req.params.id];
    
    if (!resource) {
      return res.status(404).json({ error: 'Resource not found' });
    }
    if (resource.deleted_at) {
      return res.status(404).json({ error: 'Resource has been deleted' });
    }
    
    logger.info('Retrieved resource', { resourceId: req.params.id });
    res.json({ success: true, data: resource });
    
  } catch (err) {
    logger.error('Error retrieving resource', { error: err.message });
    res.status(500).json({ error: 'Failed to retrieve resource' });
  }
};
```

#### Create Endpoint
```javascript
const createResource = (req, res) => {
  try {
    const { name, email, role } = req.body;
    
    // Check uniqueness constraint
    const exists = Object.values(resources).some(r => r.email === email);
    if (exists) {
      return res.status(400).json({ error: 'Email already exists' });
    }
    
    const newResource = {
      id: nextId++,
      name,
      email,
      role,
      deleted_at: null,
      created_at: new Date()
    };
    resources[newResource.id] = newResource;
    
    logger.info('Resource created', { resourceId: newResource.id });
    res.status(201).json({
      success: true,
      data: newResource,
      message: 'Resource created successfully'
    });
    
  } catch (err) {
    logger.error('Error creating resource', { error: err.message });
    res.status(500).json({ error: 'Failed to create resource' });
  }
};
```

#### Update Endpoint (Soft Delete Pattern)
```javascript
const updateResource = (req, res) => {
  try {
    const resource = resources[req.params.id];
    
    if (!resource) {
      return res.status(404).json({ error: 'Resource not found' });
    }
    if (resource.deleted_at) {
      return res.status(404).json({ error: 'Cannot update deleted resource' });
    }
    
    // Update allowed fields
    if (req.body.name) resource.name = req.body.name;
    if (req.body.email) resource.email = req.body.email;
    resource.updated_at = new Date();
    
    logger.info('Resource updated', { resourceId: req.params.id });
    res.json({
      success: true,
      data: resource,
      message: 'Resource updated successfully'
    });
    
  } catch (err) {
    logger.error('Error updating resource', { error: err.message });
    res.status(500).json({ error: 'Failed to update resource' });
  }
};
```

#### Optimistic Locking Update (Module 02)
```javascript
const updateWithVersionCheck = (req, res) => {
  try {
    const resource = resources[req.params.id];
    if (!resource) {
      return res.status(404).json({ error: 'Resource not found' });
    }

    const { currentVersion } = req.body;
    
    // OPTIMISTIC LOCKING: Check version matches
    if (resource.version !== currentVersion) {
      logger.warn('Version conflict', {
        resourceId: req.params.id,
        expectedVersion: resource.version,
        receivedVersion: currentVersion
      });
      
      return res.status(409).json({
        error: 'Version conflict',
        message: 'Resource was modified by another user',
        current: resource,
        latestVersion: resource.version,
        conflict: true
      });
    }

    // Update and increment version
    Object.assign(resource, req.body); // Apply updates
    resource.version++; // Increment version
    resource.updated_at = new Date();
    
    logger.info('Resource updated', {
      resourceId: req.params.id,
      newVersion: resource.version
    });

    res.json({
      success: true,
      data: resource,
      message: `Updated. Version now: ${resource.version}`,
      newVersion: resource.version
    });
    
  } catch (err) {
    logger.error('Error updating resource', { error: err.message });
    res.status(500).json({ error: 'Failed to update resource' });
  }
};
```

---

## 3. ROUTES.JS ENDPOINT STRUCTURE

### Complete routes.js Template
```javascript
const express = require('express');
const router = express.Router();
const {
  validateQuery,
  validateId,
  validateCreate,
  validateUpdate
} = require('./middleware');
const {
  listResources,
  getResource,
  createResource,
  updateResource,
  deleteResource,
  // ... more imports
} = require('./controller');

// ============= SECURE ENDPOINTS (Recommended) =============

router.get('/secure/resources', validateQuery, listResources);
router.get('/secure/resources/:id', validateId, getResource);
router.post('/secure/resources', validateCreate, createResource);
router.patch('/secure/resources/:id', validateId, validateUpdate, updateResource);
router.delete('/secure/resources/:id', validateId, deleteResource);

// ============= VULNERABLE ENDPOINTS (For Comparison) =============

router.get('/vulnerable/resources', listResourcesVulnerable);
router.post('/vulnerable/resources', createResourceVulnerable);

// ============= ADMIN/TEST ENDPOINTS =============

router.get('/admin/deleted-resources', listDeletedResources);
router.post('/test/clear', clearAllData);

module.exports = router;
```

### Endpoint Naming Conventions
| Type | Pattern | Example |
|------|---------|---------|
| Secure | `/api/secure/[resource]` | `/api/secure/users` |
| Secure Get Single | `/api/secure/[resource]/:id` | `/api/secure/users/1` |
| Secure Create | `/api/secure/[resource]` (POST) | `POST /api/secure/users` |
| Secure Update | `/api/secure/[resource]/:id` (PATCH) | `PATCH /api/secure/users/1` |
| Secure Delete | `/api/secure/[resource]/:id` (DELETE) | `DELETE /api/secure/users/1` |
| Vulnerable | `/api/vulnerable/[resource]` | `/api/vulnerable/users` |
| Admin | `/api/admin/[action]` | `/api/admin/deleted-users` |
| Testing | `/api/test/[action]` | `/api/test/clear` |

### HTTP Method Usage
```javascript
router.get('/secure/users', handler);           // Retrieve list
router.get('/secure/users/:id', handler);       // Retrieve single
router.post('/secure/users', handler);          // Create
router.patch('/secure/users/:id', handler);     // Partial update
router.put('/secure/users/:id', handler);       // Full update (less common)
router.delete('/secure/users/:id', handler);    // Delete/Soft delete
router.post('/secure/users/:id/restore', handler); // Custom action
router.get('/secure/users/:id/audit-trail', handler); // Get related data
```

---

## 4. SCHEMA.JS JOI VALIDATION PATTERNS

### Complete schema.js Template
```javascript
const Joi = require('joi');

// Create/POST schema - all required fields
const createResourceSchema = Joi.object({
  name: Joi.string().min(2).max(100).required(),
  email: Joi.string().email().required(),
  role: Joi.string().valid('user', 'admin').default('user'),
  description: Joi.string().max(500).optional()
});

// Update/PATCH schema - all optional but at least 1 required
const updateResourceSchema = Joi.object({
  name: Joi.string().min(2).max(100),
  email: Joi.string().email(),
  role: Joi.string().valid('user', 'admin'),
  description: Joi.string().max(500)
}).min(1); // At least one field must be provided

// Query parameters schema
const querySchema = Joi.object({
  page: Joi.number().integer().min(1).default(1),
  limit: Joi.number().integer().min(1).max(100).default(10),
  sort: Joi.string().optional(),
  filter: Joi.string().optional()
});

// ID parameter schema
const idSchema = Joi.object({
  id: Joi.number().integer().required()
  // or: id: Joi.string().required()
});

module.exports = {
  createResourceSchema,
  updateResourceSchema,
  querySchema,
  idSchema
};
```

### Common Joi Patterns
```javascript
// String validations
Joi.string().min(2).max(100).required()
Joi.string().email().required()
Joi.string().uri().optional()
Joi.string().valid('draft', 'published', 'archived')

// Number validations
Joi.number().integer().required()
Joi.number().positive().required()
Joi.number().min(0).max(100).default(50)

// Boolean
Joi.boolean().default(false)

// Array with items
Joi.array().items(
  Joi.object({
    property: Joi.string().required(),
    value: Joi.number().required()
  })
).min(1).required()

// Conditional/Alternative
Joi.alternatives().try(Joi.string(), Joi.number()).required()

// Object with properties
Joi.object({
  country: Joi.string().optional(),
  tier: Joi.string().valid('free', 'pro', 'enterprise').optional(),
  beta_user: Joi.boolean().optional()
}).optional()
```

### Optimistic Locking Schema (Module 02)
```javascript
const updateWithVersionSchema = Joi.object({
  name: Joi.string().min(2).max(100),
  price: Joi.number().positive(),
  description: Joi.string().max(500),
  currentVersion: Joi.number().integer().min(0).required()  // Always required!
});
```

### Feature Flags Schema (Module 04)
```javascript
const evaluateFlagSchema = Joi.object({
  flag_name: Joi.string().max(100).required(),
  user_id: Joi.string().optional(),
  context: Joi.object({
    country: Joi.string().optional(),
    tier: Joi.string().valid('free', 'pro', 'enterprise').optional(),
    beta_user: Joi.boolean().optional(),
    custom_attributes: Joi.object().optional()
  }).optional()
});

const createFlagSchema = Joi.object({
  name: Joi.string().max(100).required(),
  enabled: Joi.boolean().default(false),
  rollout_percentage: Joi.number().integer().min(0).max(100).default(0),
  targeting_rules: Joi.array().items(
    Joi.object({
      attribute: Joi.string().required(),
      operator: Joi.string().valid('equals', 'contains', 'greater_than').required(),
      value: Joi.alternatives().try(Joi.string(), Joi.number(), Joi.boolean()).required(),
      on_match: Joi.string().valid('enable', 'disable').required()
    })
  ).optional()
});
```

---

## 5. MIDDLEWARE.JS ERROR HANDLING

### Complete middleware.js Template
```javascript
const { createSchema, updateSchema, querySchema, idSchema } = require('./schema');
const logger = require('winston').createLogger({
  level: 'info',
  format: require('winston').format.json(),
  transports: [
    new (require('winston').transports.Console)()
  ]
});

// ============= VALIDATION MIDDLEWARES =============

const validateQuery = (req, res, next) => {
  const { error, value } = querySchema.validate(req.query);
  if (error) {
    return res.status(400).json({ 
      error: 'Invalid query parameters',
      details: error.details[0].message 
    });
  }
  req.query = value; // Replace with validated value
  next();
};

const validateId = (req, res, next) => {
  const { error, value } = idSchema.validate({ id: parseInt(req.params.id) });
  if (error) {
    return res.status(400).json({ 
      error: 'Invalid ID parameter',
      details: error.details[0].message 
    });
  }
  req.params.id = value.id;
  next();
};

const validateCreate = (req, res, next) => {
  const { error, value } = createSchema.validate(req.body);
  if (error) {
    return res.status(400).json({ 
      error: 'Invalid resource data',
      details: error.details[0].message 
    });
  }
  req.body = value;
  next();
};

const validateUpdate = (req, res, next) => {
  const { error, value } = updateSchema.validate(req.body);
  if (error) {
    return res.status(400).json({ 
      error: 'Invalid update data',
      details: error.details[0].message 
    });
  }
  req.body = value;
  next();
};

// ============= ERROR HANDLER MIDDLEWARE =============

const errorHandler = (err, req, res, next) => {
  logger.error('Error occurred', { 
    error: err.message,
    path: req.path,
    method: req.method
  });
  res.status(500).json({ 
    error: 'Internal server error',
    // Only include message in development
    message: process.env.NODE_ENV === 'development' ? err.message : undefined
  });
};

module.exports = {
  validateQuery,
  validateId,
  validateCreate,
  validateUpdate,
  errorHandler,
  logger
};
```

### Validation Middleware Pattern
1. Get schema from `./schema.js`
2. Validate request data (body/query/params)
3. Return 400 with first error if invalid
4. Replace request data with validated value
5. Call `next()`

### Error Response Patterns
```javascript
// 400: Bad Request (validation failed)
res.status(400).json({ 
  error: 'Invalid [field] data',
  details: error.details[0].message  // First validation error
});

// 404: Not Found
res.status(404).json({ error: 'Resource not found' });

// 409: Conflict (version mismatch, lock held)
res.status(409).json({
  error: 'Version conflict',
  message: 'Resource was modified by another user',
  current: resource,
  latestVersion: resource.version,
  conflict: true
});

// 500: Internal Server Error
res.status(500).json({ 
  error: 'Failed to [action]'
  // Don't expose stack trace!
});
```

### Logger Usage Pattern
```javascript
const logger = require('winston').createLogger({
  level: 'info',
  format: require('winston').format.json(),
  transports: [
    new (require('winston').transports.Console)()
  ]
});

// In controllers:
logger.info('Action completed', { resourceId, userId, field });
logger.warn('VULNERABLE: No lock on transaction', { transactionId });
logger.error('Error message', { error: err.message });
```

---

## 6. APP.JSX REACT COMPONENT STRUCTURE

### Complete App.jsx Template
```javascript
import React, { useState, useEffect } from 'react';

export default function App() {
  // ==================== STATE MANAGEMENT ====================
  
  const [response, setResponse] = useState(null);
  const [loading, setLoading] = useState(false);
  const [data, setData] = useState([]);
  
  // Form fields
  const [formData, setFormData] = useState({ 
    field1: '', 
    field2: '',
    field3: ''
  });
  const [resourceId, setResourceId] = useState('');
  
  const API_URL = 'http://localhost:4001/api';

  // ==================== API CALL PATTERN ====================

  const callAPI = async (method, url, body = null) => {
    setLoading(true);
    try {
      const options = {
        method,
        headers: { 'Content-Type': 'application/json' }
      };
      if (body) options.body = JSON.stringify(body);

      const res = await fetch(`${API_URL}${url}`, options);
      const data = await res.json();
      setResponse({
        status: res.status,
        data,
        timestamp: new Date().toLocaleTimeString()
      });
    } catch (err) {
      setResponse({
        error: err.message,
        timestamp: new Date().toLocaleTimeString()
      });
    }
    setLoading(false);
  };

  // ==================== HANDLER METHODS ====================

  const handleList = () => {
    callAPI('GET', '/secure/resources');
  };

  const handleGet = () => {
    if (!resourceId) return alert('Enter resource ID');
    callAPI('GET', `/secure/resources/${resourceId}`);
  };

  const handleCreate = () => {
    if (!formData.field1 || !formData.field2) return alert('Fill all fields');
    callAPI('POST', '/secure/resources', formData);
    setFormData({ field1: '', field2: '', field3: '' });
  };

  const handleUpdate = () => {
    if (!resourceId) return alert('Enter resource ID');
    if (!formData.field1 && !formData.field2) return alert('Fill at least one field');
    callAPI('PATCH', `/secure/resources/${resourceId}`, formData);
  };

  const handleDelete = () => {
    if (!resourceId) return alert('Enter resource ID');
    if (!window.confirm('Are you sure?')) return;
    callAPI('DELETE', `/secure/resources/${resourceId}`);
  };

  // ==================== LIFECYCLE ====================

  useEffect(() => {
    handleList(); // Load initial data
  }, []);

  // ==================== RENDERING ====================

  return (
    <div style={{ maxWidth: '1200px', margin: '0 auto', padding: '20px', fontFamily: 'Arial' }}>
      <h1>📋 Resource Management</h1>
      <p>CRUD operations with validation</p>

      <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '20px' }}>
        
        {/* LEFT: Commands/Buttons */}
        <div>
          <h2>Commands</h2>
          
          <div style={{ border: '1px solid #ccc', padding: '15px', marginBottom: '15px', borderRadius: '5px' }}>
            <h3>List Resources</h3>
            <button onClick={handleList} style={buttonStyle}>Get All</button>
          </div>

          <div style={{ border: '1px solid #ccc', padding: '15px', marginBottom: '15px', borderRadius: '5px' }}>
            <h3>Get Single Resource</h3>
            <input
              type="number"
              placeholder="Resource ID"
              value={resourceId}
              onChange={(e) => setResourceId(e.target.value)}
              style={inputStyle}
            />
            <button onClick={handleGet} style={buttonStyle}>Get Resource</button>
          </div>

          <div style={{ border: '1px solid #ccc', padding: '15px', marginBottom: '15px', borderRadius: '5px' }}>
            <h3>Create Resource</h3>
            <input
              type="text"
              placeholder="Field 1"
              value={formData.field1}
              onChange={(e) => setFormData({...formData, field1: e.target.value})}
              style={inputStyle}
            />
            <input
              type="text"
              placeholder="Field 2"
              value={formData.field2}
              onChange={(e) => setFormData({...formData, field2: e.target.value})}
              style={inputStyle}
            />
            <button onClick={handleCreate} style={buttonStyle}>Create</button>
          </div>

          <div style={{ border: '1px solid #ccc', padding: '15px', marginBottom: '15px', borderRadius: '5px' }}>
            <h3>Update Resource</h3>
            <input
              type="number"
              placeholder="Resource ID"
              value={resourceId}
              onChange={(e) => setResourceId(e.target.value)}
              style={inputStyle}
            />
            <input
              type="text"
              placeholder="Field 1"
              value={formData.field1}
              onChange={(e) => setFormData({...formData, field1: e.target.value})}
              style={inputStyle}
            />
            <button onClick={handleUpdate} style={{...buttonStyle, background: '#ff9800'}}>Update</button>
          </div>

          <div style={{ border: '1px solid #ccc', padding: '15px', marginBottom: '15px', borderRadius: '5px' }}>
            <h3>Delete Resource</h3>
            <input
              type="number"
              placeholder="Resource ID"
              value={resourceId}
              onChange={(e) => setResourceId(e.target.value)}
              style={inputStyle}
            />
            <button onClick={handleDelete} style={{...buttonStyle, background: '#f44336'}}>Delete</button>
          </div>
        </div>

        {/* RIGHT: Response Display */}
        <div>
          <h2>Response</h2>
          {loading && <p>Loading...</p>}
          {response && (
            <div style={{ border: '1px solid #ccc', padding: '15px', borderRadius: '5px', maxHeight: '800px', overflow: 'auto' }}>
              <p><strong>Status:</strong> {response.status || 'N/A'}</p>
              <p><strong>Time:</strong> {response.timestamp}</p>
              <pre style={{ background: '#f5f5f5', padding: '10px', borderRadius: '3px', overflow: 'auto' }}>
                {JSON.stringify(response.data || response.error, null, 2)}
              </pre>
            </div>
          )}
        </div>
      </div>
    </div>
  );
}

// ==================== STYLES ====================

const buttonStyle = {
  padding: '10px 15px',
  margin: '5px 0',
  width: '100%',
  background: '#2196f3',
  color: 'white',
  border: 'none',
  borderRadius: '5px',
  cursor: 'pointer',
  fontSize: '14px',
  fontWeight: 'bold'
};

const inputStyle = {
  padding: '8px',
  margin: '5px 0',
  width: '100%',
  borderRadius: '5px',
  border: '1px solid #ccc',
  fontSize: '14px'
};
```

### Key Component Patterns

#### State Organization
```javascript
// Response state
const [response, setResponse] = useState(null);
const [loading, setLoading] = useState(false);

// Data state
const [resources, setResources] = useState([]);
const [selectedResource, setSelectedResource] = useState(null);

// Form state
const [formData, setFormData] = useState({ field1: '', field2: '', field3: '' });
const [resourceId, setResourceId] = useState('');
```

#### API Call Method (Reusable)
```javascript
const callAPI = async (method, url, body = null) => {
  setLoading(true);
  try {
    const options = {
      method,
      headers: { 'Content-Type': 'application/json' },
      body: body ? JSON.stringify(body) : undefined
    };
    const res = await fetch(`${API_URL}${url}`, options);
    const data = await res.json();
    setResponse({ status: res.status, data, timestamp: new Date().toLocaleTimeString() });
  } catch (err) {
    setResponse({ error: err.message, timestamp: new Date().toLocaleTimeString() });
  }
  setLoading(false);
};
```

#### Handler Pattern
```javascript
const handleAction = () => {
  // 1. Validate inputs
  if (!validation) return alert('Validation message');
  
  // 2. Show confirmation if destructive
  if (isDestructive && !window.confirm('Are you sure?')) return;
  
  // 3. Call API
  callAPI('METHOD', '/endpoint', body);
  
  // 4. Reset form if create
  setFormData({ field1: '', field2: '' });
};
```

#### Component Organization
```javascript
return (
  <div style={{ maxWidth: '1200px', margin: '0 auto', padding: '20px' }}>
    <h1>Title</h1>
    <p>Description</p>

    <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '20px' }}>
      {/* Left: Controls */}
      <div>
        <h2>Commands</h2>
        <button onClick={handleAction}>Action</button>
      </div>

      {/* Right: Results */}
      <div>
        <h2>Response</h2>
        <pre>{JSON.stringify(response, null, 2)}</pre>
      </div>
    </div>
  </div>
);
```

---

## 7. PACKAGE.JSON DEPENDENCIES

### Standard Dependencies (All Modules)
```json
{
  "name": "module-nn",
  "version": "1.0.0",
  "description": "Module description",
  "main": "server.js",
  "scripts": {
    "start": "node server.js",
    "dev": "nodemon server.js",
    "test": "jest"
  },
  "dependencies": {
    "express": "^4.18.2",
    "cors": "^2.8.5",
    "helmet": "^7.0.0",
    "joi": "^17.10.0",
    "dotenv": "^16.3.1",
    "winston": "^3.10.0",
    "body-parser": "^1.20.2"
  },
  "devDependencies": {
    "nodemon": "^3.0.1"
  }
}
```

### Module-Specific Dependencies
- **Module 03** (Distributed Locks): Add `redis`, `redlock`
- **Module 04** (Feature Flags): Add `launchdarkly-node-server` (optional, shown in vulnerable)
- **Module 05** (Config Management): Include event emitters in standard Node.js

---

## 8. ENVIRONMENT VARIABLES PATTERN

### .env.example Template
```env
# Server Configuration
HTTP_PORT=4001
NODE_ENV=development
FRONTEND_URL=http://localhost:3000

# Database (if applicable)
DATABASE_URL=mongodb://localhost:27017/database_name

# Redis (Module 03)
REDIS_HOST=localhost
REDIS_PORT=6379

# Feature Flags (Module 04)
LAUNCHDARKLY_SDK_KEY=your-sdk-key

# Security
JWT_SECRET=your-jwt-secret-key
ALLOWED_ORIGINS=http://localhost:3000,http://localhost:3001
```

---

## 9. CROSS-CUTTING PATTERNS

### Error Handling Flow
```
Request → Middleware Validation → Controller Logic → Response
                ↓                          ↓
        400 Bad Request           500 Internal Error
                                  404 Not Found
                                  409 Conflict
```

### Response Structure Pattern
```javascript
// Success responses
{ success: true, data: {...}, message: "Action completed" }
{ success: true, data: [...], count: 10 }

// Error responses
{ error: "Error message", details: "First error detail" }
{ error: "Resource not found" }
{ error: "Version conflict", conflict: true, current: {...}, latestVersion: 2 }
```

### Logging Pattern
```javascript
// Info level - successful operations
logger.info('List retrieved', { count: 10, userId: 123 });

// Warn level - potential issues
logger.warn('Version conflict detected', { resourceId: 1, expected: 2, received: 1 });
logger.warn('VULNERABLE: No lock acquired', { transactionId });

// Error level - failures
logger.error('Failed to update resource', { error: err.message, resourceId: 1 });
```

### Data Validation Chain
```
User Input → URL Parsing → Joi Validation → Type Conversion → Business Logic
                                ↓
                          Return 400 if invalid
```

---

## 10. MODULE DIFFERENCES SUMMARY

| Aspect | Module 01 | Module 02 | Module 03 | Module 04 | Module 05 |
|--------|-----------|-----------|-----------|-----------|-----------|
| **Main Pattern** | Soft Delete | Optimistic Locking | Distributed Locks | Feature Flags | Config Management |
| **Key Field** | `deleted_at` | `version` | Lock keys | Flag config | Environment config |
| **Conflict Status** | 404 | 409 | 409 | N/A | N/A |
| **DB Type** | In-memory objects | In-memory objects | Redis + in-memory | In-memory | In-memory |
| **Update Method** | Direct assignment | Version check first | Lock + critical section | Flag evaluation | Config replacement |

---

## 11. IMPLEMENTATION CHECKLIST

When creating a new module, ensure you have:

- [ ] `server.js` - Complete with helmet, cors, health check, error handler
- [ ] `routes.js` - Organized with `/secure` and `/vulnerable` endpoints
- [ ] `controller.js` - Functions with try-catch, logging, proper status codes
- [ ] `schema.js` - Joi validation for all input types
- [ ] `middleware.js` - Validation middleware and error handler
- [ ] `App.jsx` - React component with grid layout (commands + response)
- [ ] `package.json` - All dependencies declared
- [ ] `.env.example` - Template for environment variables
- [ ] `README.md` - Setup instructions
- [ ] `theory.md` - Security concepts and explanations

---

## Key Takeaways

1. **Consistent Structure**: All modules follow the same file organization and server setup
2. **Validation First**: Input validation happens in middleware before controllers
3. **Error Handling**: Specific HTTP status codes for different error types
4. **Dual Endpoints**: Every module shows both vulnerable and secure implementations
5. **React UI Pattern**: Simple two-column layout (commands + response)
6. **Logging**: Winston logger for info/warn/error across all layers
7. **Database Simulation**: In-memory objects mimic persistence for educational purposes

Use this reference to implement modules 06+ with consistency and clarity!
