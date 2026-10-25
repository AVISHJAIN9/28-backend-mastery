// hmac message authentication - Controller

// Get module info
const getInfo = (req, res) => {
  res.json({
    module: 'hmac message authentication',
    description: 'Learn about hmac message authentication',
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