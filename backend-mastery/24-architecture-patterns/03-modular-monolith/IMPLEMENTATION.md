# Module 03: Modular Monolith - Implementation Guide

## Architecture

A modular monolith maintains the monolith's deployment model (single binary) while organizing code BY FEATURE MODULES rather than by layer.

### Comparison

**Layered Monolith (Module 01)**:
```
app/
├── controllers/ (all controllers)
├── services/ (all services)
├── routes/ (all routes)
└── models/ (all models)
```

**Modular Monolith (Module 03)**:
```
app/
├── user-module/
│   ├── controller.js
│   ├── routes.js
│   ├── service.js
│   └── model.js
├── order-module/
│   ├── controller.js
│   ├── routes.js
│   ├── service.js
│   └── model.js
└── product-module/
    ├── controller.js
    ├── routes.js
    ├── service.js
    └── model.js
```

## Key Principles

1. **Clear Module Boundaries** - Each module handles one business domain
2. **Encapsulation** - Module exports only public API
3. **No Cross-Module Dependencies** - Modules don't depend on implementation details
4. **Shared Infrastructure** - Database, logging, auth are shared
5. **Easy to Extract** - Modules can become microservices later
6. **Team Ownership** - Each team owns one module

## Module Structure

Each module contains:
- `models.js` - Data structures
- `service.js` - Business logic
- `controller.js` - HTTP handlers
- `routes.js` - Express routes
- `schema.js` - Input validation
- `index.js` - Public API export

## Benefits Over Layered Monolith

✅ **Better Maintainability** - Find all order code in one place
✅ **Clear Responsibilities** - Each module is self-contained
✅ **Easier Testing** - Test modules independently
✅ **Team Autonomy** - Teams work on their modules
✅ **Preparation for Splitting** - Easy transition to microservices
✅ **Reduced Complexity** - Clearer code organization
✅ **Parallelization** - Teams can work independently

## When to Use

✅ **Use modular monolith when:**
- Team has 10-30 developers
- Multiple independent business domains
- Plan to eventually split to microservices
- Want benefits of monolith with better organization

❌ **Don't use when:**
- Small team (< 10)
- Very simple domain (1-2 business areas)
- Not planning to grow

## Relationship to Other Modules

- **Module 01 (Well-Structured Monolith)** - Foundation layer-based approach
- **Module 03 (Modular Monolith)** - This - Feature-based organization
- **Module 07 (Clean Architecture)** - Advanced layering + modular
- **Module 02 (Microservices)** - Extract modules into separate services

## Migration Path

Monolith → Modular Monolith → Microservices

When ready to extract order module to microservice:
1. Create order-service with own database
2. Update order-module to call external service
3. Deploy independently
4. Gradually migrate clients to external service
5. Remove order-module from monolith
