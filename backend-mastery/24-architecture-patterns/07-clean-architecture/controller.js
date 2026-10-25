// ==================== Clean Architecture - Use Case Pattern ====================
// Organized by Entities -> Use Cases -> Interface Adapters -> Frameworks

let users = [];
let nextId = 1;

// ==================== Entities (Core Business Logic) ====================

class User {
  constructor(id, name, email, role, status) {
    this.id = id;
    this.name = name;
    this.email = email;
    this.role = role;
    this.status = status;
    this.createdAt = new Date();
  }

  isActive() {
    return this.status === 'active';
  }

  canBeDeleted() {
    return this.role !== 'admin' || users.filter(u => u.role === 'admin').length > 1;
  }
}

// ==================== Use Cases ====================

const CreateUserUseCase = {
  execute: (userData) => {
    if (!userData.name || !userData.email) {
      throw new Error('Name and email required');
    }

    if (users.some(u => u.email === userData.email)) {
      throw new Error('Email already exists');
    }

    const user = new User(
      nextId++,
      userData.name,
      userData.email,
      userData.role || 'user',
      'active'
    );

    users.push(user);
    console.log('[Use Case] Create User executed');
    return user;
  }
};

const GetUserUseCase = {
  execute: (id) => {
    const user = users.find(u => u.id === id);
    if (!user) throw new Error('User not found');
    return user;
  }
};

const GetAllUsersUseCase = {
  execute: () => {
    return users.map(u => ({
      id: u.id,
      name: u.name,
      email: u.email,
      role: u.role,
      status: u.status,
      isActive: u.isActive()
    }));
  }
};

const UpdateUserUseCase = {
  execute: (id, updates) => {
    const user = users.find(u => u.id === id);
    if (!user) throw new Error('User not found');

    if (updates.name) user.name = updates.name;
    if (updates.email && updates.email !== user.email) {
      if (users.some(u => u.email === updates.email)) {
        throw new Error('Email already exists');
      }
      user.email = updates.email;
    }
    if (updates.status) user.status = updates.status;
    if (updates.role) user.role = updates.role;

    console.log('[Use Case] Update User executed');
    return user;
  }
};

const DeleteUserUseCase = {
  execute: (id) => {
    const user = users.find(u => u.id === id);
    if (!user) throw new Error('User not found');
    if (!user.canBeDeleted()) {
      throw new Error('Cannot delete last admin');
    }

    users = users.filter(u => u.id !== id);
    console.log('[Use Case] Delete User executed');
    return true;
  }
};

// ==================== Exports ====================

module.exports = {
  User,
  CreateUserUseCase,
  GetUserUseCase,
  GetAllUsersUseCase,
  UpdateUserUseCase,
  DeleteUserUseCase,
  _resetData: () => {
    users = [];
    nextId = 1;
  }
};

