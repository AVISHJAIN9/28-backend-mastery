# Setup Guide - CRUD Controllers

## Dependencies

```bash
npm install express cors helmet joi uuid dotenv
```

### Package Purposes
- **express**: Web framework
- **cors**: Cross-origin resource sharing
- **helmet**: Security headers
- **joi**: Input validation
- **uuid**: Generate unique IDs
- **dotenv**: Environment variable management

## Environment Variables

Create `.env` file:

```env
# Server Configuration
HTTP_PORT=5001
NODE_ENV=development

# CORS Configuration
FRONTEND_URL=http://localhost:3000

# Logging
LOG_LEVEL=debug
```

## File Structure

```
01-crud-controllers/
├── server.js          # Express app setup
├── controller.js      # CRUD business logic
├── routes.js          # API endpoint definitions
├── middleware.js      # Custom middleware
├── schema.js          # Input validation schemas
├── .env.example       # Environment template
├── package.json       # Dependencies
├── README.md          # Documentation
└── App.jsx            # React testing UI
```

## How to run

### Development

```bash
# Install dependencies
npm install

# Copy environment file
cp .env.example .env

# Start server
npm start

# Server runs on http://localhost:5001
```

### With Watch Mode

```bash
npm install -D nodemon
npm run dev
```

## How to test

### Using cURL

**Create Product**:
```bash
curl -X POST http://localhost:5001/api/products \
  -H "Content-Type: application/json" \
  -d '{"name":"Laptop","price":999}'
```

**Get All Products**:
```bash
curl http://localhost:5001/api/products?limit=10&offset=0
```

**Get Single Product**:
```bash
curl http://localhost:5001/api/products/[ID]
```

**Update Product**:
```bash
curl -X PATCH http://localhost:5001/api/products/[ID] \
  -H "Content-Type: application/json" \
  -d '{"price":899}'
```

**Delete Product**:
```bash
curl -X DELETE http://localhost:5001/api/products/[ID]
```

### Using React Testing UI

1. Open browser to `http://localhost:3000`
2. Use the built-in testing form to create/read/update/delete products

### Automated Tests

```bash
npm test
```

## API Endpoints

| Method | Endpoint | Purpose |
|--------|----------|----------|
| POST | `/api/products` | Create new product |
| GET | `/api/products` | List all products (paginated) |
| GET | `/api/products/:id` | Get single product |
| PATCH | `/api/products/:id` | Update product |
| DELETE | `/api/products/:id` | Delete product |
| GET | `/health` | Health check |

## Troubleshooting

**Port already in use**:
```bash
# Kill process on port 5001
lsof -i :5001
kill -9 [PID]
```

**Module not found**:
```bash
# Reinstall dependencies
rm -rf node_modules package-lock.json
npm install
```

**CORS errors**:
Ensure `FRONTEND_URL` in `.env` matches your client origin.
