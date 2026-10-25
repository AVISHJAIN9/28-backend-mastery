# Decorator Pattern: Extending Functionality

## What is the Decorator Pattern?

The **Decorator Pattern** is a structural design pattern that lets you attach additional responsibilities to an object dynamically, providing a flexible alternative to subclassing.

## Key Characteristics

1. **Dynamic Addition** - Add functionality at runtime
2. **Composition** - Wraps objects instead of inheritance
3. **Same Interface** - Decorator has same interface as original
4. **Stacking** - Multiple decorators can stack
5. **Transparent** - Client doesn't know if object is decorated

## Real-World Analogy

Clothing and accessories:
- Base object: person
- Decorators: shirt, jacket, hat, gloves
- Can add/remove decorators dynamically
- Order doesn't matter (mostly)
- Person still has same interface

## Why Use Decorator Pattern?

### 1. **Avoid Subclass Explosion**
Instead of creating subclass for each combination, use composition.

### 2. **Separation of Concerns**
Each decorator handles one responsibility.

### 3. **Runtime Composition**
Decide which decorators to apply at runtime.

### 4. **Reusability**
Decorators work with any object having same interface.

## Common Applications

1. **Logging** - Add logging to methods
2. **Caching** - Cache expensive operations
3. **Authentication** - Add auth checks
4. **Validation** - Validate inputs
5. **Compression** - Compress data streams
6. **Encryption** - Encrypt sensitive data

## Decorator Stacking

```javascript
let service = new UserService();
service = new LoggingDecorator(service);
service = new CachingDecorator(service);
service = new AuthenticationDecorator(service);
```

## Benefits

1. **Flexibility** - Add/remove features dynamically
2. **Single Responsibility** - Each decorator one concern
3. **Reusability** - Decorators work with any component
4. **Composability** - Combine multiple decorators
5. **Non-Invasive** - Don't modify original classes
6. **Testability** - Test each decorator independently

## Real-World Examples

- **Node.js Middleware** - Express decorators
- **Python Decorators** - @property, @staticmethod
- **Java Annotations** - @Transactional, @Cached
- **Component Enhancement** - React HOCs
- **Stream Wrapping** - Buffer, compression, encryption

## Decorator vs Other Patterns

| Pattern | Purpose | When To Use |
|---------|---------|----------|
| **Decorator** | Add functionality | Adding behaviors |
| **Strategy** | Algorithm families | Swapping algorithms |
| **Proxy** | Control access | Lazy loading/caching |
| **Adapter** | Interface compatibility | Different interfaces |

## Conclusion

Decorator Pattern is essential for:
- Adding responsibilities dynamically
- Avoiding subclass explosion
- Composing features flexibly
- Clean code architecture
