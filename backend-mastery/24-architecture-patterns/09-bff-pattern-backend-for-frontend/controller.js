// ==================== BFF Pattern - Backend for Frontend ====================
// Optimized API layer tailored for specific frontend clients

let users = [];
let nextId = 1;

// ==================== Data Models ====================

const mockUsers = [
  { id: 1, name: 'Alice', email: 'alice@test.com', role: 'admin', status: 'active', avatar: 'alice.jpg', preferences: { theme: 'dark' } },
  { id: 2, name: 'Bob', email: 'bob@test.com', role: 'user', status: 'active', avatar: 'bob.jpg', preferences: { theme: 'light' } }
];

users = JSON.parse(JSON.stringify(mockUsers));
nextId = 3;

// ==================== BFF - Mobile Optimized ====================

const MobileAPI = {
  getMinimalUsers: () => {
    return users.map(u => ({
      id: u.id,
      name: u.name,
      avatar: u.avatar
    }));
  },

  getDetailedUser: (id) => {
    const user = users.find(u => u.id === id);
    return user ? { ...user } : null;
  }
};

// ==================== BFF - Web Optimized ====================

const WebAPI = {
  getAllUsersWithMeta: () => {
    return {
      users: users.map(u => ({
        id: u.id,
        name: u.name,
        email: u.email,
        role: u.role,
        status: u.status
      })),
      meta: {
        total: users.length,
        activeCount: users.filter(u => u.status === 'active').length
      }
    };
  },

  getPaginatedUsers: (page = 1, limit = 10) => {
    const skip = (page - 1) * limit;
    return {
      data: users.slice(skip, skip + limit),
      pagination: {
        page,
        limit,
        total: users.length,
        totalPages: Math.ceil(users.length / limit)
      }
    };
  }
};

// ==================== BFF - Admin Dashboard ====================

const AdminAPI = {
  getDashboardData: () => {
    return {
      users: users,
      stats: {
        total: users.length,
        byRole: {
          admin: users.filter(u => u.role === 'admin').length,
          user: users.filter(u => u.role === 'user').length
        },
        byStatus: {
          active: users.filter(u => u.status === 'active').length,
          inactive: users.filter(u => u.status === 'inactive').length
        }
      },
      recentActivity: [
        { event: 'User created', timestamp: new Date() },
        { event: 'User updated', timestamp: new Date() }
      ]
    };
  }
};

// ==================== Shared Operations ====================

const createUser = (userData) => {
  if (!userData.name || !userData.email) {
    throw new Error('Name and email required');
  }

  if (users.some(u => u.email === userData.email)) {
    throw new Error('Email already exists');
  }

  const newUser = {
    id: nextId++,
    name: userData.name,
    email: userData.email,
    role: userData.role || 'user',
    status: 'active',
    avatar: userData.avatar || 'default.jpg',
    preferences: { theme: 'light' },
    createdAt: new Date()
  };

  users.push(newUser);
  return newUser;
};

const updateUser = (id, updates) => {
  const user = users.find(u => u.id === id);
  if (!user) return null;
  
  Object.assign(user, updates, { updatedAt: new Date() });
  return user;
};

const deleteUser = (id) => {
  const index = users.findIndex(u => u.id === id);
  if (index === -1) return false;
  users.splice(index, 1);
  return true;
};

// ==================== Exports ====================

module.exports = {
  MobileAPI,
  WebAPI,
  AdminAPI,
  createUser,
  updateUser,
  deleteUser,
  _resetData: () => {
    users = JSON.parse(JSON.stringify(mockUsers));
    nextId = 3;
  }
};

