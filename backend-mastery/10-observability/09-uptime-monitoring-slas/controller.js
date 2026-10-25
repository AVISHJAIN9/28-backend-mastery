// Uptime Monitoring & SLA Controller
const winston = require('winston');
const { v4: uuidv4 } = require('uuid');

// ==================== Logger Setup ====================

const logger = winston.createLogger({
  level: process.env.LOG_LEVEL || 'info',
  format: winston.format.combine(
    winston.format.timestamp({ format: 'YYYY-MM-DD HH:mm:ss' }),
    winston.format.json()
  ),
  transports: [
    new winston.transports.Console({
      format: winston.format.combine(
        winston.format.colorize(),
        winston.format.simple()
      )
    }),
    new winston.transports.File({ 
      filename: 'logs/combined.log',
      maxsize: 5242880,
      maxFiles: 5
    })
  ]
});

// ==================== Metrics Collection ====================

class MetricsStore {
  constructor() {
    this.requests = [];
    this.incidents = [];
    this.healthChecks = [];
    this.startTime = Date.now();
  }

  recordRequest(method, path, duration, status, timestamp = Date.now()) {
    this.requests.push({
      id: uuidv4(),
      method,
      path,
      duration,
      status,
      timestamp,
      isSuccess: status < 400
    });

    // Keep only last 10,000 requests (prevent memory issues)
    if (this.requests.length > 10000) {
      this.requests = this.requests.slice(-10000);
    }
  }

  recordHealthCheck(passed, duration, timestamp = Date.now()) {
    this.healthChecks.push({
      id: uuidv4(),
      passed,
      duration,
      timestamp
    });

    if (this.healthChecks.length > 1440) { // 24 hours of checks (1 per minute)
      this.healthChecks = this.healthChecks.slice(-1440);
    }
  }

  recordIncident(type, severity, description, duration = null) {
    const incident = {
      id: uuidv4(),
      type,
      severity,
      description,
      startTime: Date.now(),
      duration,
      status: 'active'
    };

    this.incidents.push(incident);
    logger.warn('Incident recorded', { incident });

    return incident;
  }

  resolveIncident(incidentId, resolution) {
    const incident = this.incidents.find(i => i.id === incidentId);
    if (incident) {
      incident.status = 'resolved';
      incident.resolution = resolution;
      incident.endTime = Date.now();
      incident.duration = incident.endTime - incident.startTime;
    }
    return incident;
  }

  // ==================== Calculations ====================

  getMetrics(timePeriodMs = 24 * 60 * 60 * 1000) { // Default 24 hours
    const now = Date.now();
    const cutoff = now - timePeriodMs;

    const recentRequests = this.requests.filter(r => r.timestamp > cutoff);
    const totalRequests = recentRequests.length;
    const successfulRequests = recentRequests.filter(r => r.isSuccess).length;
    const failedRequests = recentRequests.filter(r => !r.isSuccess).length;

    // Calculate availability (SLI)
    const availability = totalRequests > 0 
      ? (successfulRequests / totalRequests) * 100 
      : 100;

    // Calculate latency percentiles
    const durations = recentRequests.map(r => r.duration).sort((a, b) => a - b);
    const p50 = this.calculatePercentile(durations, 50);
    const p95 = this.calculatePercentile(durations, 95);
    const p99 = this.calculatePercentile(durations, 99);

    // Calculate error rate
    const errorRate = totalRequests > 0 
      ? (failedRequests / totalRequests) * 100 
      : 0;

    // Calculate downtime from incidents
    const activeDowntime = this.incidents
      .filter(i => i.severity === 'critical')
      .reduce((sum, i) => sum + (i.duration || (Date.now() - i.startTime)), 0);

    return {
      timestamp: new Date().toISOString(),
      period: timePeriodMs,
      totals: {
        requests: totalRequests,
        successful: successfulRequests,
        failed: failedRequests,
        downtime_ms: activeDowntime
      },
      metrics: {
        availability: parseFloat(availability.toFixed(2)),
        errorRate: parseFloat(errorRate.toFixed(2)),
        latency: {
          p50: p50,
          p95: p95,
          p99: p99,
          avg: recentRequests.length > 0 
            ? Math.round(recentRequests.reduce((sum, r) => sum + r.duration, 0) / recentRequests.length)
            : 0
        }
      }
    };
  }

