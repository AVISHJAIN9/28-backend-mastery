// salting rainbow table prevention - Controller

// Get module info
const getInfo = (req, res) => {
  res.json({
    module: 'salting rainbow table prevention',
    description: 'Learn about salting rainbow table prevention',
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