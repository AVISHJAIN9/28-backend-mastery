const validateUserSchema = (data) => {
  const errors = [];
  if (!data.name || data.name.length < 2) errors.push({ path: ['name'], message: 'Name required (min 2 chars)' });
  if (!data.email || !/^[^@]+@[^@]+\.[^@]+$/.test(data.email)) errors.push({ path: ['email'], message: 'Valid email required' });
  return { error: errors.length > 0 ? { details: errors } : null, value: data };
};

const validateOrderSchema = (data) => {
  const errors = [];
  if (!data.userId || data.userId <= 0) errors.push({ path: ['userId'], message: 'Valid userId required' });
  if (!Array.isArray(data.items) || data.items.length === 0) errors.push({ path: ['items'], message: 'Items array required' });
  return { error: errors.length > 0 ? { details: errors } : null, value: data };
};

const validateProductSchema = (data) => {
  const errors = [];
  if (!data.name || data.name.length < 2) errors.push({ path: ['name'], message: 'Product name required' });
  if (!data.price || data.price <= 0) errors.push({ path: ['price'], message: 'Valid price required' });
  return { error: errors.length > 0 ? { details: errors } : null, value: data };
};

module.exports = { validateUserSchema, validateOrderSchema, validateProductSchema };
