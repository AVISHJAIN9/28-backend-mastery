// base64 encoding not encryption - Controller

// Get module info
const getInfo = (req, res) => {
  res.json({
    module: 'base64 encoding not encryption',
    description: 'Learn about base64 encoding not encryption',
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