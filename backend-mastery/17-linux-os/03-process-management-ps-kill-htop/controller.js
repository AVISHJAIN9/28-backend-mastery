// process management ps kill htop - Controller

// Get module info
const getInfo = (req, res) => {
  res.json({
    module: 'process management ps kill htop',
    description: 'Learn about process management ps kill htop',
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