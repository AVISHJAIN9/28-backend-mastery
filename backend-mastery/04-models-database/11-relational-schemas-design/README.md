# Module 11: Relational Schemas & Design

## Overview
Structuring data relationships effectively with best practices

**Complexity:** Intermediate to Advanced  
**Time to Learn:** 2-3 hours  
**Technologies:** Schema design, Foreign keys, ERD

---

## Key Concepts

- Relationships
- Foreign keys
- One-to-Many
- Many-to-Many

---

## Project Structure

```
11-relational-schemas-design/
├── controller.js       # Business logic
├── routes.js          # API endpoints
├── middleware.js      # Error handling
├── schema.js          # Validation schemas
├── server.js          # Express setup
├── App.jsx            # React testing UI
├── package.json       # Dependencies
├── .env.example       # Environment template
├── setup.md           # Installation guide
└── theory.md          # Concepts
```

---

## Setup

### 1. Install Dependencies
```bash
npm install
```

### 2. Configure Environment
```bash
cp .env.example .env
```

Edit `.env` with your settings

### 3. Start Server
```bash
npm start
```

Server runs on `http://localhost:5111`

---

## API Endpoints

### Create Resource
```http
POST /api/resources
Content-Type: application/json

{ "name": "Example", "description": "Test resource" }
```

### Get All Resources
```http
GET /api/resources?page=1&limit=10
```

### Get Single Resource
```http
GET /api/resources/:id
```

### Update Resource
```http
PUT /api/resources/:id
Content-Type: application/json

{ "name": "Updated" }
```

### Delete Resource
```http
DELETE /api/resources/:id
```

---

## Code Examples

See `setup.md` for detailed examples and `theory.md` for conceptual explanations.

---

## Best Practices

1. Always handle errors gracefully
2. Validate input before database operations
3. Use connection pooling
4. Monitor query performance
5. Implement appropriate logging
6. Test edge cases thoroughly
7. Document important patterns

---

## Common Issues

| Issue | Solution |
|-------|----------|
| Connection refused | Check database URL and credentials |
| Timeout errors | Increase timeout values |
| Query slow | Add indexes to frequently queried fields |
| Connection pool exhaustion | Increase pool size |
| Memory usage high | Check for connection leaks |

---

## Next Steps

1. Read `theory.md` for conceptual understanding
2. Follow `setup.md` for installation
3. Test API endpoints using the React UI
4. Review code examples in `controller.js`
5. Experiment and modify code

---

## Resources

- [Theory Documentation](./theory.md)
- [Setup Guide](./setup.md)
- [API Implementation](./controller.js)
- [Validation Schema](./schema.js)

---

## Testing

The `App.jsx` component provides an interactive UI for testing all endpoints. Access at `http://localhost:3000`.

---

## Checklists

### Initial Setup
- [ ] Dependencies installed
- [ ] Environment variables configured
- [ ] Database running
- [ ] Server starting without errors
- [ ] API responding

### Development
- [ ] CRUD operations working
- [ ] Error handling tested
- [ ] Input validation working
- [ ] Performance acceptable
- [ ] Logging functioning

### Production
- [ ] All tests passing
- [ ] Error handling robust
- [ ] Monitoring in place
- [ ] Performance optimized
- [ ] Documentation complete
