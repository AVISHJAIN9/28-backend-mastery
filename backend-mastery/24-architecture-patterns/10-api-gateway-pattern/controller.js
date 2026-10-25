// ==================== API Gateway Pattern ====================
// Central entry point for backend services (UserService, ProductService, etc.)

let users = [];
let nextId = 1;

// ==================== Simulated Backend Services ====================

const UserService = {
  getAllUsers: () => users.map(u => ({ id: u.id, name: u.name, email: u.email })),
  getUserById: (id) => users.find(u => u.id === id) || null,
  createUser: (data) => {
    const newUser = {
      id: nextId++,
      name: data.name,
      email: data.email,
      role: data.role || 'user',
      status: 'active',
      createdAt: new Date(),
      serviceId: 'user-service-v1'
    };
    users.push(newUser);
    return newUser;
  },
  updateUser: (id, data) => {
    const user = users.find(u => u.id === id);
    if (user) Object.assign(user, data);
    return user;
  },
  deleteUser: (id) => {
    const index = users.findIndex(u => u.id === id);
    if (index !== -1) {
      users.splice(index, 1);
      return true;
    }
    return false;
  }
};

// Simulated Auth Service
const AuthService = {
  validateToken: (token) => {
    return token && token.startsWith('Bearer ') ? { valid: true, user: 'user1' } : { valid: false };
  },
  authorize: (user, resource) => {
    return true;
  }
};

// ==================== Gateway Controllers ====================

const getAllUsers = () => {
  console.log('[Gateway] Routing to UserService.getAllUsers');
  return UserService.getAllUsers();
};

const getUserById = (id) => {
  console.log(`[Gateway] Routing to UserService.getUserById(${id})`);
  return UserService.getUserById(id);
};

const createUser = (userData) => {
  if (!userData.name || !userData.email) {
    throw new Error('Name and email required');
  }
  console.log('[Gateway] Routing to UserService.createUser');
  return UserService.createUser(userData);
};

const updateUser = (id, userData) => {
  console.log(`[Gateway] Routing to UserService.updateUser(${id})`);
  return UserService.updateUser(id, userData);
};

const deleteUser = (id) => {
  console.log(`[Gateway] Routing to UserService.deleteUser(${id})`);
  return UserService.deleteUser(id);
};

// ==================== Gateway Service Status ====================

const getServiceStatus = () => {
  return {
    gateway: 'operational',
    services: [
      { name: 'UserService', status: 'healthy', latency: Math.random() * 50 },
      { name: 'AuthService', status: 'healthy', latency: Math.random() * 30 },
      { name: 'NotificationService', status: 'healthy', latency: Math.random() * 40 }
    ],
    timestamp: new Date()
  };
};

// ==================== Exports ====================

module.exports = {
  getAllUsers,
  getUserById,
  createUser,
  updateUser,
  deleteUser,
  getServiceStatus,
  AuthService,
  _resetData: () => {
    users = [];
    nextId = 1;
  }
};

