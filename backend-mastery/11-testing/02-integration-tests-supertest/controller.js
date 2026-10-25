/**
 * Module 02: Integration Tests - Controller
 * Testable functions for demonstrating Supertest integration patterns
 */

const users = {
  1: { id: 1, name: 'Alice', email: 'alice@test.com', password: 'hashed_pass_1', role: 'admin', active: true },
  2: { id: 2, name: 'Bob', email: 'bob@test.com', password: 'hashed_pass_2', role: 'user', active: true },
  3: { id: 3, name: 'Charlie', email: 'charlie@test.com', password: 'hashed_pass_3', role: 'user', active: false }
};

let userIdCounter = 3;

// ============ USER CRUD OPERATIONS ============

const getAllUsers = () => {
  return Object.values(users).map(u => {
    const { password, ...user } = u;
    return user;
  });
};

const getUserById = (id) => {
  const user = users[id];
  if (!user) {
    throw new Error('User not found');
  }
  const { password, ...safeUser } = user;
  return safeUser;
};

const createUser = (data) => {
  if (!data.name || !data.name.trim()) {
    throw new Error('Name is required');
  }
  if (!data.email || !data.email.includes('@')) {
    throw new Error('Valid email required');
  }
  if (!data.password || data.password.length < 8) {
    throw new Error('Password must be at least 8 characters');
  }

  userIdCounter++;
  const newUser = {
    id: userIdCounter,
    name: data.name,
    email: data.email,
    password: `hashed_${data.password}`,
    role: 'user',
    active: true
  };

  users[newUser.id] = newUser;
  const { password, ...safeUser } = newUser;
  return safeUser;
};

const updateUser = (id, data) => {
  const user = users[id];
  if (!user) {
    throw new Error('User not found');
  }

  if (data.name !== undefined) {
    if (!data.name.trim()) throw new Error('Name cannot be empty');
    user.name = data.name;
  }
  if (data.email !== undefined) {
    if (!data.email.includes('@')) throw new Error('Invalid email');
    user.email = data.email;
  }

  const { password, ...safeUser } = user;
  return safeUser;
};

const deleteUser = (id) => {
  if (!users[id]) {
    throw new Error('User not found');
  }
  delete users[id];
  return { success: true };
};

// ============ AUTHENTICATION ============

const loginUser = (email, password) => {
  const user = Object.values(users).find(u => u.email === email);
  
  if (!user) {
    throw new Error('User not found');
  }
  
  if (user.password !== `hashed_${password}`) {
    throw new Error('Invalid credentials');
  }

  return {
    token: `jwt_token_for_${user.id}`,
    user: { id: user.id, name: user.name, email: user.email, role: user.role }
  };
};

const verifyToken = (token) => {
  if (!token || !token.startsWith('jwt_token_for_')) {
    throw new Error('Invalid token');
  }
  const userId = parseInt(token.replace('jwt_token_for_', ''));
  return users[userId];
};

// ============ BATCH OPERATIONS ============

const createMultipleUsers = (userList) => {
  if (!Array.isArray(userList) || userList.length === 0) {
    throw new Error('Must provide array of users');
  }

  return userList.map(userData => {
    return createUser(userData);
  });
};

// ============ SEARCH & FILTER ============

const searchUsers = (query) => {
  if (!query || !query.trim()) {
    return getAllUsers();
  }

  const lowerQuery = query.toLowerCase();
  return Object.values(users)
    .filter(u => 
      u.name.toLowerCase().includes(lowerQuery) ||
      u.email.toLowerCase().includes(lowerQuery)
    )
    .map(u => {
      const { password, ...safe } = u;
      return safe;
    });
};

// ============ COUNT & STATS ============

const getUserCount = () => Object.keys(users).length;

const getActiveUserCount = () => 
  Object.values(users).filter(u => u.active).length;

// ============ PERMISSION CHECKS ============

const isAdmin = (userId) => {
  const user = users[userId];
  return user && user.role === 'admin';
};

// ============ ERROR HANDLING ============

const causeServerError = () => {
  throw new Error('Intentional server error');
};

module.exports = {
  getAllUsers, getUserById, createUser, updateUser, deleteUser,
  loginUser, verifyToken,
  createMultipleUsers,
  searchUsers,
  getUserCount, getActiveUserCount,
  isAdmin,
  causeServerError,
  users
};

