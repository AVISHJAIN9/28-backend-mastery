// ==================== Validation Schemas ====================

const validateUserSchema = (data) => {
  const errors = [];
  
  if (!data.name && !data.username) {
    errors.push({ path: ['name'], message: 'Name is required' });
  }
  
  const name = data.name || data.username;
  if (name && (typeof name !== 'string' || name.length < 2)) {
    errors.push({ path: ['name'], message: 'Name must be at least 2 characters' });
  }
  
  if (!data.email && !data.mail) {
    errors.push({ path: ['email'], message: 'Email is required' });
  }
  
  const email = data.email || data.mail;
  if (email && !/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email)) {
    errors.push({ path: ['email'], message: 'Email must be valid' });
  }
  
  if (data.role && !['user', 'admin', 'moderator'].includes(data.role)) {
    errors.push({ path: ['role'], message: 'Role must be one of: user, admin, moderator' });
  }
  
  return {
    error: errors.length > 0 ? { details: errors } : null,
    value: {
      name: name || '',
      email: email || '',
      role: data.role || 'user',
      status: data.status || 'active'
    }
  };
};

module.exports = { validateUserSchema };

