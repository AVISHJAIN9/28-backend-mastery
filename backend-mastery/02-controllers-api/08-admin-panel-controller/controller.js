const { v4: uuidv4 } = require('uuid');

const adminUsers = new Map([['admin1', { id: 'admin1', username: 'admin1', role: 'superadmin', email: 'admin@example.com' }]]);
const systemConfig = new Map([['system', { version: '1.0', maxUsers: 1000, features: [] }]]);
const auditLogs = [];

class AdminPanelController {
  static async getDashboard(req, res) {
    try {
      res.json({
        stats: { totalUsers: 100, activeUsers: 45, systemHealth: 98.5 },
        recentActivity: auditLogs.slice(-5),
        alerts: []
      });
    } catch (err) {
      res.status(500).json({ error: err.message });
    }
  }

  static async listUsers(req, res) {
    try {
      res.json({ users: Array.from(adminUsers.values()) });
    } catch (err) {
      res.status(500).json({ error: err.message });
    }
  }

  static async getConfig(req, res) {
    try {
      res.json({ config: systemConfig.get('system') });
    } catch (err) {
      res.status(500).json({ error: err.message });
    }
  }

  static async updateConfig(req, res) {
    try {
      const config = systemConfig.get('system');
      Object.assign(config, req.body);
      systemConfig.set('system', config);
      auditLogs.push({ action: 'config_updated', timestamp: new Date() });
      res.json({ message: 'Config updated', config });
    } catch (err) {
      res.status(500).json({ error: err.message });
    }
  }

  static async getUserStats(req, res) {
    try {
      res.json({
        total: 1000,
        active: 450,
        inactive: 550,
        growth: 12.5,
        byCountry: { US: 400, UK: 150, CA: 100 }
      });
    } catch (err) {
      res.status(500).json({ error: err.message });
    }
  }
}
module.exports = AdminPanelController;