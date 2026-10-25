/**
 * TypeScript Types vs Interfaces Controller
 * Demonstrates practical use of both in a service layer
 */

// ==================== Type Definitions ====================

// Type: Union for possible statuses
// type UserStatus = 'active' | 'inactive' | 'suspended';
// type UserRole = 'admin' | 'user' | 'moderator';

// Type: Generic API response wrapper
// type ApiResponse<T, E = any> = {
//   success: true,
//   data: T
// } | {
//   success: false,
//   error: E
// };

// Type: User payload from request
// type CreateUserPayload = {
//   name: string;
//   email: string;
//   role: UserRole;
//   age?: number;
// };

// ==================== Interface Definitions ====================

// Base entity interface (shared by all entities)
// interface Entity {
//   id: number;
//   createdAt: Date;
//   updatedAt: Date;
// }

// User entity
// interface User extends Entity {
//   name: string;
//   email: string;
//   role: 'admin' | 'user' | 'moderator';
//   isActive: boolean;
// }

// Admin extends User with extra permissions
// interface Admin extends User {
//   permissions: string[];
//   department: string;
// }

// ==================== Service Implementation ====================

class UserController {
  constructor() {
    this.users = new Map();
    this.idCounter = 1;
  }

  /**
   * Create a new user
   */
  async createUser(payload) {
    try {
      if (!payload.name || !payload.email || !payload.role) {
        return {
          success: false,
          error: { message: 'Missing required fields', code: 'VALIDATION_ERROR' }
        };
      }

      const user = {
        id: this.idCounter++,
        name: payload.name,
        email: payload.email,
        role: payload.role,
        isActive: true,
        createdAt: new Date(),
        updatedAt: new Date()
      };

      this.users.set(user.id, user);

      return {
        success: true,
        data: user
      };
    } catch (error) {
      return {
        success: false,
        error: { message: error.message, code: 'CREATE_ERROR' }
      };
    }
  }

  /**
   * Get user by ID
   */
  async getUser(userId) {
    try {
      const user = this.users.get(userId);

      if (!user) {
        return {
          success: false,
          error: { message: 'User not found', code: 'NOT_FOUND' }
        };
      }

      return {
        success: true,
        data: user
      };
    } catch (error) {
      return {
        success: false,
        error: { message: error.message, code: 'GET_ERROR' }
      };
    }
  }

  /**
   * Get all users
   */
  async getAllUsers() {
    try {
      const users = Array.from(this.users.values());
      return {
        success: true,
        data: users
      };
    } catch (error) {
      return {
        success: false,
        error: { message: error.message, code: 'LIST_ERROR' }
      };
    }
  }

  /**
   * Update user
   */
  async updateUser(userId, updates) {
    try {
      const user = this.users.get(userId);

      if (!user) {
        return {
          success: false,
          error: { message: 'User not found', code: 'NOT_FOUND' }
        };
      }

      if (updates.name) user.name = updates.name;
      if (updates.email) user.email = updates.email;
      if (updates.role) user.role = updates.role;
      user.updatedAt = new Date();

      this.users.set(userId, user);

      return {
        success: true,
        data: user
      };
    } catch (error) {
      return {
        success: false,
        error: { message: error.message, code: 'UPDATE_ERROR' }
      };
    }
  }

  /**
   * Delete user
   */
  async deleteUser(userId) {
    try {
      if (!this.users.has(userId)) {
        return {
          success: false,
          error: { message: 'User not found', code: 'NOT_FOUND' }
        };
      }

      this.users.delete(userId);

      return {
        success: true,
        data: { deleted: true }
      };
    } catch (error) {
      return {
        success: false,
        error: { message: error.message, code: 'DELETE_ERROR' }
      };
    }
  }

  /**
   * Filter users by role
   */
  async getUsersByRole(role) {
    try {
      const filtered = Array.from(this.users.values())
        .filter(user => user.role === role);

      return {
        success: true,
        data: filtered
      };
    } catch (error) {
      return {
        success: false,
        error: { message: error.message, code: 'FILTER_ERROR' }
      };
    }
  }

  /**
   * Promote user to admin
   */
  async promoteToAdmin(userId, permissions, department) {
    try {
      const user = this.users.get(userId);

      if (!user) {
        return {
          success: false,
          error: { message: 'User not found', code: 'NOT_FOUND' }
        };
      }

      const admin = {
        ...user,
        role: 'admin',
        permissions: permissions || [],
        department: department || 'Unknown'
      };

      this.users.set(userId, admin);

      return {
        success: true,
        data: admin
      };
    } catch (error) {
      return {
        success: false,
        error: { message: error.message, code: 'PROMOTE_ERROR' }
      };
    }
  }

  /**
   * Batch create users
   */
  async batchCreateUsers(payloads) {
    try {
      const results = [];

      for (const payload of payloads) {
        const response = await this.createUser(payload);
        results.push(response);
      }

      const successful = results.filter(r => r.success).length;
      const failed = results.filter(r => !r.success).length;

      return {
        success: true,
        data: {
          total: results.length,
          successful,
          failed,
          results
        }
      };
    } catch (error) {
      return {
        success: false,
        error: { message: error.message, code: 'BATCH_ERROR' }
      };
    }
  }

  /**
   * Get validator schema (simulating Type usage)
   */
  getValidationSchema() {
    return {
      user: {
        required: ['name', 'email', 'role'],
        properties: {
          name: { type: 'string', minLength: 1 },
          email: { type: 'string', format: 'email' },
          role: { enum: ['admin', 'user', 'moderator'] },
          age: { type: 'number', optional: true }
        }
      },
      admin: {
        required: ['permissions', 'department'],
        properties: {
          permissions: { type: 'array', items: 'string' },
          department: { type: 'string' }
        }
      }
    };
  }
}

module.exports = UserController;

