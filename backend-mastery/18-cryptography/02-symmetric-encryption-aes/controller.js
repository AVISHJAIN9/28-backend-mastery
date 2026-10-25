// symmetric encryption aes - Controller

// Get module info
const getInfo = (req, res) => {
  res.json({
    module: 'symmetric encryption aes',
    description: 'Learn about symmetric encryption aes',
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