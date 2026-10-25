# Domain-Driven Design Design Pattern

## Quick Start
```bash
cd 10-domain-driven-design-ddd
npm install
npm run dev
# Backend runs on http://localhost:3010
```

## What is this?

This module demonstrates the **Domain-Driven Design** design pattern with practical examples.

## API Endpoints

- `GET /health` - Health check
- `GET /api/info` - Pattern information
- `POST /api/create` - Create resource
- `GET /api/list` - List resources
- `GET /api/:id` - Get resource by ID
- `PUT /api/:id` - Update resource
- `DELETE /api/:id` - Delete resource

## Why does it matter?

The Domain-Driven Design is fundamental for:
- Clean code architecture
- Maintainable applications
- SOLID principles
- Real-world software design

## How it works (step by step)

1. Clone/download the module
2. Install dependencies
3. Start the development server
4. Test endpoints via React UI or cURL
5. Review the code to understand the pattern

## Key concepts

- **Encapsulation** - Hide implementation details
- **Abstraction** - Define clear interfaces
- **Separation of Concerns** - Each class one responsibility
- **Flexibility** - Easy to extend and modify

## Common mistakes

1. Over-engineering for simple cases
2. Tight coupling between components
3. Not following the pattern correctly
4. Missing error handling
5. Not testing adequately

## Real world usage

This pattern is used in:
- Production web applications
- Enterprise software
- Framework and library design
- System architecture
- API design

## Testing

Test via React UI at `http://localhost:3000` or use cURL:

```bash
curl http://localhost:3010/health
curl http://localhost:3010/api/info
```
