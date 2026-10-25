# Setup Guide - Cursor-Based Pagination

## Installation

```bash
npm install express cors helmet joi uuid dotenv
```

## Environment Variables

Create `.env` file:
```env
HTTP_PORT=5003
NODE_ENV=development
FRONTEND_URL=http://localhost:3000
DATABASE_URL=mongodb://localhost:27017/pagination
PAGE_SIZE=10
```

## Running

```bash
# Development
npm start

# With watch mode
npm run dev

# Server runs on http://localhost:5003
```

## Testing with cURL

**First Page**:
```bash
curl http://localhost:5003/api/items?limit=10
```

**Next Page** (using cursor from response):
```bash
curl "http://localhost:5003/api/items?limit=10&cursor=eyJpZCI6IDEwfQ=="
```

**With Sorting**:
```bash
curl "http://localhost:5003/api/items?limit=10&sort=createdAt:desc"
```

## API Endpoints

| Method | Endpoint | Usage |
|--------|----------|-------|
| GET | `/api/items` | Get paginated items |
| GET | `/api/items?limit=20` | Custom page size |
| GET | `/api/items?cursor=token` | Get next page |
| GET | `/api/items?sort=name:asc` | Sort by field |
| GET | `/api/items?filter=active:true` | Apply filters |

## Query Parameters

- `limit`: Items per page (default: 10, max: 100)
- `cursor`: Pagination token from previous response
- `sort`: Sort field and direction (e.g., `createdAt:desc`)
- `filter`: Filter criteria (e.g., `status:active`)

## Response Format

```json
{
  "data": [],
  "pageInfo": {
    "hasNextPage": true,
    "endCursor": "abc123",
    "totalCount": 500
  }
}
```
