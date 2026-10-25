// digital signatures sign verify - Controller

// Get module info
const getInfo = (req, res) => {
  res.json({
    module: 'digital signatures sign verify',
    description: 'Learn about digital signatures sign verify',
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