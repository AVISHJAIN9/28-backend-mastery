// ssh keys config tunneling - Controller

// Get module info
const getInfo = (req, res) => {
  res.json({
    module: 'ssh keys config tunneling',
    description: 'Learn about ssh keys config tunneling',
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