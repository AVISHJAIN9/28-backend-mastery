const { validateUserSchema, validateOrderSchema, validatePaymentSchema } = require('./schema');

// ==================== Request Validation Middleware ====================

const validateUserInput = (req, res, next) => {
  const { error, value } = validateUserSchema(req.body);
  
  if (error) {
    return res.status(400).json({
      success: false,
      error: 'Validation failed',
      details: error.details.map(d => ({
        field: d.path.join('.'),
        message: d.message
      }))
    });
  }

  req.body = value;
  next();
};

const validateOrderInput = (req, res, next) => {
  const { error, value } = validateOrderSchema(req.body);
  
  if (error) {
    return res.status(400).json({
      success: false,
      error: 'Validation failed',
      details: error.details.map(d => ({
        field: d.path.join('.'),
        message: d.message
      }))
    });
  }

  req.body = value;
  next();
};

const validatePaymentInput = (req, res, next) => {
  const { error, value } = validatePaymentSchema(req.body);
  
  if (error) {
    return res.status(400).json({
      success: false,
      error: 'Validation failed',
      details: error.details.map(d => ({
        field: d.path.join('.'),
        message: d.message
      }))
    });
  }

  req.body = value;
  next();
};

const validateUserId = (req, res, next) => {
  const id = req.params.id;
  
  if (!id || isNaN(id)) {
    return res.status(400).json({
      success: false,
      error: 'Invalid user ID',
      details: 'User ID must be a valid number'
    });
  }
  
  next();
};

// ==================== Service Mesh Middleware ====================

// Circuit Breaker Pattern
const circuitBreaker = {
  states: {
    CLOSED: 'CLOSED',      // Normal operation
    OPEN: 'OPEN',          // Failing, reject requests
    HALF_OPEN: 'HALF_OPEN' // Testing if service recovered
  },
  
  services: {},

  initialize: function(serviceName) {
    if (!this.services[serviceName]) {
      this.services[serviceName] = {
        state: this.states.CLOSED,
        failures: 0,
        successes: 0,
        lastFailureTime: null,
        threshold: 5,           // Failures before opening
        resetTimeout: 30000,    // 30 seconds
        halfOpenAttempts: 0
      };
    }
    return this.services[serviceName];
  },

  recordSuccess: function(serviceName) {
    const cb = this.initialize(serviceName);
    cb.failures = 0;
    if (cb.state === this.states.HALF_OPEN) {
      cb.state = this.states.CLOSED;
      cb.successes = 0;
    }
  },

  recordFailure: function(serviceName) {
    const cb = this.initialize(serviceName);
    cb.failures++;
    cb.lastFailureTime = Date.now();

    if (cb.failures >= cb.threshold) {
      cb.state = this.states.OPEN;
    }
  },

  canExecute: function(serviceName) {
    const cb = this.initialize(serviceName);

    if (cb.state === this.states.CLOSED) {
      return true;
    }

    if (cb.state === this.states.OPEN) {
      // Check if reset timeout has passed
      if (Date.now() - cb.lastFailureTime > cb.resetTimeout) {
        cb.state = this.states.HALF_OPEN;
        cb.halfOpenAttempts = 0;
        return true;
      }
      return false;
    }

    // HALF_OPEN - allow probe request
    if (cb.state === this.states.HALF_OPEN) {
      cb.halfOpenAttempts++;
      return cb.halfOpenAttempts <= 1;
    }

    return false;
  },

  getStatus: function() {
    const status = {};
    for (const [service, cb] of Object.entries(this.services)) {
      status[service] = {
        state: cb.state,
        failures: cb.failures,
        successes: cb.successes
      };
    }
    return status;
  }
};

// Middleware that checks circuit breaker
const checkCircuitBreaker = (serviceName) => {
  return (req, res, next) => {
    if (!circuitBreaker.canExecute(serviceName)) {
      const cb = circuitBreaker.services[serviceName];
      return res.status(503).json({
        success: false,
        error: `Service unavailable: ${serviceName}`,
        details: `Circuit breaker is ${cb.state}. Service is not responding.`
      });
    }
    
    // Store circuit breaker reference for later recording
    req.serviceName = serviceName;
    next();
  };
};

