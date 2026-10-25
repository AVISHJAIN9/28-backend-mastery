/**
 * Module 13.6 Controller: Declaration Merging & Augmentation Patterns
 */

class AuthService {
  constructor() {
    this.users = [
      { id: 1, name: 'Alice', email: 'alice@test.com', role: 'admin' },
      { id: 2, name: 'Bob', email: 'bob@test.com', role: 'user' }
    ];
  }

  authenticate(authHeader) {
    if (!authHeader) return null;
    const userId = parseInt(authHeader.split(' ')[1]) || 1;
    return this.users.find(u => u.id === userId);
  }

  authorize(user, requiredRole) {
    if (!user) return false;
    if (requiredRole === 'admin') return user.role === 'admin';
    if (requiredRole === 'user') return user.role === 'user' || user.role === 'admin';
    return false;
  }

  getUser(id) {
    return this.users.find(u => u.id === id);
  }
}

class ContextService {
  // Create request context
  createContext(req) {
    return {
      requestId: 'req_' + Date.now() + '_' + Math.random(),
      startTime: Date.now(),
      method: req.method,
      path: req.path,
      ip: req.ip,
      userAgent: req.get('user-agent')
    };
  }

  // Augment context with user info
  enrichContext(context, user) {
    return {
      ...context,
      userId: user ? user.id : null,
      userRole: user ? user.role : null,
      userName: user ? user.name : null
    };
  }

  // Calculate request duration
  getDuration(context) {
    return Date.now() - context.startTime;
  }
}

class ValidationService {
  // Validate user input
  validateUserInput(data) {
    const errors = {};

    if (!data.name) errors.name = 'Name is required';
    if (!data.email) errors.email = 'Email is required';
    if (data.email && !data.email.includes('@')) {
      errors.email = 'Invalid email';
    }

    if (Object.keys(errors).length > 0) {
      return { valid: false, errors };
    }

    return { valid: true, data };
  }

  validateRole(role) {
    const validRoles = ['admin', 'user', 'moderator'];
    return validRoles.includes(role);
  }
}

class ResponseBuilder {
  // Build success response
  success(data, message = null) {
    return {
      ok: true,
      data,
      message,
      timestamp: Date.now()
    };
  }

  // Build error response
  error(message, code = 'ERROR') {
    return {
      ok: false,
      error: { message, code },
      timestamp: Date.now()
    };
  }

  // Build paginated response
  paginated(items, total, page = 1, pageSize = 10) {
    return {
      ok: true,
      data: {
        items,
        total,
        page,
        pageSize,
        pages: Math.ceil(total / pageSize),
        hasMore: (page * pageSize) < total
      },
      timestamp: Date.now()
    };
  }
}

class MultiTenantContext {
  // Simulate multi-tenant augmentation
  createTenantContext(tenantId) {
    return {
      tenantId,
      dbConnection: 'db_' + tenantId,
      cache: 'cache_' + tenantId,
      permissions: this.getTenantPermissions(tenantId)
    };
  }

  getTenantPermissions(tenantId) {
    // Different permissions per tenant
    const permissions = {
      tenant1: { features: ['basic', 'advanced'] },
      tenant2: { features: ['basic'] },
      tenant3: { features: ['basic', 'advanced', 'premium'] }
    };
    return permissions['tenant' + tenantId] || { features: ['basic'] };
  }
}

export { AuthService, ContextService, ValidationService, ResponseBuilder, MultiTenantContext };
