/**
 * Module 13.4 Controller: Utility Types Patterns
 */

class UserService {
  constructor() {
    this.users = [];
  }

  // Create user (uses Omit pattern - exclude id, createdAt)
  createUser(data) {
    return {
      id: Math.random(),
      ...data,
      createdAt: new Date()
    };
  }

  // Get user (full record)
  getUser(id) {
    return this.users.find(u => u.id === id);
  }

  // Get public view (Pick pattern - only safe fields)
  getPublicUser(id) {
    const user = this.users.find(u => u.id === id);
    if (!user) return null;
    return {
      id: user.id,
      name: user.name,
      role: user.role
    };
  }

  // Update partial fields (Partial pattern)
  updateUser(id, updates) {
    const user = this.users.find(u => u.id === id);
    if (!user) return null;
    return Object.assign(user, updates);
  }

  // Create DTO (Pick specific fields)
  userToDTO(user) {
    return {
      id: user.id,
      name: user.name,
      email: user.email
    };
  }

  // Create API response (Omit sensitive fields)
  userToResponse(user) {
    const { password, ...rest } = user;
    return rest;
  }
}

class PermissionService {
  constructor() {
    // Record pattern: Map roles to permissions
    this.rolePermissions = {
      admin: ['read', 'write', 'delete', 'manage_users', 'manage_roles'],
      moderator: ['read', 'write', 'moderate'],
      user: ['read', 'write'],
      guest: ['read']
    };
  }

  // Check permission using Record
  hasPermission(role, action) {
    const permissions = this.rolePermissions[role];
    return permissions ? permissions.includes(action) : false;
  }

  // Get all permissions for role
  getPermissions(role) {
    return this.rolePermissions[role] || [];
  }

  // Add permission to role
  addPermission(role, action) {
    if (!this.rolePermissions[role]) {
      this.rolePermissions[role] = [];
    }
    this.rolePermissions[role].push(action);
  }

  // Readonly fields - demonstrate immutability pattern
  getImmutablePermissions(role) {
    return Object.freeze([...(this.rolePermissions[role] || [])]);
  }
}

class ConfigService {
  constructor() {
    // Record pattern for feature flags
    this.featureFlags = {
      newUI: true,
      betaAPI: false,
      darkMode: true,
      notifications: true,
      socialSharing: false
    };
  }

  // Get flag value
  isEnabled(flag) {
    return this.featureFlags[flag] || false;
  }

  // Toggle flag
  toggleFlag(flag) {
    if (flag in this.featureFlags) {
      this.featureFlags[flag] = !this.featureFlags[flag];
      return this.featureFlags[flag];
    }
    return null;
  }

  // Get all flags
  getAllFlags() {
    return { ...this.featureFlags };
  }
}

class DTOTransformer {
  // Pick pattern - extract subset of fields
  static pickFields(obj, ...keys) {
    const result = {};
    keys.forEach(key => {
      if (key in obj) {
        result[key] = obj[key];
      }
    });
    return result;
  }

  // Omit pattern - exclude specific fields
  static omitFields(obj, ...keys) {
    const result = { ...obj };
    keys.forEach(key => delete result[key]);
    return result;
  }

  // Partial pattern - make all fields optional
  static toPartial(obj) {
    const result = {};
    for (const [key, value] of Object.entries(obj)) {
      result[key] = value || undefined;
    }
    return result;
  }

  // Required pattern - ensure all fields present
  static makeRequired(obj, requiredFields) {
    const missing = requiredFields.filter(f => !(f in obj) || obj[f] === undefined);
    if (missing.length > 0) {
      throw new Error('Missing required fields: ' + missing.join(', '));
    }
    return obj;
  }
}

export { UserService, PermissionService, ConfigService, DTOTransformer };
