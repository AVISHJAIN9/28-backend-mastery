// ==================== Event Emitter & Event Store ====================

const EventEmitter = require('events');
const eventEmitter = new EventEmitter();

// Simple event log for event sourcing
let eventLog = [];
let users = [];
let nextId = 1;

// ==================== Event Handlers ====================

eventEmitter.on('user:created', (userData) => {
  const newUser = {
    id: nextId++,
    name: userData.name,
    email: userData.email,
    role: userData.role || 'user',
    status: 'active',
    createdAt: new Date()
  };
  users.push(newUser);
  console.log(`[Event] User created: ${newUser.id} - ${newUser.name}`);
});

eventEmitter.on('user:updated', (id, updates) => {
  const user = users.find(u => u.id === id);
  if (user) {
    Object.assign(user, updates, { updatedAt: new Date() });
    console.log(`[Event] User updated: ${id}`);
  }
});

eventEmitter.on('user:deleted', (id) => {
  const index = users.findIndex(u => u.id === id);
  if (index !== -1) {
    users.splice(index, 1);
    console.log(`[Event] User deleted: ${id}`);
  }
});

eventEmitter.on('user:statusChanged', (id, newStatus) => {
  const user = users.find(u => u.id === id);
  if (user) {
    user.status = newStatus;
    console.log(`[Event] User status changed: ${id} -> ${newStatus}`);
  }
});

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
 * Create new user (emits event)
 */
const createUser = (userData) => {
  if (!userData.name || !userData.email) {
    throw new Error('Name and email are required');
  }

  if (users.some(u => u.email === userData.email)) {
    throw new Error('Email already exists');
  }

  eventLog.push({
    type: 'user:created',
    data: userData,
    timestamp: new Date()
  });

  eventEmitter.emit('user:created', userData);
  
  return users[users.length - 1];
};

/**
 * Update user (emits event)
 */
const updateUser = (id, userData) => {
  const user = users.find(u => u.id === id);
  if (!user) return null;

  if (userData.email && userData.email !== user.email) {
    if (users.some(u => u.email === userData.email)) {
      throw new Error('Email already exists');
    }
  }

  eventLog.push({
    type: 'user:updated',
    userId: id,
    data: userData,
    timestamp: new Date()
  });

  eventEmitter.emit('user:updated', id, userData);
  
  return users.find(u => u.id === id);
};

/**
 * Delete user (emits event)
 */
const deleteUser = (id) => {
  const user = users.find(u => u.id === id);
  if (!user) return false;

  eventLog.push({
    type: 'user:deleted',
    userId: id,
    timestamp: new Date()
  });

  eventEmitter.emit('user:deleted', id);
  return true;
};

/**
 * Change user status
 */
const changeUserStatus = (id, newStatus) => {
  const user = users.find(u => u.id === id);
  if (!user) return false;

  eventLog.push({
    type: 'user:statusChanged',
    userId: id,
    newStatus,
    timestamp: new Date()
  });

  eventEmitter.emit('user:statusChanged', id, newStatus);
  return true;
};

/**
 * Get event log
 */
const getEventLog = () => {
  return eventLog;
};

// ==================== Exports ====================

module.exports = {
  getAllUsers,
  getUserById,
  createUser,
  updateUser,
  deleteUser,
  changeUserStatus,
  getEventLog,
  eventEmitter,
  _resetData: () => {
    users = [];
    eventLog = [];
    nextId = 1;
  }
};

