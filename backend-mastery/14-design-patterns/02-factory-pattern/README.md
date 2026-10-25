# Factory Pattern - Building Objects the Right Way

## Quick Start
```bash
cd 02-factory-pattern
npm install
npm run dev
# Backend runs on http://localhost:3002
```

## What is this?

The Factory Pattern is a creational design pattern that encapsulates object creation logic, allowing you to create different types of objects through a standardized interface. Instead of using `new` directly, clients request objects from a factory.

## API Endpoints

### Vehicle Factory
- `GET /api/factory/vehicles` - Get all available vehicle types
- `POST /api/factory/create-vehicle` - Create a vehicle by type
  ```json
  {
    "type": "car",
    "brand": "Toyota",
    "model": "Camry",
    "year": 2024
  }
  ```

### Notification Factory
- `POST /api/factory/send-notification` - Send notification via factory
  ```json
  {
    "type": "email",
    "recipient": "user@example.com",
    "message": "Hello!",
    "subject": "Test"
  }
  ```

### Logger Factory
- `GET /api/factory/loggers` - Get available logger types
- `POST /api/factory/create-logger` - Create logger instance
  ```json
  {
    "type": "file",
    "filename": "app.log"
  }
  ```

## Why does it matter?

1. **Loose Coupling** - Clients don't depend on concrete classes
2. **Centralized Control** - Object creation logic in one place
3. **Easy Extension** - Add new types without changing existing code
4. **Maintainability** - Changes only in factory, not throughout codebase
5. **Testability** - Mock objects easily through factory

## How it works (step by step)

1. **Client Request** - Client calls factory with type parameter
2. **Factory Decision** - Factory determines which class to instantiate
3. **Object Creation** - Factory creates and returns the appropriate object
4. **Client Use** - Client uses returned object through common interface
5. **No Direct Dependency** - Client never directly instantiates concrete classes

## Key concepts

### Simple Factory
```javascript
const vehicle = VehicleFactory.create('car', { brand: 'Toyota' });
const notification = NotificationFactory.create('email');
```

### Common Interface
All created objects share a common interface (create, send, log, etc.)

### Type Parameter
Factory uses a type string or enum to decide which class to create

### Configuration-Driven
Can switch implementations by configuration without code changes

## Common mistakes

1. **Over-using Factory** - Not every object creation needs a factory
2. **God Factory** - Factories with 100+ if-else conditions
3. **Missing Validation** - Not validating the type parameter
4. **No Error Handling** - Returning null/undefined for unknown types
5. **Tight Coupling Still** - Still passing too many dependencies

## Real world usage

- **E-commerce**: Create different payment processors (PayPal, Stripe, Square)
- **Logging**: Create different loggers (console, file, database)
- **Notifications**: Send via email, SMS, or push notifications
- **Databases**: Connect to MySQL, PostgreSQL, or MongoDB
- **UI Components**: Render different component types from same factory
- **APIs**: Create different API client types (REST, GraphQL, etc.)
