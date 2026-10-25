// Multi-tenant database schema with RLS

const schema = `
-- Tenants table
CREATE TABLE IF NOT EXISTS tenants (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  name VARCHAR(255) NOT NULL,
  subdomain VARCHAR(255) UNIQUE NOT NULL,
  plan TEXT DEFAULT 'free',
  created_at TIMESTAMP DEFAULT NOW(),
  updated_at TIMESTAMP DEFAULT NOW()
);

-- Users table with tenant_id
CREATE TABLE IF NOT EXISTS users (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  tenant_id UUID NOT NULL REFERENCES tenants(id) ON DELETE CASCADE,
  name VARCHAR(255) NOT NULL,
  email VARCHAR(255) NOT NULL,
  password_hash VARCHAR(255),
  role TEXT DEFAULT 'member', -- 'admin' or 'member'
  created_at TIMESTAMP DEFAULT NOW(),
  updated_at TIMESTAMP DEFAULT NOW(),
  UNIQUE(tenant_id, email)
);

-- Documents table with tenant_id and RLS
CREATE TABLE IF NOT EXISTS documents (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  tenant_id UUID NOT NULL REFERENCES tenants(id) ON DELETE CASCADE,
  title VARCHAR(255) NOT NULL,
  content TEXT,
  owner_id UUID NOT NULL REFERENCES users(id) ON DELETE CASCADE,
  shared_with TEXT[] DEFAULT ARRAY[]::TEXT[], -- array of user IDs with access
  is_public BOOLEAN DEFAULT FALSE,
  created_at TIMESTAMP DEFAULT NOW(),
  updated_at TIMESTAMP DEFAULT NOW()
);

-- Projects table
CREATE TABLE IF NOT EXISTS projects (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  tenant_id UUID NOT NULL REFERENCES tenants(id) ON DELETE CASCADE,
  name VARCHAR(255) NOT NULL,
  description TEXT,
  owner_id UUID NOT NULL REFERENCES users(id) ON DELETE CASCADE,
  created_at TIMESTAMP DEFAULT NOW(),
  updated_at TIMESTAMP DEFAULT NOW()
);

-- Enable Row-Level Security on all multi-tenant tables
ALTER TABLE users ENABLE ROW LEVEL SECURITY;
ALTER TABLE documents ENABLE ROW LEVEL SECURITY;
ALTER TABLE projects ENABLE ROW LEVEL SECURITY;

-- RLS Policies for users table
CREATE POLICY IF NOT EXISTS users_isolation ON users
  USING (tenant_id = (current_setting('app.current_tenant_id', TRUE))::UUID);

CREATE POLICY IF NOT EXISTS users_insert ON users
  WITH CHECK (tenant_id = (current_setting('app.current_tenant_id', TRUE))::UUID);

-- RLS Policies for documents table
CREATE POLICY IF NOT EXISTS documents_isolation ON documents
  USING (tenant_id = (current_setting('app.current_tenant_id', TRUE))::UUID);

CREATE POLICY IF NOT EXISTS documents_insert ON documents
  WITH CHECK (tenant_id = (current_setting('app.current_tenant_id', TRUE))::UUID);

-- RLS Policies for projects table
CREATE POLICY IF NOT EXISTS projects_isolation ON projects
  USING (tenant_id = (current_setting('app.current_tenant_id', TRUE))::UUID);

CREATE POLICY IF NOT EXISTS projects_insert ON projects
  WITH CHECK (tenant_id = (current_setting('app.current_tenant_id', TRUE))::UUID);

-- Indexes for performance
CREATE INDEX IF NOT EXISTS idx_users_tenant_id ON users(tenant_id);
CREATE INDEX IF NOT EXISTS idx_documents_tenant_id ON documents(tenant_id);
CREATE INDEX IF NOT EXISTS idx_documents_owner_id ON documents(owner_id);
CREATE INDEX IF NOT EXISTS idx_projects_tenant_id ON projects(tenant_id);
CREATE INDEX IF NOT EXISTS idx_projects_owner_id ON projects(owner_id);
`;

module.exports = { schema };

