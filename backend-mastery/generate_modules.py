#!/usr/bin/env python3
import os
import json

# Module definitions with their key features
modules = {
    '09-bulk-operations': {
        'name': 'Bulk Operations',
        'description': 'Batch CRUD operations with progress tracking',
        'features': ['Batch create/update/delete', 'Progress tracking', 'Error handling for partial failures', 'CSV import/export'],
    },
    '10-subscription-payment-controller': {
        'name': 'Subscription & Payment',
        'description': 'Subscription management and payment processing',
        'features': ['Subscription management', 'Payment processing', 'Invoice generation', 'Billing cycles', 'Renewal handling'],
    },
    '11-rate-limit-controller': {
        'name': 'Rate Limit',
        'description': 'Rate limiting by IP/user with token bucket algorithm',
        'features': ['Rate limiting by IP/user', 'Token bucket algorithm', 'Configurable limits', 'Rate limit headers', 'Quota management'],
    },
    '12-analytics-controller': {
        'name': 'Analytics',
        'description': 'Event tracking, metrics aggregation, and reporting',
        'features': ['Event tracking', 'Metrics aggregation', 'Dashboard statistics', 'Time-series data', 'Report generation'],
    },
    '13-signed-url-controller': {
        'name': 'Signed URLs',
        'description': 'Generate temporary pre-signed URLs for file access',
        'features': ['Generate pre-signed URLs', 'URL expiration', 'File access via URLs', 'Signature verification', 'Download tracking'],
    },
    '14-search-controller-vector-text': {
        'name': 'Search (Vector + Text)',
        'description': 'Full-text and vector similarity search',
        'features': ['Full-text search', 'Vector similarity search', 'Advanced filtering', 'Faceted search', 'Result ranking'],
    },
    '15-graphql-resolvers': {
        'name': 'GraphQL',
        'description': 'GraphQL resolvers for CRUD and subscriptions',
        'features': ['Query resolvers', 'Mutation resolvers', 'Subscription support', 'Field resolution', 'Error handling'],
    },
    '16-ai-llm-proxy-controller': {
        'name': 'AI/LLM Proxy',
        'description': 'LLM API proxying with token counting and cost calculation',
        'features': ['LLM API proxying', 'Token counting', 'Cost calculation', 'Rate limiting', 'Response streaming'],
    },
    '17-trpc-typesafe-api': {
        'name': 'tRPC TypeSafe',
        'description': 'Type-safe RPC framework with validation',
        'features': ['Type-safe RPC', 'Procedure definitions', 'Input/output validation', 'Middleware support', 'Client generation'],
    },
    '18-sse-stream-controller': {
        'name': 'SSE Streaming',
        'description': 'Server-sent events for real-time data',
        'features': ['SSE implementation', 'Real-time streaming', 'Connection management', 'Message broadcasting', 'Reconnection handling'],
    },
    '19-grpc-protobuf': {
        'name': 'gRPC Protobuf',
        'description': 'Protocol buffer service implementation',
        'features': ['Proto definitions', 'gRPC services', 'Bidirectional streaming', 'Error handling', 'Multi-language support'],
    },
    '20-notification-controller': {
        'name': 'Notifications',
        'description': 'Multi-channel notification system',
        'features': ['Email/SMS/Push', 'Notification templates', 'Retry logic', 'Delivery tracking', 'Notification center'],
    },
    '21-ride-booking-controller': {
        'name': 'Ride Booking',
        'description': 'Real-world ride booking system',
        'features': ['Location-based matching', 'Pricing calculation', 'Driver/Rider management', 'Booking lifecycle', 'Real-time updates'],
    },
    '22-openapi-swagger-docs': {
        'name': 'OpenAPI/Swagger',
        'description': 'API documentation with Swagger UI',
        'features': ['API documentation', 'Interactive Swagger UI', 'Schema definitions', 'Example requests/responses ', 'Endpoint documentation'],
    },
}