  calculatePercentile(sortedArray, percentile) {
    if (sortedArray.length === 0) return 0;
    const index = Math.ceil((percentile / 100) * sortedArray.length) - 1;
    return sortedArray[index] || 0;
  }

  getMonthlyUptime() {
    // Simplified: assume 30 days
    const thirtyDaysMs = 30 * 24 * 60 * 60 * 1000;
    return this.getMetrics(thirtyDaysMs).metrics.availability;
  }

  getSLAStatus() {
    const sloTarget = parseFloat(process.env.SLO_TARGET || 0.999) * 100; // Convert to percentage
    const metrics = this.getMetrics(30 * 24 * 60 * 60 * 1000); // Monthly
    
    const uptime = metrics.metrics.availability;
    const meetsTarget = uptime >= sloTarget;
    
    // Calculate downtime budget
    const daysInMonth = 30;
    const secondsInMonth = daysInMonth * 24 * 60 * 60;
    const allowedDowntime = secondsInMonth * (1 - (sloTarget / 100));
    const actualDowntime = metrics.totals.downtime_ms / 1000;
    
    return {
      sloTarget: sloTarget.toFixed(2) + '%',
      actualUptime: uptime.toFixed(2) + '%',
      meetsTarget,
      allowedDowntime: Math.round(allowedDowntime) + ' seconds',
      actualDowntime: Math.round(actualDowntime) + ' seconds',
      remainingBudget: Math.round(allowedDowntime - actualDowntime) + ' seconds',
      status: meetsTarget ? 'COMPLIANT' : 'VIOLATION'
    };
  }

  getHealthStatus() {
    if (this.healthChecks.length === 0) {
      return { status: 'unknown', checks: 0 };
    }

    const lastCheck = this.healthChecks[this.healthChecks.length - 1];
    const recent = this.healthChecks.slice(-10); // Last 10 checks
    const passedCount = recent.filter(c => c.passed).length;

    return {
      status: lastCheck.passed ? 'healthy' : 'unhealthy',
      lastCheckTime: new Date(lastCheck.timestamp).toISOString(),
      lastCheckDuration: lastCheck.duration + 'ms',
      recentHealth: (passedCount / recent.length * 100).toFixed(1) + '%',
      checksPerformed: this.healthChecks.length
    };
  }

  getIncidents(limit = 10) {
    return this.incidents.slice(-limit).reverse();
  }

  getRecentIncidents(minutesBack = 60) {
    const cutoff = Date.now() - (minutesBack * 60 * 1000);
    return this.incidents.filter(i => i.startTime > cutoff);
  }

  clearData() {
    this.requests = [];
    this.incidents = [];
    this.healthChecks = [];
  }

  getStats() {
    const metrics24h = this.getMetrics(24 * 60 * 60 * 1000);
    const metrics7d = this.getMetrics(7 * 24 * 60 * 60 * 1000);
    const metrics30d = this.getMetrics(30 * 24 * 60 * 60 * 1000);

    return {
      uptime: {
        '24h': metrics24h.metrics.availability.toFixed(2) + '%',
        '7d': metrics7d.metrics.availability.toFixed(2) + '%',
        '30d': metrics30d.metrics.availability.toFixed(2) + '%'
      },
      latency: metrics24h.metrics.latency,
      errorRate: metrics24h.metrics.errorRate.toFixed(2) + '%',
      totalRequests: this.requests.length,
      totalIncidents: this.incidents.length,
      uptimeSeconds: Math.round((Date.now() - this.startTime) / 1000)
    };
  }
}

// ==================== Incident Simulation ====================

class IncidentSimulator {
  constructor(metricsStore) {
    this.metricsStore = metricsStore;
    this.simulationActive = false;
    this.simulationIncident = null;
  }

