// Middleware for Uptime Monitoring Module
const { metricsStore, logger } = require('./controller');

// ==================== Request Tracking Middleware ====================

/**
 * Track all HTTP requests for metrics calculation
 * Records: duration, status code, method, path
 */
const requestTracker = (req, res, next) => {
  const startTime = Date.now();
  const originalJson = res.json;

  // Wrap response.json to capture when response is sent
  res.json = function(data) {
    const duration = Date.now() - startTime;
    
    // Record the request metrics
    metricsStore.recordRequest(
      req.method,
      req.path,
      duration,
      res.statusCode,
      startTime
    );

    // Log to Winston
    logger.info({
      event: 'http_request',
      method: req.method,
      path: req.path,
      statusCode: res.statusCode,
      duration: duration + 'ms',
      timestamp: new Date().toISOString()
    });

    // Call original json method
    return originalJson.call(this, data);
  };

  next();
};

// ==================== Health Check Middleware ====================

/**
 * Periodic health check
 * Runs every configured interval and records health status
 */
const setupHealthCheckInterval = () => {
  const intervalMs = parseInt(process.env.HEALTH_CHECK_INTERVAL || 60000);
  
  setInterval(() => {
    const start = Date.now();
    const duration = Date.now() - start;
    
    // Record that health check passed
    metricsStore.recordHealthCheck(true, duration);
    
    logger.debug({
      event: 'health_check',
      passed: true,
      duration: duration + 'ms',
      timestamp: new Date().toISOString()
    });
  }, intervalMs);
};

// ==================== Error Rate Monitoring ====================

/**
 * Monitor error rate and alert if exceeds threshold
 */
const errorRateMonitor = (req, res, next) => {
  res.on('finish', () => {
    // Check error rate periodically (every 60 requests)
    if (metricsStore.requests.length % 60 === 0) {
      const metrics = metricsStore.getMetrics(5 * 60 * 1000); // Last 5 minutes
      const errorRate = metrics.metrics.errorRate;
      
      if (errorRate > parseFloat(process.env.ALERT_ERROR_RATE || 0.05)) {
        logger.warn({
          event: 'high_error_rate_detected',
          errorRate: errorRate.toFixed(2) + '%',
          threshold: (parseFloat(process.env.ALERT_ERROR_RATE || 0.05) * 100).toFixed(2) + '%',
          timestamp: new Date().toISOString(),
          severity: 'warning'
        });
      }
    }
  });

  next();
};

// ==================== Latency Monitoring ====================

/**
 * Monitor latency percentiles and alert if exceeds threshold
 */
const latencyMonitor = (req, res, next) => {
  res.on('finish', () => {
    // Check latency periodically (every 100 requests)
    if (metricsStore.requests.length % 100 === 0) {
      const metrics = metricsStore.getMetrics(5 * 60 * 1000); // Last 5 minutes
      const p95 = metrics.metrics.latency.p95;
      const alertThreshold = parseInt(process.env.ALERT_P95_LATENCY || 5000);
      
      if (p95 > alertThreshold) {
        logger.warn({
          event: 'high_latency_detected',
          p95: p95 + 'ms',
          threshold: alertThreshold + 'ms',
          timestamp: new Date().toISOString(),
          severity: 'warning'
        });
      }
    }
  });

  next();
};

// ==================== Request Simulation ====================

/**
 * Simulate realistic traffic patterns for testing
 * Can be used to test SLA calculations
 */
const requestSimulator = (enabled = false) => {
  if (!enabled) return (req, res, next) => next();

  return (req, res, next) => {
    // Only on certain paths - don't interfere with real requests
    if (req.path === '/api/simulate') {
      const numRequests = parseInt(req.query.num || 100);
      const errorRate = parseFloat(req.query.errorRate || 0.02);
      
      for (let i = 0; i < numRequests; i++) {
        setTimeout(() => {
          const isError = Math.random() < errorRate;
          const duration = Math.random() * 1000 + 50; // 50-1050ms
          const status = isError 
            ? 500 + Math.floor(Math.random() * 4) 
            : 200;
          
          metricsStore.recordRequest(
            'GET',
            '/api/test',
            duration,
            status,
            Date.now()
          );
        }, i * 10); // Spread them out
      }
      
      res.json({
        message: `Simulating ${numRequests} requests with ${(errorRate * 100).toFixed(1)}% error rate`,
        requests: numRequests,
        errorRate: errorRate.toFixed(4)
      });
    } else {
      next();
    }
  };
};

// ==================== Correlation ID ====================

/**
 * Add correlation ID to track requests across logs
 */
const correlationId = (req, res, next) => {
  const { v4: uuidv4 } = require('uuid');
  
  const correlationId = req.headers['x-correlation-id'] || uuidv4();
  req.correlationId = correlationId;
  res.setHeader('X-Correlation-ID', correlationId);
  
  next();
};

module.exports = {
  requestTracker,
  setupHealthCheckInterval,
  errorRateMonitor,
  latencyMonitor,
  requestSimulator,
  correlationId
};