def create_controller(module_key, module_info):
    """Generate basic controller template"""
    title = module_info['name']
    return f'''// {title} Controller
const {{ v4: uuidv4 }} = require('uuid');

class {title.replace(' ', '').replace('/', '')}Controller {{
  
  static async list(req, res) {{
    try {{
      const {{ page = 1, limit = 20 }} = req.query;
      const offset = (page - 1) * limit;
      
      const data = [];
      const total = 0;
      
      res.json({{
        data,
        pagination: {{ page: parseInt(page), limit: parseInt(limit), total }},
        success: true
      }});
    }} catch (err) {{
      res.status(500).json({{ error: err.message }});
    }}
  }}

  static async get(req, res) {{
    try {{
      const {{ id }} = req.params;
      res.json({{ success: true, message: 'Retrieved successfully' }});
    }} catch (err) {{
      res.status(500).json({{ error: err.message }});
    }}
  }}

  static async create(req, res) {{
    try {{
      const {{ name, description }} = req.body;
      const id = uuidv4();
      
      res.status(201).json({{
        id,
        name,
        description,
        createdAt: new Date(),
        success: true
      }});
    }} catch (err) {{
      res.status(500).json({{ error: err.message }});
    }}
  }}

  static async update(req, res) {{
    try {{
      const {{ id }} = req.params;
      const data = req.body;
      
      res.json({{
        id,
        ...data,
        updatedAt: new Date(),
        success: true
      }});
    }} catch (err) {{
      res.status(500).json({{ error: err.message }});
    }}
  }}

  static async delete(req, res) {{
    try {{
      const {{ id }} = req.params;
      res.json({{ message: 'Deleted successfully', success: true }});
    }} catch (err) {{
      res.status(500).json({{ error: err.message }});
    }}
  }}
}}

module.exports = {title.replace(' ', '').replace('/', '')}Controller;
'''

def create_routes(module_key, module_info):
    """Generate routes template"""
    name = module_info['name'].replace(' ', '').replace('/', '')
    return f'''const express = require('express');
const Controller = require('./controller');

const router = express.Router();

// GET - List resources
router.get('/', (req, res) => Controller.list(req, res));

// POST - Create resource
router.post('/', (req, res) => Controller.create(req, res));

// GET/:id - Get single resource
router.get('/:id', (req, res) => Controller.get(req, res));

// PATCH/:id - Update resource
router.patch('/:id', (req, res) => Controller.update(req, res));

// DELETE/:id - Delete resource
router.delete('/:id', (req, res) => Controller.delete(req, res));

module.exports = router;
'''

def create_schema(module_key, module_info):
    """Generate schema template"""
    return '''const Joi = require('joi');

exports.createSchema = Joi.object({
  name: Joi.string().required(),
  description: Joi.string().optional(),
  status: Joi.string().optional()
});

exports.updateSchema = Joi.object({
  name: Joi.string().optional(),
  description: Joi.string().optional(),
  status: Joi.string().optional()
});

exports.querySchema = Joi.object({
  page: Joi.number().min(1).default(1),
  limit: Joi.number().min(1).max(100).default(20),
  sortBy: Joi.string().optional(),
  order: Joi.string().valid('asc', 'desc').default('desc')
});
'''

def create_middleware(module_key, module_info):
    """Generate middleware template"""
    return '''const validateBody = (req, res, next) => {
  if (!req.body || Object.keys(req.body).length === 0) {
    return res.status(400).json({ error: 'Request body required' });
  }
  next();
};

const validateQuery = (req, res, next) => {
  const { page, limit } = req.query;
  if (page && isNaN(parseInt(page))) {
    return res.status(400).json({ error: 'page must be a number' });
  }
  if (limit && isNaN(parseInt(limit))) {
    return res.status(400).json({ error: 'limit must be a number' });
  }
  next();
};

const errorHandler = (err, req, res, next) => {
  console.error('Error:', err);
  res.status(err.status || 500).json({
    error: err.message || 'Internal server error'
  });
};

module.exports = { validateBody, validateQuery, errorHandler };
'''

def create_readme(module_key, module_info):
    """Generate README template"""
    return f'''# {module_info['name']} Controller

## What is this?
{module_info['description']}

## Features
{chr(10).join('- ' + f.strip() for f in module_info['features'])}

## Why does it matter?
This module provides essential REST API functionality with proper patterns and best practices.

## How it works
1. Accepts HTTP requests
2. Validates input
3. Processes business logic
4. Returns proper HTTP responses

## Real world usage
Used in production APIs for managing resources and handling client requests.
'''

def create_theory(module_key, module_info):
    """Generate theory/concepts template"""
    return f'''# {module_info['name']} - Theory & Concepts

## Key Concepts

### REST Principles
- Resource-based URLs
- Standard HTTP methods
- Proper status codes
- Stateless operations

### Architecture Pattern
This module implements a layered architecture:
- Controller layer: Business logic
- Routes layer: Endpoint definitions
- Middleware layer: Cross-cutting concerns
- Schema layer: Data validation

### Best Practices
- Input validation with Joi schemas
- Error handling at all layers
- Proper HTTP status codes
- Comprehensive logging
- Rate limiting
- Request/response normalization

## Common Patterns
- CRUD operations
- Pagination and filtering
- Sorting and searching
- Resource nesting
- Bulk operations
- Batch processing
'''

