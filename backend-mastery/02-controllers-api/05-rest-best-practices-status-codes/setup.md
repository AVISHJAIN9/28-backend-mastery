# Setup Guide - REST Status Codes

## Installation

```bash
npm install express joi helmet dotenv
```

## Environment Variables

```env
HTTP_PORT=5005
NODE_ENV=development
LOG_LEVEL=debug
```

## Running

```bash
npm start
```

## Testing Endpoints

**200 OK Response**:
```bash
curl http://localhost:5005/api/users/1
```

**201 Created Response**:
```bash
curl -X POST http://localhost:5005/api/users \
  -H "Content-Type: application/json" \
  -d '{"name":"Alice","email":"alice@example.com"}'
```

**400 Bad Request**:
```bash
curl -X POST http://localhost:5005/api/users \
  -H "Content-Type: application/json" \
  -d '{"invalid":"data"}'
```

**404 Not Found**:
```bash
curl http://localhost:5005/api/users/99999
```

**422 Unprocessable Entity**:
```bash
curl -X POST http://localhost:5005/api/users \
  -H "Content-Type: application/json" \
  -d '{"name":"Alice","email":"not-email"}'
```

## API Reference

| Endpoint | Expected Status |
|----------|----------|
| GET /api/users/123 | 200 |
| POST /api/users (valid) | 201 |
| POST /api/users (invalid) | 422 |
| GET /api/users/99999 | 404 |
| POST /api/users (malformed) | 400 |
