// Routes for Uptime Monitoring & SLA Module
const express = require('express');
const router = express.Router();
const {
  getMetrics,
  getStatus,
  getSLAStatus,
  getStatistics,
  getIncidents,
  startIncidentSimulation,
  stopIncidentSimulation,
  getSimulationStatus,
  clearMetrics,
  healthCheck,
  metricsStore
} = require('./controller');

// ==================== Metrics & Monitoring ====================

// Get real-time metrics for specified period
router.get('/metrics', getMetrics);

// Get status page (for public display)
router.get('/status', getStatus);

// Get SLA compliance status
router.get('/sla-status', getSLAStatus);

// Get detailed statistics
router.get('/statistics', getStatistics);

// Get incidents list
router.get('/incidents', getIncidents);

// Get uptime for specific time period
router.get('/uptime', (req, res) => {
  const period = req.query.period || '24'; // hours
  const periodMs = parseInt(period) * 60 * 60 * 1000;
  const metrics = metricsStore.getMetrics(periodMs);
  
  res.json({
    periodHours: period,
    uptime: metrics.metrics.availability.toFixed(2) + '%',
    totalRequests: metrics.totals.requests,
    successfulRequests: metrics.totals.successful,
    failedRequests: metrics.totals.failed,
    errorRate: metrics.metrics.errorRate.toFixed(2) + '%'
  });
});

// ==================== Incident Management ====================

// Start incident simulation (for testing)
router.post('/test-incident', express.json(), startIncidentSimulation);

// Stop incident simulation
router.post('/stop-incident', stopIncidentSimulation);

// Get current simulation status
router.get('/simulation-status', getSimulationStatus);

// ==================== Health & Diagnostics ====================

// Health check endpoint
router.get('/health', healthCheck);

// Clear all metrics (for testing)
router.post('/clear-metrics', clearMetrics);

// Get comprehensive report
router.get('/report', (req, res) => {
  const metrics24h = metricsStore.getMetrics(24 * 60 * 60 * 1000);
  const metrics30d = metricsStore.getMetrics(30 * 24 * 60 * 60 * 1000);
  const slaStatus = metricsStore.getSLAStatus();
  const health = metricsStore.getHealthStatus();
  const incidents = metricsStore.getRecentIncidents(60);

  res.json({
    timestamp: new Date().toISOString(),
    slaCompliance: slaStatus,
    metrics: {
      '24h': metrics24h.metrics,
      '30d': metrics30d.metrics
    },
    health,
    recentIncidents: incidents,
    summary: {
      status: slaStatus.status,
      message: slaStatus.meetsTarget 
        ? 'SLA target met' 
        : 'SLA target exceeded - corrective action needed'
    }
  });
});

module.exports = router;

