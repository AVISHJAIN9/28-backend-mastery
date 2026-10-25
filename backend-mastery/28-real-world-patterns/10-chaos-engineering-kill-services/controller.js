const services = {
  userService: { status: 'UP', latency_ms: 100, error_rate: 0 },
  paymentService: { status: 'UP', latency_ms: 200, error_rate: 0 },
  analyticsService: { status: 'UP', latency_ms: 50, error_rate: 0 },
  databaseService: { status: 'UP', latency_ms: 10, error_rate: 0 }
};

const operationLog = [];

const killService = async (req, res) => {
  try {
    const { service_name } = req.body;
    if (!services[service_name]) return res.status(404).json({ error: 'Service not found' });
    const originalStatus = services[service_name].status;
    services[service_name].status = 'DOWN';
    services[service_name].error_rate = 100;
    operationLog.push({ timestamp: new Date().toISOString(), operation: 'kill_service', service: service_name, original_status: originalStatus });
    res.json({ message: `${service_name} killed`, service_name, status: 'DOWN', timestamp: new Date().toISOString() });
  } catch (error) {
    res.status(500).json({ error: 'Failed to kill service' });
  }
};

const restoreService = async (req, res) => {
  try {
    const { service_name } = req.body;
    if (!services[service_name]) return res.status(404).json({ error: 'Service not found' });
    services[service_name].status = 'UP';
    services[service_name].error_rate = 0;
    operationLog.push({ timestamp: new Date().toISOString(), operation: 'restore_service', service: service_name });
    res.json({ message: `${service_name} restored`, service_name, status: 'UP' });
  } catch (error) {
    res.status(500).json({ error: 'Failed to restore' });
  }
};

const injectLatency = async (req, res) => {
  try {
    const { service_name, latency_ms } = req.body;
    if (!services[service_name]) return res.status(404).json({ error: 'Service not found' });
    services[service_name].latency_ms = latency_ms;
    operationLog.push({ timestamp: new Date().toISOString(), operation: 'inject_latency', service: service_name, latency_ms });
    res.json({ message: 'Latency injected', service_name, latency_ms });
  } catch (error) {
    res.status(500).json({ error: 'Failed to inject latency' });
  }
};

const getServiceStatus = async (req, res) => {
  try {
    res.json({ services, timestamp: new Date().toISOString(), operation_count: operationLog.length });
  } catch (error) {
    res.status(500).json({ error: 'Failed to get status' });
  }
};

const resetAllServices = async (req, res) => {
  try {
    Object.keys(services).forEach(service => {
      services[service] = { status: 'UP', latency_ms: 100, error_rate: 0 };
    });
    operationLog.push({ timestamp: new Date().toISOString(), operation: 'reset_all' });
    res.json({ message: 'All services reset', services });
  } catch (error) {
    res.status(500).json({ error: 'Failed to reset' });
  }
};

module.exports = { killService, restoreService, injectLatency, getServiceStatus, resetAllServices };
