// asymmetric rsa ecc jwt rs256 - Controller

// Get module info
const getInfo = (req, res) => {
  res.json({
    module: 'asymmetric rsa ecc jwt rs256',
    description: 'Learn about asymmetric rsa ecc jwt rs256',
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