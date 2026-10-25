# Supabase Setup Guide

## Prerequisites
- Supabase account at https://supabase.com
- Node.js 18.x or higher
- npm or yarn

## Step 1: Create Supabase Project

1. Sign up at https://supabase.com
2. Create new project:
   - Set database password (save securely)
   - Choose region close to users
   - Use free pricing for development
3. Wait for database initialization (2-5 minutes)

## Step 2: Get Connection Details

1. Go to Project Settings > Database > Connection String
2. Note project URL: https://your-project.supabase.co
3. Get keys from Settings > API Keys:
   - Anon Key
   - Service Role Key

## Step 3: Install Dependencies

```bash
npm install
```

## Step 4: Create .env File

```bash
cp .env.example .env
```

```env
SUPABASE_URL=https://your-project.supabase.co
SUPABASE_SERVICE_KEY=your-service-role-key
JWT_SECRET=your-super-secret-key
HTTP_PORT=6305
```

## Step 5: Create Database Tables

In Supabase SQL Editor, run:

```sql
-- Create users table
CREATE TABLE users (
  id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
  email VARCHAR(255) UNIQUE NOT NULL,
  name VARCHAR(255),
  created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);

-- Create documents table
CREATE TABLE documents (
  id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
  user_id UUID NOT NULL REFERENCES users(id),
  title VARCHAR(255) NOT NULL,
  content TEXT,
  public BOOLEAN DEFAULT FALSE,
  created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);

-- Create files table
CREATE TABLE files (
  id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
  user_id UUID NOT NULL REFERENCES users(id),
  name VARCHAR(255) NOT NULL,
  storage_path VARCHAR(500),
  created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);

-- Enable RLS
ALTER TABLE documents ENABLE ROW LEVEL SECURITY;
ALTER TABLE files ENABLE ROW LEVEL SECURITY;
```

## Step 6: Enable Row Level Security (RLS)

In SQL Editor, add RLS policies:

```sql
-- Documents: Users see their own or public docs
CREATE POLICY "Users see own docs or public"
  ON documents FOR SELECT
  USING (auth.uid() = user_id OR public = true);

-- Documents: Users create their own
CREATE POLICY "Users create own docs"
  ON documents FOR INSERT
  WITH CHECK (auth.uid() = user_id);
```

## Step 7: Create Storage Bucket

1. Go to Storage > Buckets
2. Create bucket named "user-files"
3. Set to Private
4. Add policies for authenticated users

## Step 8: Enable Real-time

1. Go to Database > Replication
2. Enable for tables: documents, files

## Step 9: Run Development Server

```bash
npm install
node server.js
# Server runs on http://localhost:6305
```

## How to test

```bash
# Create record
curl -X POST http://localhost:6305/api/db/insert \
  -H "Content-Type: application/json" \
  -H "Authorization: Bearer token" \
  -d '{"table":"documents","data":{"title":"My Doc"}}'

# Retrieve records
curl http://localhost:6305/api/db/documents \
  -H "Authorization: Bearer token"

# Upload file
curl -X POST http://localhost:6305/api/storage/upload \
  -H "Authorization: Bearer token" \
  -F "file=@file.txt"

# Subscribe to real-time
curl -X POST http://localhost:6305/api/realtime/documents/subscribe \
  -H "Authorization: Bearer token"
```

## Verification Checklist

- [ ] Supabase project created
- [ ] Connection details in .env
- [ ] Database tables created
- [ ] RLS policies enabled
- [ ] Storage bucket created
- [ ] Real-time enabled
- [ ] Server starts without errors
- [ ] Can create and retrieve records
- [ ] Real-time subscriptions work
- [ ] Storage file uploads work
