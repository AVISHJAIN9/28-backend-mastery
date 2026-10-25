# Module 03: Modular Monolith Architecture

## What is this?

A **modular monolith** is a monolithic application organized by business domains/features rather than technical layers. Each module contains its own controllers, services, and data logic while sharing infrastructure (database, authentication, logging).

## Why Use It?

- **Better Organization** - Find all related code in one place
- **Clear Boundaries** - Define module interfaces explicitly
- **Team Scalability** - 10-30 developers can work independently
- **Natural Migration Path** - Extract modules into microservices later
- **Simplicity** - Easier than microservices, better than unorganized monolith

## How It Works

```
Single Express Process
├── User Module (routes, controller, service)
├── Order Module (routes, controller, service)
├── Product Module (routes, controller, service)
└── Payment Module (routes, controller, service)
└─→ Single Database
```

Each module:
1. Handles one business domain
2. Exports clean public API
3. Doesn't directly depend on other modules' implementations
4. Uses shared infrastructure (database)

## Key Differences vs Layered Monolith

| Aspect | Layered (01) | Modular (03) |
|--------|--------|---------|
| Organization | By technical layer | By business domain |
| Controllers folder | One folder, all endpoints | Each module has controllers |
| Module size | Large after growth | Manageable by domain |
| Team assignment | By endpoint type | By business domain |
| Extraction to service | Difficult | Natural evolution |
| Code reuse | Via shared service layer | Via module interfaces |

## Migration to Microservices

When a module is production-ready to extract:

```
Step 1: Modular Monolith
  Order Module: /api/orders → monolith process

Step 2: Dual-write Phase  
  Order Service: /api/orders → external service
  Monolith Order Module: forwards to service

Step 3: Customer Migration
  Old clients: → monolith (forwarding)
  New clients: → Order Service (direct)

Step 4: Cleanup
  Remove Order Module from monolith
  Decom old forwarding code
```

## Preventing Common Issues

### Issue 1: Hidden Dependencies
```javascript
// ❌ BAD - Order module directly imports User module implementation
const userDB = require('../user-module/database');

// ✅ GOOD - Use public interface
const userService = require('../user-module').service;
```

### Issue 2: Shared Database Coupling
```javascript
// ❌ BAD - Order module directly queries users table
db.query('SELECT * FROM users WHERE id = ?');

// ✅ GOOD - Use User Module's service layer
const user = userService.getUserById(userId);
```

### Issue 3: Circular Dependencies
```javascript
// This creates tight coupling and extraction headaches
Order Module → User Module → Order Module
```

## Module Interface Design

Each module exposes clean interface:

```javascript
// user-module/index.js
module.exports = {
  service: {
    getUser: (id) => {...},
    createUser: (data) => {...},
    updateUser: (id, data) => {...}
  },
  routes: userRoutes,
  schemas: {
    userInput: userSchema,
    userOutput: userResponseSchema
  }
};
```

## When to Extract a Module

Module should be extracted when:
- ✅ Clear business boundary
- ✅ Independent scaling needs (needs 10x more resources)
- ✅ Different team owns it
- ✅ External integrations specific to module
- ✅ High enough complexity

Wait to extract if:
- ❌ Tightly coupled with other modules
- ❌ Shared data models
- ❌ Same team manages it and others
- ❌ Scale is uniform across all modules

## Implementation Patterns

### Pattern 1: Event Publishing Within Monolith
```javascript
// Order Module publishes event
EventEmitter.emit('order:created', { orderId: 123 });

// Payment Module listens
EventEmitter.on('order:created', handleNewOrder);
```

### Pattern 2: Module Registry
```javascript
const modules = {
  user: require('./user-module'),
  order: require('./order-module'),
  product: require('./product-module'),
  payment: require('./payment-module')
};

// Clear entry points
const userService = modules.user.service;
```

### Pattern 3: API Composition
```javascript
// Payment module composes services from other modules
const { user, order, product } = require('../modules');

const processOrder = async (paymentData) => {
  const order = await order.service.getOrder(paymentData.orderId);
  const user = await user.service.getUser(order.userId);
  const items = await product.service.getItems(order.itemIds);
  // Process payment with composed data
};
```

## Real-World Example: E-Commerce

```
monolith/
├── user-module/       (Team A)
│   ├── registration
│   ├── profile
│   └── authentication
├── product-module/    (Team B)
│   ├── catalog
│   ├── search
│   └── reviews
├── order-module/      (Team C)
│   ├── orders
│   ├── checkout
│   └── history
└── payment-module/    (Team D)
    ├── payment processing
    ├── invoices
    └── refunds
```

When traffic increases:
- Product catalog needs more cache → Extract to microservice
- Payment needs PCI compliance → Extract first
- Orders stay in monolith for now
- User auth still in monolith as foundation

## Comparison with Microservices

| Need | Modular Monolith | Microservices |
|------|---------|----------|
| Team size | 10-30 | 50+ |
| Scaling | Uniform | Independent |
| Deployment | Single unit | Per service |
| Complexity | Manageable | Very high |
| Data Consistency | ACID | Eventual |
| Time to Market | Fast | Slow |

Start with modular monolith, move to microservices when you need them (usually years later).
