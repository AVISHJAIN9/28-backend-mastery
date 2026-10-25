# Factory Pattern: Creating Objects Intelligently

## What is the Factory Pattern?

The **Factory Pattern** is a creational design pattern that provides a way to create objects without specifying the exact classes of objects that need to be created. Instead of using the `new` keyword directly, we use a factory function or method that encapsulates the creation logic.

## Key Characteristics

1. **Encapsulation of Creation** - Object creation logic is hidden from the client
2. **Decoupling** - Client code doesn't depend on concrete classes
3. **Extensibility** - Easy to add new types without changing client code
4. **Centralized Logic** - All creation logic in one place
5. **Flexibility** - Can decide which class to instantiate based on runtime conditions

## Real-World Analogy

Think of a car dealership:
- Customers don't build cars themselves
- They request a car type (sedan, SUV, truck)
- The dealership factory builds and delivers the specific car
- Customer doesn't care about manufacturing details
- Dealership can change manufacturing process without affecting customers

## Why Use Factory Pattern?

### 1. **Object Creation Complexity**
```javascript
// Without Factory - Client knows all details
const userManager1 = new UserManager({
  type: 'admin',
  permissions: ['read', 'write', 'delete'],
  database: db,
  logger: logger
});

// With Factory - Simple abstraction
const userManager1 = UserFactory.create('admin');
```

### 2. **Runtime Decision Making**
```javascript
// Factory decides which class to instantiate based on parameters
const user = UserFactory.create(userType);
// If userType is 'admin' -> AdminUser
// If userType is 'guest' -> GuestUser
// If userType is 'premium' -> PremiumUser
```

### 3. **Loose Coupling**
- Client code depends on the factory, not on concrete classes
- Can swap implementations without changing client
- Easy to test with mock objects

### 4. **Centralized Changes**
```javascript
// All creation logic in one place
// If we need to add logging, caching, or validation,
// we only change the factory method
```

## Types of Factory Pattern

### 1. **Simple Factory Pattern**
The simplest form - a static method that returns different objects based on parameters.

```javascript
class PaymentFactory {
  static create(paymentType) {
    if (paymentType === 'credit-card') {
      return new CreditCardPayment();
    } else if (paymentType === 'paypal') {
      return new PayPalPayment();
    } else if (paymentType === 'crypto') {
      return new CryptoPayment();
    }
  }
}

const payment = PaymentFactory.create('paypal');
payment.process(amount);
```

### 2. **Factory Method Pattern**
Uses inheritance and polymorphism - each subclass has its own factory method.

```javascript
class DatabaseFactory {
  createConnection() {
    // Abstract method
  }
}

class MySQLFactory extends DatabaseFactory {
  createConnection() {
    return new MySQLConnection();
  }
}

class MongoDBFactory extends DatabaseFactory {
  createConnection() {
    return new MongoDBConnection();
  }
}
```

### 3. **Abstract Factory Pattern**
Creates families of related objects.

```javascript
class ShapeFactory {
  static create(shape) {
    if (shape === 'circle') return new Circle();
    if (shape === 'square') return new Square();
  }
}

class ColorFactory {
  static create(color) {
    if (color === 'red') return new RedColor();
    if (color === 'blue') return new BlueColor();
  }
}
```

## Benefits

1. **Flexibility** - Easy to add new types
2. **Maintainability** - Changes in one place
3. **Loose Coupling** - Client independent of implementation
4. **Single Responsibility** - Each class has one reason to change
5. **Open/Closed Principle** - Open for extension, closed for modification
6. **Cleaner Code** - Client code is simpler and more readable

## Common Issues & Solutions

| Issue | Problem | Solution |
|-------|---------|----------|
| **Too Many Conditions** | Factory becomes bloated with if/else | Use registry pattern or config |
| **Tight Coupling** | Still depends on factory class | Use dependency injection |
| **Complex Creation** | Multiple steps required | Break into smaller factories |
| **Runtime Type Checking** | Type unknown at composition time | Use configuration or discovery |

## Factory vs Direct Instantiation

**Direct (NO):**
```javascript
// Tight coupling
const user = new AdminUser(name, email, permissions, db, logger, cache);
// Client knows all constructor params
```

**Factory (YES):**
```javascript
// Loose coupling
const user = UserFactory.create('admin', { name, email });
// Client only passes relevant data
```

## Real-World Examples

1. **Database Connections** - Create PostgreSQL, MongoDB, or MySQL connections
2. **Payment Processing** - Credit card, PayPal, Stripe, Crypto
3. **File Operations** - PDF, Excel, CSV file handlers
4. **Notifications** - Email, SMS, Push notifications
5. **Authentication** - OAuth, JWT, Basic Auth
6. **User Roles** - Admin, Manager, User, Guest

## Factory Pattern vs Other Patterns

| Pattern | Purpose | When To Use |
|---------|---------|------------|
| **Factory** | Create objects | Multiple types, runtime decision |
| **Singleton** | One instance | Shared resource (DB, logger) |
| **Builder** | Complex creation | Many optional parameters |
| **Prototype** | Copy existing object | Clone with variations |

## Best Practices

1. Keep factory methods simple
2. Use consistent naming conventions
3. Document supported types
4. Consider using a registry for scalability
5. Separate creation from business logic
6. Use type safety (TypeScript enums for paymentType)
7. Make factories testable
8. Return interfaces, not concrete classes

## Common Mistakes

1. **Over-engineering** - Using factory when direct instantiation would work
2. **God Factory** - Factory knows too many types
3. **Ignoring Validation** - Not validating input type parameter
4. **Tight Constructor Params** - Passing too many dependencies
5. **No Error Handling** - Not handling invalid type requests

## Conclusion

The Factory Pattern is essential for:
- Managing object creation complexity
- Reducing coupling in your codebase
- Making your code more scalable and maintainable
- Following SOLID principles
- Enabling easy testing and mocking

It's one of the most practical and widely-used design patterns in real-world applications.
