const { logger } = require('./middleware');
const { EventEmitter } = require('events');

const degradationEmitter = new EventEmitter();

const CircuitState = {
  CLOSED: 'closed',
  OPEN: 'open',
  HALF_OPEN: 'half_open'
};

const circuits = {
  userService: {
    state: CircuitState.CLOSED,
    failureCount: 0,
    failureThreshold: 5,
    timeout: 5000,
    lastFailureTime: null,
    resetTimeout: 30000
  },
  postService: {
    state: CircuitState.CLOSED,
    failureCount: 0,
    failureThreshold: 5,
    timeout: 5000,
    lastFailureTime: null,
    resetTimeout: 30000
  },
  analyticsService: {
    state: CircuitState.CLOSED,
    failureCount: 0,
    failureThreshold: 3,
    timeout: 2000,
    lastFailureTime: null,
    resetTimeout: 60000
  }
};

const fallbacks = {
  userService: {
    enabled: true,
    type: 'cache',
    cachedData: { id: 1, name: 'Cached User', email: 'cached@test.com' }
  },
  postService: {
    enabled: true,
    type: 'partial',
    cachedData: { posts: [] }
  },
  analyticsService: {
    enabled: true,
    type: 'null',
    cachedData: null
  }
};

const callServiceVulnerable = (req, res) => {
  res.json({
    user: { id: 1, name: 'User', email: 'user@test.com' },
    posts: [{ id: 1, title: 'Post 1' }],
    analytics: { views: 100 }
  });
};

const callServiceSecure = (req, res) => {
  const result = { success: true, data: {} };
  
  if (circuits.userService.state === CircuitState.CLOSED) {
    result.data.user = { id: 1, name: 'Alice', email: 'alice@test.com' };
    result.services = { ...result.services, userService: 'healthy' };
  } else if (fallbacks.userService.enabled) {
    result.data.user = fallbacks.userService.cachedData;
    result.services = { ...result.services, userService: 'degraded' };
    result.degraded = true;
  }
  
  if (circuits.postService.state === CircuitState.CLOSED) {
    result.data.posts = [
      { id: 1, userId: 1, title: 'Post 1' },
      { id: 2, userId: 1, title: 'Post 2' }
    ];
    result.services = { ...result.services, postService: 'healthy' };
  } else if (fallbacks.postService.enabled) {
    result.data.posts = [];
    result.services = { ...result.services, postService: 'degraded' };
    result.degraded = true;
  }
  
  if (circuits.analyticsService.state === CircuitState.CLOSED) {
    result.data.analytics = { views: 1250, engagement: 4.2 };
    result.services = { ...result.services, analyticsService: 'healthy' };
  } else if (fallbacks.analyticsService.enabled) {
    result.data.analytics = fallbacks.analyticsService.cachedData;
    result.services = { ...result.services, analyticsService: 'degraded' };
  } else {
    result.services = { ...result.services, analyticsService: 'unavailable' };
  }
  
  return res.json(result);
};

const createCircuitBreaker = (req, res) => {
  const { service_name, status, failure_threshold, timeout_ms, reset_timeout_ms } = req.validated;
  
  if (!circuits[service_name]) {
    return res.status(404).json({ error: 'Service not found' });
  }
  
  circuits[service_name] = {
    ...circuits[service_name],
    state: status === 'down' ? CircuitState.OPEN : CircuitState.CLOSED,
    failureThreshold: failure_threshold,
    timeout: timeout_ms,
    resetTimeout: reset_timeout_ms
  };
  
  logger.info('Circuit breaker configured', { service: service_name, status });
  
  return res.json({
    success: true,
    message: `Circuit breaker for ${service_name} configured`,
    config: circuits[service_name]
  });
};

const enableFallback = (req, res) => {
  const { service_name, fallback_enabled, fallback_type, fallback_value } = req.validated;
  
  if (!fallbacks[service_name]) {
    return res.status(404).json({ error: 'Service not found' });
  }
  
  fallbacks[service_name] = {
    enabled: fallback_enabled,
    type: fallback_type,
    cachedData: fallback_value || fallbacks[service_name].cachedData
  };
  
  logger.info('Fallback configured', { service: service_name, enabled: fallback_enabled });
  
  return res.json({
    success: true,
    message: `Fallback for ${service_name} ${fallback_enabled ? 'enabled' : 'disabled'}`,
    config: fallbacks[service_name]
  });
};

const getServiceHealth = (req, res) => {
  const { service_name } = req.validated;
  
  if (!circuits[service_name]) {
    return res.status(404).json({ error: 'Service not found' });
  }
  
  const circuit = circuits[service_name];
  const fallback = fallbacks[service_name];
  
  return res.json({
    success: true,
    service: service_name,
    health: {
      status: mapCircuitStateToHealth(circuit.state),
      circuit_state: circuit.state,
      failure_count: circuit.failureCount,
      failure_threshold: circuit.failureThreshold,
      last_failure: circuit.lastFailureTime,
      timeout_ms: circuit.timeout,
      reset_timeout_ms: circuit.resetTimeout
    },
    fallback: {
      enabled: fallback.enabled,
      type: fallback.type,
      has_cached_data: !!fallback.cachedData
    }
  });
};

