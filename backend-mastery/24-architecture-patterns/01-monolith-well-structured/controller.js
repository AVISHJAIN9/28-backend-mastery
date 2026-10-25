// ==================== In-Memory Database ====================

let users = [
  { id: 1, name: 'Alice Johnson', email: 'alice@example.com', role: 'admin', status: 'active' },
  { id: 2, name: 'Bob Smith', email: 'bob@example.com', role: 'user', status: 'active' },
  { id: 3, name: 'Charlie Brown', email: 'charlie@example.com', role: 'user', status: 'inactive' }
];

let nextId = 4;

// ==================== Business Logic ====================

/**
 * Get all users
 */
const getAllUsers = () => {
  return users.map(user => ({
    id: user.id,
    name: user.name,
    email: user.email,
    role: user.role,
    status: user.status
  }));
};

/**
 * Get user by ID
 */
const getUserById = (id) => {
  const user = users.find(u => u.id === id);
  if (!user) return null;
  
  return {
    id: user.id,
    name: user.name,
    email: user.email,
    role: user.role,
    status: user.status
  };
};

/**
 * Create new user
 */
const createUser = (userData) => {
  // Business validation
  if (!userData.name || !userData.email) {
    throw new Error('Name and email are required');
  }

  // Check for email uniqueness
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
  return newUser;
};

/**
 * Update user
 */
const updateUser = (id, userData) => {
  const user = users.find(u => u.id === id);
  if (!user) return null;

  // Business logic: validate updates
  if (userData.email && userData.email !== user.email) {
    if (users.some(u => u.email === userData.email)) {
      throw new Error('Email already exists');
    }
  }

  // Only allow certain fields to be updated
  if (userData.name) user.name = userData.name;
  if (userData.email) user.email = userData.email;
  if (userData.status) user.status = userData.status;
  
  // Role can only be changed by admin (simulated)
  if (userData.role) user.role = userData.role;

  user.updatedAt = new Date();
  return user;
};

/**
 * Delete user
 */
const deleteUser = (id) => {
  const index = users.findIndex(u => u.id === id);
  if (index === -1) return false;

  users.splice(index, 1);
  return true;
};

// ==================== Exports ====================

module.exports = {
  getAllUsers,
  getUserById,
  createUser,
  updateUser,
  deleteUser,
  // Expose for testing
  _resetUsers: () => {
    users = [
      { id: 1, name: 'Alice Johnson', email: 'alice@example.com', role: 'admin', status: 'active' },
      { id: 2, name: 'Bob Smith', email: 'bob@example.com', role: 'user', status: 'active' },
      { id: 3, name: 'Charlie Brown', email: 'charlie@example.com', role: 'user', status: 'inactive' }
    ];
    nextId = 4;
  }
};
