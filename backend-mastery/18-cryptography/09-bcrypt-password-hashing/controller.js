// bcrypt password hashing - Controller

// Get module info
const getInfo = (req, res) => {
  res.json({
    module: 'bcrypt password hashing',
    description: 'Learn about bcrypt password hashing',
    endpoints: {
      '/api/info': 'Module information',
      '/api/test': 'Test endpoint'
    },
    documentation: '/theory.md'
  });
};

// Test endpoint
const getTest = (req, res) => {
  res.json({
    status: 'ok',
    message: 'Test endpoint working',
    timestamp: new Date().toISOString()
  });
};

module.exports = {
  getInfo,
  getTest
};