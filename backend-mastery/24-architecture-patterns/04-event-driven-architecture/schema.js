// ==================== Validation Schemas ====================

const validateUserSchema = (data) => {
  const errors = [];
  
  // Name validation
  if (!data.name) {
    errors.push({
      path: ['name'],
      message: 'Name is required'
    });
  } else if (typeof data.name !== 'string' || data.name.length < 2) {
    errors.push({
      path: ['name'],
      message: 'Name must be at least 2 characters'
    });
  } else if (data.name.length > 100) {
    errors.push({
      path: ['name'],
      message: 'Name must not exceed 100 characters'
    });
  }
  
  // Email validation
  if (!data.email) {
    errors.push({
      path: ['email'],
      message: 'Email is required'
    });
  } else if (!/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(data.email)) {
    errors.push({
      path: ['email'],
      message: 'Email must be valid'
    });
  }
  
  // Role validation
  if (data.role && !['user', 'admin', 'moderator'].includes(data.role)) {
    errors.push({
      path: ['role'],
      message: 'Role must be one of: user, admin, moderator'
    });
  }
  
  // Status validation
  if (data.status && !['active', 'inactive', 'suspended'].includes(data.status)) {
    errors.push({
      path: ['status'],
      message: 'Status must be one of: active, inactive, suspended'
    });
  }
  
  return {
    error: errors.length > 0 ? { details: errors } : null,
    value: {
      name: data.name,
      email: data.email,
      role: data.role || 'user',
      status: data.status || 'active'
    }
  };
};

// ==================== Exports ====================

module.exports = {
  validateUserSchema
};

