# Setup Guide - Bulk Operations

## Installation

```bash
npm install express joi uuid dotenv mysql2 knex
```

## Environment Variables

```env
HTTP_PORT=5009
NODE_ENV=development
DATABASE_URL=mysql://root:password@localhost/bulk_ops
BATCH_SIZE=100
MAX_BULK_SIZE=10000
```

## Running

```bash
npm start
```

## Testing

**Bulk Delete**:
```bash
curl -X DELETE http://localhost:5009/api/bulk/delete \
  -H "Content-Type: application/json" \
  -d '{"ids": ["id1", "id2", "id3"]}'
```

**Bulk Create**:
```bash
curl -X POST http://localhost:5009/api/bulk/create \
  -H "Content-Type: application/json" \
  -d '{
    "items": [
      {"name": "Product 1", "price": 10},
      {"name": "Product 2", "price": 20}
    ]
  }'
```

**Bulk Update**:
```bash
curl -X PATCH http://localhost:5009/api/bulk/update \
  -H "Content-Type: application/json" \
  -d '{
    "updates": [
      {"id": "id1", "status": "active"},
      {"id": "id2", "status": "inactive"}
    ]
  }'
```

## API Endpoints

| Method | Endpoint | Purpose |
|--------|----------|----------|
| POST | `/api/bulk/create` | Create multiple items |
| PATCH | `/api/bulk/update` | Update multiple items |
| DELETE | `/api/bulk/delete` | Delete multiple items |
| GET | `/api/bulk/status/:jobId` | Check job status |
