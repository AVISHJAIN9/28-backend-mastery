/**
 * Module 09: Contract Testing - Controller
 */

class UserService {
  constructor() {
    this.users = {};
    this.nextId = 1;
  }

  createUser(name, email) {
    const user = { id: this.nextId++, name, email };
    this.users[user.id] = user;
    return user;
  }

  getUser(id) {
    if (!this.users[id]) throw new Error('User not found');
    return this.users[id];
  }

  getAllUsers() {
    return Object.values(this.users);
  }

  updateUser(id, name, email) {
    if (!this.users[id]) throw new Error('User not found');
    this.users[id] = { ...this.users[id], name, email };
    return this.users[id];
  }

  deleteUser(id) {
    delete this.users[id];
    return { deleted: true };
  }
}

module.exports = UserService;

