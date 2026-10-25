class PerformanceController {
  static async getMetrics(req, res) {
    const memUsage = process.memoryUsage();
    const uptime = process.uptime();
    
    return res.json({
      success: true,
      metrics: {
        uptime: Math.floor(uptime / 60) + 'm ' + Math.floor(uptime % 60) + 's',
        memory: {
          heapUsed: (memUsage.heapUsed / 1024 / 1024).toFixed(2) + 'MB',
          heapTotal: (memUsage.heapTotal / 1024 / 1024).toFixed(2) + 'MB',
          external: (memUsage.external / 1024 / 1024).toFixed(2) + 'MB'
        }
      }
    });
  }
}

module.exports = PerformanceController;
