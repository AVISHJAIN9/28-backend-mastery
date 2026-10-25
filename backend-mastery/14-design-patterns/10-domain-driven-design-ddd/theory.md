# Domain-Driven Design: Modeling Business Logic

## What is Domain-Driven Design (DDD)?

**Domain-Driven Design** is a software development approach that focuses on modeling the business domain and using that model as the basis for all technical decisions.

## Key Concepts

### 1. **Ubiquitous Language**

A shared language between business and technical people.

```text
Business: "Customer places order"
Technical: "Create Order aggregate with Customer entity"
Both mean the same thing
```

### 2. **Bounded Contexts**

Define clear boundaries around domain models.

```text
Sales Context:
  - Customer, Product, Order
  - Price, discount

Shipping Context:
  - Package, Delivery, Location
  - Tracking, Route

Each context independent model
```

### 3. **Aggregates**

Clusters of related objects treated as single unit.

```javascript
class OrderAggregate {
  id;
  customer;        // Root entity
  items[];         // Child entities
  status;
  total;
}
```

### 4. **Entities and Value Objects**

**Entities**: Have identity, change over time
**Value Objects**: No identity, immutable

```javascript
// Entity - Identity matters
class User {
  id;       // Identity
  name;     // Can change
  email;    // Can change
}

// Value Object - Value matters
class Money {
  amount;
  currency;
  // Two Money objects with same value are equal
}
```

### 5. **Repositories**

Abstract data access, focus on domain.

```javascript
class UserRepository {
  async findById(id) { }
  async save(user) { }
  async delete(id) { }
}
```

### 6. **Domain Events**

Captured business events.

```javascript
class UserCreatedEvent {
  userId;
  email;
  createdAt;
}

emitter.emit('user.created', event);
```

## DDD Layers

1. **Domain Layer** - Business logic
2. **Application Layer** - Orchestration
3. **Infrastructure Layer** - Data access, external services
4. **Presentation Layer** - User interface

## Benefits

1. **Clear Models** - Domain well understood
2. **Communication** - Business and tech speak same language
3. **Flexibility** - Changes isolated to bounded contexts
4. **Scalability** - Independent contexts can scale separately
5. **Maintainability** - Code mirrors business domain

## Real-World Examples

- **E-commerce** - Catalog, Cart, Order, Shipping contexts
- **Banking** - Account, Transaction, Loan contexts
- **Healthcare** - Patient, Appointment, Prescription contexts
- **SaaS** - Subscription, Billing, Identity contexts

## DDD vs CRUD

| DDD | CRUD |
|-----|------|
| Models domain | Models database |
| Focuses on behavior | Focuses on data |
| Rich domain objects | Anemic models |
| Complex logic | Simple CRUD |

## Conclusion

Domain-Driven Design is essential for:
- Modeling complex business domains
- Improving communication
- Building maintainable systems
- Scaling team efforts
