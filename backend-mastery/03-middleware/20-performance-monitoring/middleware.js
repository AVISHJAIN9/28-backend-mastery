const performanceMiddleware = (req, res, next) => {
  const startTime = process.hrtime.bigint();
  const startMemory = process.memoryUsage();

  res.on('finish', () => {
    const endTime = process.hrtime.bigint();
    const endMemory = process.memoryUsage();
    
    const duration = Number(endTime - startTime) / 1000000;
    
    const perfData = {
      timestamp: new Date().toISOString(),
      method: req.method,
      path: req.path,
      status: res.statusCode,
      duration: duration.toFixed(2) + 'ms',
      memoryUsed: ((endMemory.heapUsed - startMemory.heapUsed) / 1024 / 1024).toFixed(2) + 'MB'
    };

    if (duration > 100) {
      console.warn('[SLOW REQUEST]', perfData);
    }
  });

  next();
};

module.exports = { performanceMiddleware };
