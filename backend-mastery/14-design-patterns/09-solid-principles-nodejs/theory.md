# SOLID Principles: Writing Clean Code

## What are SOLID Principles?

**SOLID** is an acronym for five design principles that help create maintainable, scalable, and testable software.

## The Five Principles

### 1. **S - Single Responsibility Principle (SRP)**

A class should have only one reason to change - one responsibility.

```javascript
// Bad - Multiple responsibilities
class User {
  creatUser(data) { }
  saveToDatabase() { }
  validateEmail() { }
  sendEmail() { }
}

// Good - Single responsibility
class User { }
class UserRepository { }
class EmailValidator { }
class EmailService { }
```

### 2. **O - Open/Closed Principle (OCP)**

Software entities should be open for extension but closed for modification.

```javascript
// Bad - Modify existing code to add feature
class PaymentProcessor {
  process(type) {
    if (type === 'credit-card') { }
    else if (type === 'paypal') { }
    // Add new payment? Must modify class
  }
}

// Good - Extend without modifying
class Strategy { }
class CreditCardStrategy extends Strategy { }
class PayPalStrategy extends Strategy { }
```

### 3. **L - Liskov Substitution Principle (LSP)**

Objects of a superclass should be replaceable with objects of its subclasses.

```javascript
// All strategies have same interface
class PaymentStrategy {
  process(amount) { }
  refund(amount) { }
}

if (!strategy.process || !strategy.refund) {
  throw new Error('Invalid strategy');
}
```

### 4. **I - Interface Segregation Principle (ISP)**

Clients should not be forced to depend on interfaces they don't use.

```javascript
// Bad - Bloated interface
interface Database {
  create() { }
  read() { }
  update() { }
  delete() { }
  backup() { }
  restore() { }
}

// Good - Segregated interfaces
interface DataAccess { create/read/update/delete }
interface Backup { backup/restore }
```

### 5. **D - Dependency Inversion Principle (DIP)**

Depend on abstractions, not concrete implementations.

```javascript
// Bad - Depends on concrete class
class UserService {
  constructor() {
    this.db = new MySQLDatabase();
  }
}

// Good - Depends on abstraction
class UserService {
  constructor(database) {
    this.database = database;
  }
}
```

## Benefits of SOLID

1. **Maintainability** - Code easier to understand and modify
2. **Testability** - Easy to mock and test
3. **Flexibility** - Add features without breaking existing code
4. **Scalability** - Code grows without becoming messy
5. **Reusability** - Components can be reused in different contexts

## Real-World Examples

- **E-commerce** - Separate User, Product, Order, Payment
- **CMS** - Separate User, Content, Media, Permission
- **API Gateway** - Separate Auth, Routing, Logging, RateLimit
- **Microservices** - Each service one responsibility

## Anti-Patterns

1. **God Class** - Too many responsibilities
2. **Tight Coupling** - Hard to test and extend
3. **Leaky Abstractions** - Internal details exposed
4. **Wrong Dependencies** - Depending on concrete implementations

## Conclusion

SOLID Principles are essential for:
- Writing maintainable code
- Creating flexible architectures
- Following industry best practices
- Building scalable systems
