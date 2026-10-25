/**
 * Module 11: Load Testing - Controller
 */

const users = {};
let nextId = 1;

const createUser = (name, email) => {
  const user = { id: nextId++, name, email, createdAt: new Date() };
  users[user.id] = user;
  return user;
};

const getUser = (id) => {
  if (!users[id]) throw new Error('User not found');
  return users[id];
};

const getAllUsers = () => Object.values(users);

const updateUser = (id, data) => {
  if (!users[id]) throw new Error('User not found');
  users[id] = { ...users[id], ...data };
  return users[id];
};

const deleteUser = (id) => {
  delete users[id];
  return { deleted: true };
};

const getUserCount = () => Object.keys(users).length;

module.exports = {
  createUser, getUser, getAllUsers, updateUser, deleteUser, getUserCount
};

