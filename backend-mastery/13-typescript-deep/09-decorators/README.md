# Module 13.9: TypeScript Decorators

## What This Covers

Decorators provide a way to annotate and modify classes and properties at design-time. This lesson covers:

- Class decorators
- Method decorators
- Property decorators
- Parameter decorators
- Practical Express patterns
- Rate limiting with decorators
- Authentication guards
- Logging and timing decorators

## Why Decorators?

Decorators let you:
- Add metadata to code
- Modify behavior without changing original code
- Create reusable patterns
- Implement cross-cutting concerns (logging, auth, validation)
- Build frameworks (like NestJS)

## Key Concepts

**Decorators are functions** that receive information about what they're decorating and can modify behavior.

```typescript
@Decorator
class MyClass {}

// Is equivalent to:
class MyClass {}
MyClass = Decorator(MyClass);
```

## Learning Path

1. Start with theory.md - Understand decorator concepts
2. Run server.js - See decorators in action
3. Test endpoints - Observe logging and timing
4. Modify decorators - Create your own patterns
5. Build authentication - Implement auth decorator

## Files

- **theory.md** - Comprehensive decorator guide
- **server.js** - Express API with decorators
- **package.json** - Dependencies
- **.env.example** - Configuration template
- **setup.md** - Installation guide
- **checklist.md** - Learning objectives
