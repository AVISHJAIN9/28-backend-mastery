// log management logrotate - Controller

// Get module info
const getInfo = (req, res) => {
  res.json({
    module: 'log management logrotate',
    description: 'Learn about log management logrotate',
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