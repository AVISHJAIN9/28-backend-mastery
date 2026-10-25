/**
 * Module 06: E2E Tests - Controller
 * User interaction functions for E2E testing
 */

const users = {};
let nextId = 1;

// ============ AUTHENTICATION ============

const loginUser = (email, password) => {
  const user = Object.values(users).find(u => u.email === email);
  if (!user) throw new Error('User not found');
  if (user.password !== password) throw new Error('Invalid password');
  
  return {
    token: `token_${user.id}`,
    user: { id: user.id, email, name: user.name }
  };
};

const registerUser = (name, email, password) => {
  if (Object.values(users).find(u => u.email === email)) {
    throw new Error('Email already exists');
  }
  
  const user = {
    id: nextId++,
    name,
    email,
    password,
    createdAt: new Date()
  };
  
  users[user.id] = user;
  return { id: user.id, email, name };
};

const logoutUser = (token) => {
  return { loggedOut: true };
};

// ============ USER PROFILE ============

const getUserProfile = (userId) => {
  const user = users[userId];
  if (!user) throw new Error('User not found');
  const { password, ...safe } = user;
  return safe;
};

const updateProfile = (userId, data) => {
  const user = users[userId];
  if (!user) throw new Error('User not found');
  
  if (data.name) user.name = data.name;
  if (data.email) user.email = data.email;
  
  const { password, ...safe } = user;
  return safe;
};

// ============ FORM VALIDATION ============

const validateForm = (data) => {
  const errors = {};
  
  if (!data.name) errors.name = 'Name required';
  if (!data.email || !data.email.includes('@')) errors.email = 'Valid email required';
  if (!data.password || data.password.length < 8) errors.password = 'Password must be 8+ chars';
  
  return Object.keys(errors).length > 0 ? errors : null;
};

// ============ NAVIGATION ============

const getPageData = (page) => {
  const pages = {
    home: { title: 'Home', content: 'Welcome' },
    users: { title: 'Users', users: Object.values(users) },
    profile: { title: 'Profile', user: null },
    settings: { title: 'Settings', options: [] }
  };
  return pages[page] || null;
};

// ============ DATA OPERATIONS ============

const searchUsers = (query) => {
  return Object.values(users).filter(u => 
    u.name.toLowerCase().includes(query.toLowerCase()) ||
    u.email.toLowerCase().includes(query.toLowerCase())
  );
};

const deleteUserAccount = (userId, password) => {
  const user = users[userId];
  if (!user) throw new Error('User not found');
  if (user.password !== password) throw new Error('Invalid password');
  
  delete users[userId];
  return { deleted: true };
};

module.exports = {
  loginUser,
  registerUser,
  logoutUser,
  getUserProfile,
  updateProfile,
  validateForm,
  getPageData,
  searchUsers,
  deleteUserAccount,
  users
};

