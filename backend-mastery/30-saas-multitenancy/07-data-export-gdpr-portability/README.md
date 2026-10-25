# Data Export & GDPR Portability

## What is this?

GDPR (and similar laws) require you to give users all their data in a portable format (JSON, CSV) on request, and delete their account completely if they ask.

## Why does it matter?

- **Legal**: GDPR fines are 4% of global revenue ($500k minimum)
- **User Trust**: Users feel in control of their data
- **Switching**: Users can export data to competitor
- **Deletes**: Account deletion must be complete (20+ tables)

## How it works

### Export Flow
1. User clicks "Export my data"
2. Trigger async job (takes few minutes)
3. ZIP all their files (documents, settings, metadata)
4. Generate download link (expires in 7 days)
5. Email link → user downloads

### Delete Flow
1. User clicks "Delete account"
2. Schedule deletion in 30 days (grace period)
3. Send confirmation email
4. User can cancel within 30 days
5. After 30 days: cascade delete ALL associated data

## Setup

```bash
cd 07-data-export-gdpr-portability
npm install
npm start
```

Server runs on `http://localhost:4007`

## Testing

1. **Request export**: `POST /api/export` → `{type, format}`
2. **Check status**: `GET /api/export/:exportId`
3. **Request delete**: `POST /api/account/delete` → scheduled in 30 days
4. **Cancel delete**: `POST /api/account/delete/:deleteId/cancel`

## Key Concepts

- **GDPR Right to Portability**: Data in standard format (JSON/CSV)
- **GDPR Right to be Forgotten**: Complete deletion
- **Grace Period**: 30 days before actual deletion
- **Async Processing**: Don't block on large exports
- **TTL**: Downloaded files expire

## Common Mistakes

❌ Synchronous export (breaks on 1GB data)  
❌ Instant deletion (no grace period)  
❌ Orphaned data (email addresses in logs)  
❌ No way to cancel deletion  

## API Endpoints

### Data Export
- `POST /api/auth/login` - Get JWT token
- `POST /api/tenants/:tenantId/export` - Request data export
  - Body: `{ format: 'json|csv|xml', includeArchived: true }`
- `GET /api/tenants/:tenantId/exports` - List export jobs
- `GET /api/tenants/:tenantId/exports/:exportId` - Get export status
- `GET /api/tenants/:tenantId/exports/:exportId/download` - Download exported file

### Privacy Operations
- `POST /api/tenants/:tenantId/delete-account` - Delete all tenant data
- `GET /api/tenants/:tenantId/data-map` - What data we have on you

## Security Considerations

1. **Authenticity**: Only user can export their own data
2. **Encryption**: Encrypt export files in transit
3. **Completeness**: Include all related records
4. **Portability**: Use open formats (JSON, CSV)
5. **Time-Limiting**: Expire download links after 7 days

## Database Schema

```sql
CREATE TABLE data_exports (
  id UUID PRIMARY KEY,
  tenant_id UUID NOT NULL,
  requested_by VARCHAR(100),
  format VARCHAR(20),
  status VARCHAR(20),
  file_path TEXT,
  file_size INTEGER,
  created_at TIMESTAMP DEFAULT NOW(),
  expires_at TIMESTAMP,
  completed_at TIMESTAMP
);

CREATE TABLE export_logs (
  id SERIAL PRIMARY KEY,
  export_id UUID REFERENCES data_exports(id),
  table_name VARCHAR(100),
  record_count INTEGER,
  exported_at TIMESTAMP
);
```

## Export Manifest

```json
{
  "exportId": "export-123",
  "tenantId": "tenant-1",
  "exportedAt": "2025-01-15T10:30:00Z",
  "format": "json",
  "tables": {
    "users": { "count": 5, "records": [...] },
    "documents": { "count": 127, "records": [...] },
    "audit_logs": { "count": 3421, "records": [...] }
  },
  "summary": {
    "totalRecords": 3553,
    "totalSize": "2.3 MB"
  }
}
```

## Implementation Checklist

- [ ] Create export job schema
- [ ] Implement data retrieval query
- [ ] Add CSV/JSON/XML formatters
- [ ] Implement async export (background job)
- [ ] Add email notification
- [ ] Create download link generation
- [ ] Implement expiration (7 days)
- [ ] Add audit logging
- [ ] Test with real data volumes

## Next Steps

1. Review [theory.md](./theory.md) for detailed concepts
2. Check [schema.js](./schema.js) for data models
3. Explore [controller.js](./controller.js) for business logic
4. Run tests with [App.jsx](./App.jsx)

## References

- GDPR Article 20 (Data Portability)
- CCPA § 1798.100 (Consumer Access Rights)
- Data Portability Standard (Solid/Social Web)
❌ Export doesn't include everything (metadata, settings)
