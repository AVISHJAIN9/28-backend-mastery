# CRUD Controllers - Deep Dive Theory

## CRUD Operations Foundation

### Four Core Operations

```
CRUD:
├── CREATE (POST) → 201 Created
├── READ (GET) → 200 OK
├── UPDATE (PUT/PATCH) → 200 OK / 204 No Content
└── DELETE (DELETE) → 204 No Content / 200 OK
```

### RESTful Principles

1. **Resources not Actions**: Use nouns, not verbs
   - ✅ POST /users (create user)
   - ❌ POST /createUser (wrong)
   - ✅ GET /users/123 (read user)
   - ❌ GET /getUser?id=123 (wrong)

2. **HTTP Methods Semantics**:
   - GET: Safe, idempotent, cacheable
   - POST: Not idempotent, creates new resource
   - PUT: Idempotent, replaces entire resource
   - PATCH: Idempotent, partial update
   - DELETE: Idempotent, removes resource

### Request/Response Patterns

**Create Request**:
```json
POST /api/products
Content-Type: application/json

{
  "name": "Laptop",
  "price": 999.99,
  "category": "Electronics"
}
```

**Create Response (201)**:
```json
{
  "id": "uuid-123",
  "name": "Laptop",
  "price": 999.99,
  "category": "Electronics",
  "createdAt": "2024-01-15T10:00:00Z",
  "updatedAt": "2024-01-15T10:00:00Z"
}
```

## Data Validation Layer

### Schema Definition
```javascript
const productSchema = Joi.object({
  name: Joi.string().required().max(100),
  price: Joi.number().positive().required(),
  category: Joi.string().optional()  // can't be set by user
});
```

### Validation Execution
```javascript
const { error, value } = productSchema.validate(req.body);
if (error) {
  return res.status(400).json({ error: error.details[0].message });
}
```

## Error Handling Strategy

| Scenario | Status | Response |
|----------|--------|----------|
| Malformed JSON | 400 | `{"error": "Invalid JSON"}` |
| Missing required field | 400 | `{"error": "name is required"}` |
| Invalid type | 400 | `{"error": "price must be number"}` |
| Resource not found | 404 | `{"error": "Product not found"}` |
| Server error | 500 | `{"error": "Internal server error"}` |

## Pagination Strategy

### Offset-based (Simple)
```
GET /api/products?limit=10&offset=20
Returns items 20-30
```

### Cursor-based (Better)
```
GET /api/products?limit=10&cursor=abc123
Returns 10 items after cursor
```

## Authorization in CRUD

```javascript
// User can only read/update own resources
const updateProduct = (req, res) => {
  const product = products.get(req.params.id);
  
  // Authorization check
  if (product.createdBy !== req.user.id && req.user.role !== 'admin') {
    return res.status(403).json({ error: 'Forbidden' });
  }
  
  // ...update logic
};
```
