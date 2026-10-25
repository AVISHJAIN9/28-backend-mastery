// Custom middleware for HTTP versions module

// Log HTTP version used by client
const logHttpVersion = (req, res, next) => {
  const httpVersion = req.httpVersion;
  const protocol = req.get('x-forwarded-proto') || 'http';
  
  console.log(`[${new Date().toISOString()}] HTTP/${httpVersion} ${req.method} ${req.path}`);
  
  // Add info to response header
  res.set('X-HTTP-Version', `HTTP/${httpVersion}`);
  
  next();
};

// Add timing middleware
const addTiming = (req, res, next) => {
  const startTime = Date.now();
  
  res.on('finish', () => {
    const duration = Date.now() - startTime;
    console.log(`Response time: ${duration}ms`);
    res.set('X-Response-Time', `${duration}ms`);
  });
  
  next();
};

// Simulate different protocols
const simulateProtocol = (req, res, next) => {
  const protocol = req.query.protocol || 'HTTP/1.1';
  req.simulatedProtocol = protocol;
  next();
};

module.exports = {
  logHttpVersion,
  addTiming,
  simulateProtocol
};

