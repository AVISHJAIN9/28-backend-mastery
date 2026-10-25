# 15 Process Environment Details

## Overview
Implementation of 15 process environment details pattern.

## Quick Start

### 1. Install Dependencies
```bash
npm install
```

### 2. Set Up Environment
```bash
cp .env.example .env
```

### 3. Run the Server
```bash
npm run dev
```

The server will start on http://localhost:3000

## API Endpoints

### Health Check
```
GET /health
```

Returns the health status of the server.

### Main API
```
GET /api
```

Access the main API endpoints at `/api`

## Testing

Use the provided React UI (`App.jsx`) to test endpoints interactively.

You can also test via curl:
```bash
curl http://localhost:3000/health
```

## Files Structure

- `server.js` - Express server setup
- `routes.js` - API route definitions
- `controller.js` - Business logic
- `middleware.js` - Custom middleware
- `schema.js` - Data validation schemas
- `App.jsx` - React testing UI
- `theory.md` - Learning material

## License

MIT
