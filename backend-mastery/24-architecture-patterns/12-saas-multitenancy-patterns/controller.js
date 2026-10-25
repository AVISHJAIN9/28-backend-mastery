// ==================== SaaS Multitenancy Pattern ====================
// Multi-tenant isolation with tenant-aware operations

const tenantData = {
  'tenant-1': { users: [], nextId: 1 },
  'tenant-2': { users: [], nextId: 1 },
  'tenant-3': { users: [], nextId: 1 }
};

// Initialize sample data
tenantData['tenant-1'].users = [
  { id: 1, name: 'Alice', email: 'alice@tenant1.com', role: 'admin', status: 'active' }
];
tenantData['tenant-1'].nextId = 2;

// ==================== Tenant Context ====================

class TenantContext {
  constructor(tenantId) {
    this.tenantId = tenantId;
    if (!tenantData[tenantId]) {
      tenantData[tenantId] = { users: [], nextId: 1 };
    }
  }

  getUsers() {
    return tenantData[this.tenantId].users;
  }

  getUserById(id) {
    return this.getUsers().find(u => u.id === id) || null;
  }

  createUser(userData) {
    if (!userData.name || !userData.email) {
      throw new Error('Name and email required');
    }

    if (this.getUsers().some(u => u.email === userData.email)) {
      throw new Error('Email already exists in this tenant');
    }

    const newUser = {
      id: tenantData[this.tenantId].nextId++,
      name: userData.name,
      email: userData.email,
      role: userData.role || 'user',
      status: 'active',
      tenantId: this.tenantId,
      createdAt: new Date()
    };

    this.getUsers().push(newUser);
    return newUser;
  }

  updateUser(id, updates) {
    const user = this.getUserById(id);
    if (!user) return null;
    Object.assign(user, updates);
    return user;
  }

  deleteUser(id) {
    const users = this.getUsers();
    const index = users.findIndex(u => u.id === id);
    if (index === -1) return false;
    users.splice(index, 1);
    return true;
  }
}

// ==================== Multi-Tenant Controllers ====================

const getAllUsers = (tenantId) => {
  const context = new TenantContext(tenantId);
  return context.getUsers().map(u => ({
    id: u.id,
    name: u.name,
    email: u.email,
    role: u.role,
    status: u.status
  }));
};

const getUserById = (tenantId, userId) => {
  const context = new TenantContext(tenantId);
  return context.getUserById(userId);
};

const createUser = (tenantId, userData) => {
  const context = new TenantContext(tenantId);
  return context.createUser(userData);
};

const updateUser = (tenantId, userId, userData) => {
  const context = new TenantContext(tenantId);
  return context.updateUser(userId, userData);
};

const deleteUser = (tenantId, userId) => {
  const context = new TenantContext(tenantId);
  return context.deleteUser(userId);
};

const getTenantStats = (tenantId) => {
  const context = new TenantContext(tenantId);
  const users = context.getUsers();
  return {
    tenantId,
    totalUsers: users.length,
    activeUsers: users.filter(u => u.status === 'active').length,
    roles: {
      admin: users.filter(u => u.role === 'admin').length,
      user: users.filter(u => u.role === 'user').length,
      moderator: users.filter(u => u.role === 'moderator').length
    }
  };
};

// ==================== Exports ====================

module.exports = {
  getAllUsers,
  getUserById,
  createUser,
  updateUser,
  deleteUser,
  getTenantStats,
  TenantContext,
  _resetData: () => {
    for (const tenantId in tenantData) {
      tenantData[tenantId] = { users: [], nextId: 1 };
    }
    tenantData['tenant-1'].users = [
      { id: 1, name: 'Alice', email: 'alice@tenant1.com', role: 'admin', status: 'active' }
    ];
    tenantData['tenant-1'].nextId = 2;
  }
};

