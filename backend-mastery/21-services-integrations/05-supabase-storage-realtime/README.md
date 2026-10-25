# Supabase Storage & Realtime

## What is this?

Supabase combines PostgreSQL database with real-time features:
- **PostgreSQL Database**: Full-featured SQL database with JSON support
- **Real-time Subscriptions**: WebSocket-based live updates
- **Cloud Storage**: File storage with public/private access control
- **Row-Level Security (RLS)**: Database-level permission system
- **Functions**: Server-side business logic

## Why does it matter?

Supabase provides an open-source Firebase alternative with PostgreSQL power. Enables real-time collaborative applications, complex queries, and true multi-tenancy. Used in production by startups requiring scalable, cost-effective backend infrastructure.

## How it works (step by step)

1. **Authentication**: Bearer token required on all endpoints
2. **Database CRUD**: Insert records into tables, retrieve, update, delete
3. **Real-time Subscriptions**: Subscribe to channel, receive updates when data changes
4. **File Upload**: Upload files to Cloud Storage bucket with metadata
5. **Access Control**: Scope all operations to authenticated user (req.uid)
6. **Publishing**: Publish events on channels subscribers listen to

## Key concepts

- **PostgreSQL JSON**: Store complex objects as JSONB for powerful queries
- **Real-time Channels**: WebSocket connections for live data updates
- **File Buckets**: Separate storage namespaces for different purposes
- **User Scoping**: All data filtered by authenticated user ID
- **Timestamp Tracking**: createdAt/updatedAt for audit trails
- **Cascading Deletes**: Foreign key constraints maintain referential integrity

## Common mistakes

1. **No user scoping** → All users see all data → Always filter by uid
2. **No indexes** → Queries slow down as data grows → Index frequently queried fields
3. **Storing sensitive data unencrypted** → Use encryption for PII
4. **Connection pooling ignored** → Connections exhaust under load → Use connection pools
5. **No backup strategy** → Data loss risk → Regular backups required
6. **Realtime events fire for all changes** → Heavy load → Subscribe selectively

## Real world usage

**Collaborative Editor**: Multiple users edit document simultaneously → real-time sync → changes reflected instantly
**Live Analytics Dashboard**: Events published to Kafka → processed → subscribed dashboard gets updates
**File Sharing**: Users upload files → stored in Cloud Storage → shared via URLs with expiration
**IoT Sensor Data**: Sensors publish data → stored in database → dashboards subscribe to updates

## API Endpoints

### Database
- `POST /api/db/insert` - Create record
- `GET /api/db/:table` - Read all records
- `PUT /api/db/:table/:id` - Update record
- `DELETE /api/db/:table/:id` - Delete record

### Storage
- `POST /api/storage/upload` - Upload file
- `GET /api/storage/files` - List files
- `DELETE /api/storage/:fileId` - Delete file

### Real-time
- `POST /api/realtime/:channel/subscribe` - Subscribe to channel
- `POST /api/realtime/:channel/publish` - Publish event

## Quick Start

```bash
npm install
node server.js
# Running on http://localhost:6305
```
