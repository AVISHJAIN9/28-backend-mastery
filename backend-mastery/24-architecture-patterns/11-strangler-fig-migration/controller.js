// ==================== Strangler Fig Pattern ====================
// Gradual migration from legacy to new system

let users = [];
let nextId = 1;

// ==================== LEGACY SYSTEM (Old Monolith) ====================

const LegacyUserService = {
  getAllUsers: () => {
    console.log('[LEGACY] Fetching users');
    return users.map(u => ({
      uid: u.id,
      username: u.name,
      mail: u.email
    }));
  },
  
  createUser: (legacyData) => {
    console.log('[LEGACY] Creating user');
    const user = {
      id: nextId++,
      name: legacyData.username,
      email: legacyData.mail,
      role: 'user',
      status: 'active',
      createdAt: new Date(),
      system: 'legacy'
    };
    users.push(user);
    return user;
  }
};

// ==================== NEW SYSTEM (Modern Microservice) ====================

const ModernUserService = {
  getAllUsers: () => {
    console.log('[MODERN] Fetching users');
    return users.map(u => ({
      id: u.id,
      name: u.name,
      email: u.email,
      role: u.role,
      status: u.status,
      metadata: { system: 'modern', version: '2.0' }
    }));
  },
  
  getUserById: (id) => {
    const user = users.find(u => u.id === id);
    return user ? { ...user, system: 'modern' } : null;
  },
  
  createUser: (modernData) => {
    console.log('[MODERN] Creating user');
    if (!modernData.name || !modernData.email) {
      throw new Error('Name and email required');
    }
    const user = {
      id: nextId++,
      name: modernData.name,
      email: modernData.email,
      role: modernData.role || 'user',
      status: 'active',
      createdAt: new Date(),
      system: 'modern'
    };
    users.push(user);
    return user;
  },
  
  updateUser: (id, data) => {
    const user = users.find(u => u.id === id);
    if (!user) return null;
    Object.assign(user, data);
    return user;
  },
  
  deleteUser: (id) => {
    const index = users.findIndex(u => u.id === id);
    return index !== -1 ? users.splice(index, 1)[0] : null;
  }
};

// ==================== STRANGLER FACADE ====================

const StranglerFacade = {
  getAllUsers: (useLegacy = false) => {
    if (useLegacy) {
      console.log('[Strangler] Routing to LEGACY system');
      return LegacyUserService.getAllUsers();
    } else {
      console.log('[Strangler] Routing to MODERN system');
      return ModernUserService.getAllUsers();
    }
  },
  
  getUserById: (id) => {
    console.log('[Strangler] Routing to MODERN system');
    return ModernUserService.getUserById(id);
  },
  
  createUser: (data, useLegacy = false) => {
    if (useLegacy) {
      console.log('[Strangler] Creating via LEGACY system');
      return LegacyUserService.createUser(data);
    } else {
      console.log('[Strangler] Creating via MODERN system');
      return ModernUserService.createUser(data);
    }
  },
  
  updateUser: (id, data) => {
    console.log('[Strangler] Updating via MODERN system');
    return ModernUserService.updateUser(id, data);
  },
  
  deleteUser: (id) => {
    console.log('[Strangler] Deleting via MODERN system');
    return ModernUserService.deleteUser(id);
  }
};

// ==================== Exports ====================

module.exports = {
  StranglerFacade,
  LegacyUserService,
  ModernUserService,
  _resetData: () => {
    users = [];
    nextId = 1;
  }
};