  startSimulation(type = 'api_error', durationSeconds = 30) {
    if (this.simulationActive) {
      return { error: 'Simulation already in progress' };
    }

    const durationMs = durationSeconds * 1000;
    const incident = this.metricsStore.recordIncident(
      type,
      'high',
      `Simulated ${type} incident for testing`,
      durationMs
    );

    this.simulationActive = true;
    this.simulationIncident = incident;

    // Simulate failures for the duration
    const interval = setInterval(() => {
      if (Math.random() < 0.8) { // 80% failure rate during incident
        this.metricsStore.recordRequest(
          'POST',
          '/api/test',
          Math.random() * 1000 + 500,
          500 + Math.floor(Math.random() * 4), // 500-503
          Date.now()
        );
      }
    }, 100);

    // Stop simulation after duration
    setTimeout(() => {
      clearInterval(interval);
      this.simulationActive = false;
      this.metricsStore.resolveIncident(incident.id, 'Simulation ended');
      logger.info('Incident simulation completed', { incident });
    }, durationMs);

    logger.warn('Incident simulation started', { incident, durationSeconds });
    return { incident, message: `Simulation running for ${durationSeconds}s` };
  }

  stopSimulation() {
    if (!this.simulationActive) {
      return { error: 'No simulation in progress' };
    }

    this.simulationActive = false;
    if (this.simulationIncident) {
      this.metricsStore.resolveIncident(this.simulationIncident.id, 'Manually stopped');
    }
    return { message: 'Simulation stopped' };
  }
}

// ==================== Exports ====================

const metricsStore = new MetricsStore();
const incidentSimulator = new IncidentSimulator(metricsStore);

module.exports = {
  metricsStore,
  incidentSimulator,
  logger,
  
  // Controllers
  getMetrics: (req, res) => {
    const period = req.query.period || '24'; // hours
    const periodMs = parseInt(period) * 60 * 60 * 1000;
    const metrics = metricsStore.getMetrics(periodMs);
    res.json(metrics);
  },

  getStatus: (req, res) => {
    const health = metricsStore.getHealthStatus();
    const metrics = metricsStore.getMetrics(24 * 60 * 60 * 1000);
    
    let status = 'operational';
    if (metrics.metrics.errorRate > 5) status = 'degraded';
    if (!health.status.includes('healthy')) status = 'down';

    res.json({
      status,
      timestamp: new Date().toISOString(),
      health,
      metrics: {
        uptime: metrics.metrics.availability.toFixed(2) + '%',
        latencyP95: metrics.metrics.latency.p95 + 'ms',
        errorRate: metrics.metrics.errorRate.toFixed(2) + '%'
      },
      recentIncidents: metricsStore.getRecentIncidents(60)
    });
  },

  getSLAStatus: (req, res) => {
    const slaStatus = metricsStore.getSLAStatus();
    res.json(slaStatus);
  },

  getStatistics: (req, res) => {
    const stats = metricsStore.getStats();
    res.json(stats);
  },

  getIncidents: (req, res) => {
    const limit = parseInt(req.query.limit) || 20;
    const incidents = metricsStore.getIncidents(limit);
    res.json({ incidents, count: incidents.length });
  },

  startIncidentSimulation: (req, res) => {
    const { type = 'api_error', durationSeconds = 30 } = req.body || {};
    const result = incidentSimulator.startSimulation(type, durationSeconds);
    
    if (result.error) {
      return res.status(400).json(result);
    }
    
    res.json(result);
  },

  stopIncidentSimulation: (req, res) => {
    const result = incidentSimulator.stopSimulation();
    
    if (result.error) {
      return res.status(400).json(result);
    }
    
    res.json(result);
  },

  getSimulationStatus: (req, res) => {
    res.json({
      active: incidentSimulator.simulationActive,
      incident: incidentSimulator.simulationIncident || null
    });
  },

  clearMetrics: (req, res) => {
    metricsStore.clearData();
    res.json({ message: 'Metrics cleared' });
  },

  healthCheck: (req, res) => {
    const health = metricsStore.getHealthStatus();
    metricsStore.recordHealthCheck(true, 10);
    
    res.json({
      status: 'ok',
      health,
      timestamp: new Date().toISOString(),
      uptime: Math.round((Date.now() - metricsStore.startTime) / 1000) + 's'
    });
  }
};

