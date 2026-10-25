// Mock database schema for organization members and invites

const schema = {
  users: {
    'user-1': { id: 'user-1', email: 'alice@example.com', name: 'Alice Johnson', password: 'hash1', created_at: new Date('2024-01-01') },
    'user-2': { id: 'user-2', email: 'bob@example.com', name: 'Bob Smith', password: 'hash2', created_at: new Date('2024-01-02') },
    'user-3': { id: 'user-3', email: 'charlie@example.com', name: 'Charlie Brown', password: 'hash3', created_at: new Date('2024-01-03') }
  },

  organizations: {
    'org-1': { id: 'org-1', name: 'Acme Corporation', subdomain: 'acme', owner_id: 'user-1', plan: 'pro', created_at: new Date('2024-01-01') },
    'org-2': { id: 'org-2', name: 'Beta Technologies', subdomain: 'beta', owner_id: 'user-3', plan: 'free', created_at: new Date('2024-01-05') }
  },

  organization_members: {
    'member-1': { id: 'member-1', organization_id: 'org-1', user_id: 'user-1', role: 'owner', joined_at: new Date('2024-01-01'), invited_by_id: null },
    'member-2': { id: 'member-2', organization_id: 'org-1', user_id: 'user-2', role: 'admin', joined_at: new Date('2024-01-05'), invited_by_id: 'user-1' },
    'member-3': { id: 'member-3', organization_id: 'org-2', user_id: 'user-3', role: 'owner', joined_at: new Date('2024-01-05'), invited_by_id: null }
  },

  organization_invites: {
    'invite-1': { id: 'invite-1', organization_id: 'org-1', email: 'observer@example.com', role: 'member', invited_by_id: 'user-1', created_at: new Date('2024-01-10'), expires_at: new Date('2024-02-10'), token: 'token1', accepted_at: null }
  }
};

const permissions = {
  owner: ['manage_members', 'invite_users', 'edit_content', 'delete_content', 'view_content', 'delete_org', 'manage_billing'],
  admin: ['manage_members', 'invite_users', 'edit_content', 'delete_content', 'view_content', 'manage_billing'],
  member: ['invite_users', 'edit_content', 'delete_content', 'view_content'],
  viewer: ['view_content']
};

const roleHierarchy = { owner: 4, admin: 3, member: 2, viewer: 1 };

module.exports = { schema, permissions, roleHierarchy };
