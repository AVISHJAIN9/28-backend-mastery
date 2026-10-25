# Setup - Type Guards

## Install & Run
```bash
npm install
npm run dev
```

## Environment
```
HTTP_PORT=13010
FRONTEND_URL=http://localhost:3000
```

## Test Endpoints
- GET /api/guard-info
- POST /api/check-type (send JSON with value)

## Key Concepts
- typeof guard - Check primitive types
- instanceof guard - Check class instances
- Type predicates - Custom is keyword
- Discriminated unions - Automatic narrowing
