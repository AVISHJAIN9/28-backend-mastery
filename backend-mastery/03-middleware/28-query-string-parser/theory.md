# Query String Parser Middleware

## Overview
Query string parser middleware handles parsing and validation of URL query parameters. Provides features like filtering, sorting, pagination, and field selection. Critical for building flexible APIs where clients control data retrieval.

## Key Concepts

### 1. Query String Basics
```
GET /api/users?name=John&role=admin&page=1&limit=10&sort=-createdAt&fields=id,name,email

Query parameters:
- name: Filter by name
- role: Filter by role
- page: Pagination page (1-indexed)
- limit: Items per page
- sort: Sorting (-createdAt = descending)
- fields: Field selection (projection)
```

### 2. Query Types
- **Filters**: `status=active`, `role=admin,user`
- **Pagination**: `page=2&limit=20`
- **Sorting**: `sort=name` or `sort=-createdAt` (descending)
- **Field Selection**: `fields=id,name,email`
- **Search**: `q=search+term`, `search=john`

### 3. Safety Concerns
- **Injection**: SQL/NoSQL injection via query values
- **Large Queries**: DoS via massive parameter lists
- **Nested Objects**: Complex parameter structures
- **Validation**: Ensure expected format

## Implementation

### Basic Query Parser
```javascript
const parseQuery = (query) => {
  return {
    filters: query.filters ? JSON.parse(query.filters) : {},
    page: parseInt(query.page) || 1,
    limit: parseInt(query.limit) || 10,
    sort: query.sort || '-createdAt'
  };
};

app.get('/api/users', (req, res) => {
  const { filters, page, limit, sort } = parseQuery(req.query);
  // Apply filters, pagination, sort
});
```

### Express Middleware
```javascript
const queryParser = (req, res, next) => {
  req.query = {
    page: Math.max(1, parseInt(req.query.page) || 1),
    limit: Math.min(100, Math.max(1, parseInt(req.query.limit) || 10)),
    sort: req.query.sort || '-createdAt',
    fields: req.query.fields?.split(',').map(f => f.trim()),
    filters: {
      name: req.query.name,
      role: req.query.role,
      status: req.query.status
    }
  };
  next();
};

app.use(queryParser);
```

### Advanced Query Parser
```javascript
const advancedQueryParser = (req, res, next) => {
  const parsed = {
    filters: {},
    pagination: {
      page: Math.max(1, parseInt(req.query.page) || 1),
      limit: Math.min(100, parseInt(req.query.limit) || 20)
    },
    sort: parseSort(req.query.sort),
    fields: req.query.fields?.split(','),
    search: req.query.q
  };
  
  // Build filters from query params
  Object.keys(req.query).forEach(key => {
    if (!['page', 'limit', 'sort', 'fields', 'q'].includes(key)) {
      parsed.filters[key] = req.query[key];
    }
  });
  
  req.queryParams = parsed;
  next();
};

const parseSort = (sortString) => {
  if (!sortString) return { createdAt: -1 };
  
  return sortString.split(',').reduce((acc, field) => {
    const isDesc = field.startsWith('-');
    const fieldName = isDesc ? field.slice(1) : field;
    acc[fieldName] = isDesc ? -1 : 1;
    return acc;
  }, {});
};
```

## Filtering Patterns

### Single Value Filters
```
GET /api/users?status=active
// Filters: { status: 'active' }
```

### Multiple Value Filters
```
GET /api/users?role=admin,moderator,user
// Filters: { role: ['admin', 'moderator', 'user'] }

app.get('/api/users', (req, res) => {
  const roles = req.query.role?.split(',') || [];
  const users = users.filter(u => roles.includes(u.role));
});
```

### Range Filters
```
GET /api/products?minPrice=10&maxPrice=100&createdAfter=2024-01-01
// Filters: { price: { min: 10, max: 100 }, createdAt: { after: '2024-01-01' } }

const parseRangeFilter = (min, max) => ({
  $gte: parseFloat(min),
  $lte: parseFloat(max)
});
```

### Complex Filters
```
GET /api/users?filters={"status":"active","role":"admin"}
// Or URL encoded: filters=%7B%22status%22%3A%22active%22%7D

const parseFilters = (filterString) => {
  try {
    return JSON.parse(filterString);
  } catch (e) {
    return {};
  }
};
```

## Pagination Implementation

### Offset-Based
```javascript
app.get('/api/users', (req, res) => {
  const page = Math.max(1, parseInt(req.query.page) || 1);
  const limit = Math.min(100, parseInt(req.query.limit) || 20);
  const offset = (page - 1) * limit;
  
  const users = getAllUsers().slice(offset, offset + limit);
  
  res.json({
    data: users,
    pagination: {
      page,
      limit,
      total: totalUsers,
      totalPages: Math.ceil(totalUsers / limit),
      hasNext: page < Math.ceil(totalUsers / limit)
    }
  });
});
```

### Cursor-Based (Better for large datasets)
```javascript
app.get('/api/users', (req, res) => {
  const limit = Math.min(100, parseInt(req.query.limit) || 20);
  const cursor = req.query.cursor || null;
  
  let query = {};
  if (cursor) {
    query._id = { $gt: cursor };
  }
  
  const users = User.find(query).limit(limit + 1);
  const hasNext = users.length > limit;
  
  res.json({
    data: users.slice(0, limit),
    pagination: {
      hasNext,
      nextCursor: hasNext ? users[limit]._id : null
    }
  });
});
```

## Sorting Implementation

### Single Field Sort
```javascript
const parsed = {
  sort: { createdAt: -1 } // -1 for desc, 1 for asc
};

// MongoDB
const sorted = db.collection('users').find({}).sort(parsed.sort);
```

### Multi-Field Sort
```
GET /api/users?sort=-createdAt,name
// { createdAt: -1, name: 1 }

GET /api/users?sort=status,-date
// { status: 1, date: -1 }
```

## Field Selection (Projection)

### Explicit Field Selection
```
GET /api/users?fields=id,name,email

app.get('/api/users', (req, res) => {
  const fields = req.query.fields?.split(',') || [];
  const projection = fields.length > 0
    ? Object.fromEntries(fields.map(f => [f, 1]))
    : { password: 0 }; // Exclude sensitive fields
  
  const users = User.find({}, projection);
});
```

## Security Best Practices

1. **Validate Query Values**: Use Joi/Zod schemas
2. **Limit Query Size**: Max 50 query parameters
3. **Restrict Fields**: Whitelist selectable fields
4. **DBMS Escaping**: Use parameterized queries
5. **Rate Limiting**: Per-query limits
6. **NoSQL Injection**: Validate/sanitize filters
7. **Large Limits**: Cap pagination limit (max 100)

## Performance Optimization

1. **Indexes**: Index frequently sorted/filtered fields
2. **Query Limits**: Cap limit, page offset
3. **Caching**: Cache filtered/paginated results
4. **Lazy Loading**: Load related data on demand
5. **Query Optimization**: Reduce fields returned