def create_setup(module_key, module_info):
    """Generate setup instructions"""
    return f'''# {module_info['name']} - Setup Guide

## Installation
```bash
npm install express joi uuid
```

## Environment Variables
Create `.env` file with required configuration:
```
PORT=3000
NODE_ENV=development
LOG_LEVEL=info
```

## Running
```bash
npm start
```

## Testing
```bash
npm test
```

## API Usage
See README.md for API endpoints and examples.
'''

def create_checklist(module_key, module_info):
    """Generate checklist"""
    return f'''# {module_info['name']} - Implementation Checklist

## Requirements
{chr(10).join('- [ ] ' + f.strip() for f in module_info['features'])}

## Development
- [ ] Controller logic
- [ ] Routes setup
- [ ] Validation schemas
- [ ] Middleware integration
- [ ] Error handling
- [ ] Documentation

## Testing
- [ ] Unit tests
- [ ] Integration tests
- [ ] API endpoint tests
- [ ] Error case tests

## Deployment
- [ ] Environment configured
- [ ] Database migrations ready
- [ ] Error logging setup
- [ ] Monitoring configured
'''

def create_app_jsx(module_key, module_info):
    """Generate React component"""
    name = module_info['name'].replace('/', ' ')
    return f'''import React, {{ useState }} from 'react';

const {name.split()[0]}App = () => {{
  const [items, setItems] = useState([]);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');
  const [name, setName] = useState('');

  const fetchItems = async () => {{
    setLoading(true);
    try {{
      const res = await fetch('http://localhost:3000/api');
      const data = await res.json();
      if (res.ok) setItems(data.data);
    }} catch (err) {{
      setError(err.message);
    }} finally {{
      setLoading(false);
    }}
  }};

  React.useEffect(() => {{
    fetchItems();
  }}, []);

  return (
    <div style={{ maxWidth: 800, margin: '0 auto', padding: 20, fontFamily: 'sans-serif' }}>
      <h1>⚙️ {name}</h1>
      
      {{error && <div style={{ background: '#fee', color: '#c33', padding: 15, borderRadius: 4, marginBottom: 20 }}>{{error}}</div>}}
      
      <div style={{ background: 'white', padding: 20, borderRadius: 8, marginBottom: 20 }}>
        <h2>Create Item</h2>
        <input 
          type="text" 
          value={{name}} 
          onChange={(e) => setName(e.target.value)} 
          placeholder="Item name" 
          style={{ width: '100%', padding: 10, marginBottom: 10 }} 
        />
        <button disabled={{loading}} style={{ padding: '10px 20px', background: '#667eea', color: 'white', border: 'none', borderRadius: 4, cursor: 'pointer' }}>
          {{loading ? 'Creating...' : 'Create'}}
        </button>
      </div>

      <div style={{ background: 'white', padding: 20, borderRadius: 8 }}>
        <h2>Items ({{items.length}})</h2>
        {{items.map(item => (
          <div key={{item.id}} style={{ padding: 10, borderBottom: '1px solid #eee' }}>
            {{item.name}}
          </div>
        ))}}
      </div>
    </div>
  );
}};

export default {name.split()[0]}App;
'''

# Create files for each module
base_path = '/Users/avishjain/Downloads/backend-mastery/02-controllers-api'

for module_key, module_info in modules.items():
    module_path = os.path.join(base_path, module_key)
    
    if not os.path.exists(module_path):
        os.makedirs(module_path)
    
    # Create files
    files = {
        'controller.js': create_controller(module_key, module_info),
        'routes.js': create_routes(module_key, module_info),
        'schema.js': create_schema(module_key, module_info),
        'middleware.js': create_middleware(module_key, module_info),
        'README.md': create_readme(module_key, module_info),
        'theory.md': create_theory(module_key, module_info),
        'setup.md': create_setup(module_key, module_info),
        'checklist.md': create_checklist(module_key, module_info),
        'App.jsx': create_app_jsx(module_key, module_info),
    }
    
    for filename, content in files.items():
        filepath = os.path.join(module_path, filename)
        with open(filepath, 'w') as f:
            f.write(content)
        print(f"Created: {filepath}")

print("\n✅ All module files created successfully!")
print(f"Total files created: {len(modules) * len(files)} files")