const getSystemHealth = (req, res) => {
  const services = {};
  
  Object.keys(circuits).forEach(serviceName => {
    const circuit = circuits[serviceName];
    const fallback = fallbacks[serviceName];
    
    services[serviceName] = {
      status: mapCircuitStateToHealth(circuit.state),
      circuit_state: circuit.state,
      fallback_enabled: fallback.enabled,
      failure_count: circuit.failureCount
    };
  });
  
  const overallStatus = Object.values(services).every(s => s.status === 'healthy')
    ? 'healthy'
    : Object.values(services).some(s => s.status === 'down')
    ? 'partial'
    : 'healthy';
  
  return res.json({
    success: true,
    overall_status: overallStatus,
    services
  });
};

const recordFailure = (req, res) => {
  const { service_name, error_message, error_code } = req.validated;
  
  if (!circuits[service_name]) {
    return res.status(404).json({ error: 'Service not found' });
  }
  
  const circuit = circuits[service_name];
  circuit.failureCount++;
  circuit.lastFailureTime = new Date();
  
  logger.warn('Service failure recorded', {
    service: service_name,
    error: error_message,
    code: error_code,
    failures: circuit.failureCount
  });
  
  if (circuit.failureCount >= circuit.failureThreshold) {
    circuit.state = CircuitState.OPEN;
    logger.error('Circuit opened', { service: service_name });
    degradationEmitter.emit('circuit:opened', { service: service_name });
  }
  
  return res.json({
    success: true,
    message: `Failure recorded for ${service_name}`,
    circuit_state: circuit.state,
    failure_count: circuit.failureCount,
    circuit_opened: circuit.state === CircuitState.OPEN
  });
};

const resetCircuit = (req, res) => {
  const { service_name } = req.validated;
  
  if (!circuits[service_name]) {
    return res.status(404).json({ error: 'Service not found' });
  }
  
  const circuit = circuits[service_name];
  circuit.state = CircuitState.HALF_OPEN;
  circuit.failureCount = 0;
  circuit.lastFailureTime = null;
  
  logger.info('Circuit reset to half-open', { service: service_name });
  degradationEmitter.emit('circuit:reset', { service: service_name });
  
  return res.json({
    success: true,
    message: `Circuit for ${service_name} reset to half-open`,
    circuit_state: circuit.state
  });
};

const apiCallWithFallback = (req, res) => {
  const { service_name, endpoint, method, data } = req.validated;
  
  if (!circuits[service_name]) {
    return res.status(404).json({ error: 'Service not found' });
  }
  
  const circuit = circuits[service_name];
  const fallback = fallbacks[service_name];
  
  if (circuit.state === CircuitState.OPEN) {
    logger.warn('Circuit open - using fallback', { service: service_name });
    
    if (!fallback.enabled) {
      return res.status(503).json({
        error: 'Service unavailable',
        message: `${service_name} is down and fallback is disabled`
      });
    }
    
    return res.json({
      success: true,
      degraded: true,
      source: 'fallback',
      fallback_type: fallback.type,
      data: fallback.cachedData
    });
  }
  
  const simulatedSuccess = Math.random() > 0.3;
  
  if (simulatedSuccess) {
    circuit.failureCount = 0;
    circuit.state = CircuitState.CLOSED;
    
    return res.json({
      success: true,
      source: 'primary',
      data: { id: Math.random(), data: 'success' }
    });
  } else {
    circuit.failureCount++;
    circuit.lastFailureTime = new Date();
    
    if (circuit.failureCount >= circuit.failureThreshold) {
      circuit.state = CircuitState.OPEN;
      logger.error('Circuit opened after failures', { service: service_name });
      degradationEmitter.emit('circuit:opened', { service: service_name });
    }
    
    logger.warn('Service call failed', { service: service_name, failures: circuit.failureCount });
    
    if (fallback.enabled) {
      return res.json({
        success: true,
        degraded: true,
        source: 'fallback',
        fallback_type: fallback.type,
        data: fallback.cachedData,
        message: `Primary service failed, using fallback`
      });
    }
    
    return res.status(503).json({
      error: 'Service unavailable',
      failures: circuit.failureCount
    });
  }
};

const mapCircuitStateToHealth = (state) => {
  switch (state) {
    case CircuitState.CLOSED:
      return 'healthy';
    case CircuitState.OPEN:
      return 'down';
    case CircuitState.HALF_OPEN:
      return 'degraded';
    default:
      return 'unknown';
  }
};

module.exports = {
  callServiceVulnerable,
  callServiceSecure,
  createCircuitBreaker,
  enableFallback,
  getServiceHealth,
  getSystemHealth,
  recordFailure,
  resetCircuit,
  apiCallWithFallback,
  degradationEmitter
};
