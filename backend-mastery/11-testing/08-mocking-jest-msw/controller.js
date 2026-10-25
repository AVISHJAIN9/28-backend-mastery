/**
 * Module 08: MSW Mocking - Controller
 */

const mockUsers = {
  1: { id: 1, name: 'Alice', email: 'alice@test.com' },
  2: { id: 2, name: 'Bob', email: 'bob@test.com' }
};

const getUser = (id) => mockUsers[id] || null;
const getAllUsers = () => Object.values(mockUsers);
const createUser = (data) => {
  const id = Math.max(...Object.keys(mockUsers).map(Number)) + 1;
  mockUsers[id] = { id, ...data };
  return mockUsers[id];
};
const deleteUser = (id) => {
  delete mockUsers[id];
  return { deleted: true };
};

module.exports = { getUser, getAllUsers, createUser, deleteUser };

