class AlertController {
  constructor(io) { this.io = io; }
  broadcastSystemAlert(alert) {
    this.io.emit('alert:system', {
      ...alert,
      timestamp: new Date(),
      id: `alert_${Date.now()}`
    });
  }
  sendAlertToUsers(alert, userIds) {
    const payload = { ...alert, timestamp: new Date() };
    userIds.forEach(userId => {
      this.io.to(`user_${userId}`).emit('alert:targeted', payload);
    });
  }
  sendBySeverity(alert, severity) {
    this.io.emit('alert:severity', { severity, ...alert });
  }
}
module.exports = AlertController;