# Setup Guide - Soft Delete Controller

## Database Schema

```sql
ALTER TABLE users ADD COLUMN deleted_at TIMESTAMP NULL;
CREATE INDEX idx_deleted_at ON users(deleted_at);
```

## API Endpoints

- DELETE /api/users/:id - Soft delete
- POST /api/users/:id/restore - Restore deleted
- GET /api/users/:id - Skip deleted records
- GET /api/admin/deleted - View deleted records
