// ==================== CQRS Controllers ====================
// Separated Command (Write) and Query (Read) models

// ==================== Write Model (Command Side) ====================

let users = [];
let nextId = 1;

const commandCreateUser = (userData) => {
  if (!userData.name || !userData.email) {
    throw new Error('Name and email are required');
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
    createdAt: new Date()
  };

  users.push(newUser);
  console.log(`[Command] User created: ${newUser.id}`);
  return newUser;
};

const commandUpdateUser = (id, userData) => {
  const user = users.find(u => u.id === id);
  if (!user) return null;

  if (userData.email && userData.email !== user.email) {
    if (users.some(u => u.email === userData.email)) {
      throw new Error('Email already exists');
    }
  }

  if (userData.name) user.name = userData.name;
  if (userData.email) user.email = userData.email;
  if (userData.status) user.status = userData.status;
  if (userData.role) user.role = userData.role;
  
  user.updatedAt = new Date();
  console.log(`[Command] User updated: ${id}`);
  return user;
};

const commandDeleteUser = (id) => {
  const index = users.findIndex(u => u.id === id);
  if (index === -1) return false;

  users.splice(index, 1);
  console.log(`[Command] User deleted: ${id}`);
  return true;
};

// ==================== Read Model (Query Side) ====================

const queryGetAllUsers = () => {
  return users.map(user => ({
    id: user.id,
    name: user.name,
    email: user.email,
    role: user.role,
    status: user.status,
    createdAt: user.createdAt
  }));
};

const queryGetUserById = (id) => {
  const user = users.find(u => u.id === id);
  if (!user) return null;
  
  return {
    id: user.id,
    name: user.name,
    email: user.email,
    role: user.role,
    status: user.status,
    createdAt: user.createdAt
  };
};

const queryUsersByRole = (role) => {
  return users
    .filter(u => u.role === role)
    .map(user => ({
      id: user.id,
      name: user.name,
      email: user.email,
      role: user.role,
      status: user.status
    }));
};

const queryUsersByStatus = (status) => {
  return users
    .filter(u => u.status === status)
    .map(user => ({
      id: user.id,
      name: user.name,
      email: user.email,
      role: user.role,
      status: user.status
    }));
};

const queryUserStats = () => {
  return {
    total: users.length,
    byRole: {
      admin: users.filter(u => u.role === 'admin').length,
      moderator: users.filter(u => u.role === 'moderator').length,
      user: users.filter(u => u.role === 'user').length
    },
    byStatus: {
      active: users.filter(u => u.status === 'active').length,
      inactive: users.filter(u => u.status === 'inactive').length,
      suspended: users.filter(u => u.status === 'suspended').length
    }
  };
};

// ==================== Exports ====================

module.exports = {
  // Commands
  commandCreateUser,
  commandUpdateUser,
  commandDeleteUser,
  // Queries
  queryGetAllUsers,
  queryGetUserById,
  queryUsersByRole,
  queryUsersByStatus,
  queryUserStats,
  // Testing
  _resetData: () => {
    users = [];
    nextId = 1;
  }
};

