// ==================== Hexagonal Architecture - Ports & Adapters ====================
// Separates core business logic from external dependencies

let users = [];
let nextId = 1;

// ==================== Ports (Interfaces) ====================

const UserRepositoryPort = {
  save: (user) => {
    users.push(user);
    return user;
  },
  findById: (id) => users.find(u => u.id === id) || null,
  findAll: () => [...users],
  update: (id, updates) => {
    const user = users.find(u => u.id === id);
    if (user) Object.assign(user, updates);
    return user;
  },
  delete: (id) => {
    const index = users.findIndex(u => u.id === id);
    if (index !== -1) users.splice(index, 1);
  }
};

const EmailServicePort = {
  send: (to, subject, message) => {
    console.log(`[EMAIL] To: ${to}, Subject: ${subject}`);
    return true;
  }
};

// ==================== Core Business Logic ====================

class UserService {
  constructor(repository, emailService) {
    this.repository = repository;
    this.emailService = emailService;
  }

  createUser(userData) {
    if (!userData.name || !userData.email) {
      throw new Error('Name and email required');
    }

    const newUser = {
      id: nextId++,
      name: userData.name,
      email: userData.email,
      role: userData.role || 'user',
      status: 'active',
      createdAt: new Date()
    };

    this.repository.save(newUser);
    this.emailService.send(newUser.email, 'Welcome', `Welcome ${newUser.name}`);
    return newUser;
  }

  getUser(id) {
    return this.repository.findById(id);
  }

  getAllUsers() {
    return this.repository.findAll().map(user => ({
      id: user.id,
      name: user.name,
      email: user.email,
      role: user.role,
      status: user.status
    }));
  }

  updateUser(id, updates) {
    return this.repository.update(id, updates);
  }

  deleteUser(id) {
    this.repository.delete(id);
  }
}

// ==================== Instantiate with Adapters ====================

const userService = new UserService(UserRepositoryPort, EmailServicePort);

// ==================== Exports ====================

module.exports = {
  userService,
  UserService,
  UserRepositoryPort,
  EmailServicePort,
  _resetData: () => {
    users = [];
    nextId = 1;
  }
};