// ==================== Request/Response Logging ====================

const requestLogger = (req, res, next) => {
  const start = Date.now();
  
  res.on('finish', () => {
    const duration = Date.now() - start;
    console.log(`[${req.method}] ${req.path} - ${res.statusCode} - ${duration}ms - Service: ${req.serviceName || 'gateway'}`);
    
    // Record in circuit breaker if applicable
    if (req.serviceName) {
      if (res.statusCode >= 500) {
        circuitBreaker.recordFailure(req.serviceName);
      } else {
        circuitBreaker.recordSuccess(req.serviceName);
      }
    }
  });

  next();
};

// ==================== Service Discovery Simulation ====================

const serviceRegistry = {
  'user-service': {
    url: 'http://localhost:6502',
    status: 'up',
    instances: [
      { id: 'user-1', url: 'http://localhost:6502', healthy: true },
      { id: 'user-2', url: 'http://localhost:6502', healthy: true }
    ]
  },
  'order-service': {
    url: 'http://localhost:6503',
    status: 'up',
    instances: [
      { id: 'order-1', url: 'http://localhost:6503', healthy: true }
    ]
  },
  'payment-service': {
    url: 'http://localhost:6504',
    status: 'up',
    instances: [
      { id: 'payment-1', url: 'http://localhost:6504', healthy: true }
    ]
  }
};

const discoverService = (serviceName) => {
  const service = serviceRegistry[serviceName];
  if (!service || service.status !== 'up') {
    throw new Error(`Service not found: ${serviceName}`);
  }

  // Simple round-robin load balancing
  const healthyInstances = service.instances.filter(i => i.healthy);
  if (healthyInstances.length === 0) {
    throw new Error(`No healthy instances for: ${serviceName}`);
  }

  return healthyInstances[Math.floor(Math.random() * healthyInstances.length)];
};

const getServiceRegistry = () => serviceRegistry;

// ==================== Rate Limiting ====================

const rateLimiter = {
  limits: {},

  recordRequest: function(clientId, limit = 100, windowMs = 60000) {
    if (!this.limits[clientId]) {
      this.limits[clientId] = {
        count: 0,
        resetTime: Date.now() + windowMs
      };
    }

    const client = this.limits[clientId];

    // Check if window has expired
    if (Date.now() > client.resetTime) {
      client.count = 0;
      client.resetTime = Date.now() + windowMs;
    }

    client.count++;
    return client.count <= limit;
  },

  isLimited: function(clientId, limit = 100, windowMs = 60000) {
    return !this.recordRequest(clientId, limit, windowMs);
  }
};

const enforceRateLimit = (limit = 100) => {
  return (req, res, next) => {
    const clientId = req.ip || req.headers['x-forwarded-for'] || 'unknown';
    
    if (rateLimiter.isLimited(clientId, limit)) {
      return res.status(429).json({
        success: false,
        error: 'Rate limit exceeded',
        retryAfter: 60
      });
    }

    next();
  };
};

// ==================== Request ID and Tracing ====================

const requestIdMiddleware = (req, res, next) => {
  req.id = req.headers['x-request-id'] || `req-${Date.now()}-${Math.random().toString(36).substr(2, 9)}`;
  res.setHeader('X-Request-ID', req.id);
  next();
};

// ==================== Error Handling ====================

const errorHandler = (err, req, res, next) => {
  console.error(`[Error ID: ${req.id}] ${err.message}`);
  
  res.status(500).json({
    success: false,
    error: 'Internal server error',
    requestId: req.id
  });
};

// ==================== Exports ====================

module.exports = {
  validateUserInput,
  validateOrderInput,
  validatePaymentInput,
  validateUserId,
  checkCircuitBreaker,
  requestLogger,
  circuitBreaker,
  discoverService,
  getServiceRegistry,
  enforceRateLimit,
  requestIdMiddleware,
  errorHandler
};
