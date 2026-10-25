/**
 * Module 12: Snapshot Testing - Controller
 * API endpoints for snapshot testing
 */

const users = {
  1: {
    id: 1,
    name: 'Alice',
    email: 'alice@test.com',
    role: 'admin',
    active: true,
    createdAt: '2024-01-01T00:00:00Z'
  },
  2: {
    id: 2,
    name: 'Bob',
    email: 'bob@test.com',
    role: 'user',
    active: true,
    createdAt: '2024-01-02T00:00:00Z'
  }
};

const getUser = (id) => users[id] || null;
const getAllUsers = () => Object.values(users);
const getUsersWithMetadata = () => ({
  users: Object.values(users),
  count: Object.keys(users).length,
  generatedAt: new Date().toISOString()
});

const createUser = (data) => {
  const id = Math.max(...Object.keys(users).map(Number)) + 1;
  const user = {
    id,
    name: data.name,
    email: data.email,
    role: 'user',
    active: true,
    createdAt: new Date().toISOString()
  };
  users[id] = user;
  return user;
};

const getApiVersion = () => ({ version: '1.0.0', status: 'stable' });

module.exports = {
  getUser,
  getAllUsers,
  getUsersWithMetadata,
  createUser,
  getApiVersion
};

