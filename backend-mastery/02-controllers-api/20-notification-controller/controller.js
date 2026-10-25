const { v4: uuidv4 } = require('uuid');

const notifications = new Map();

class NotificationController {
  static async sendNotification(req, res) {
    try {
      const { userId, type, message, channel } = req.body;
      const notifId = uuidv4();
      
      const notification = {
        id: notifId,
        userId,
        type,
        message,
        channel: channel || 'email',
        status: 'sent',
        createdAt: new Date(),
        sentAt: new Date()
      };
      
      notifications.set(notifId, notification);
      res.status(201).json(notification);
    } catch (err) {
      res.status(500).json({ error: err.message });
    }
  }

  static async getNotifications(req, res) {
    try {
      const { userId } = req.params;
      const userNotifs = Array.from(notifications.values())
        .filter(n => n.userId === userId)
        .sort((a, b) => new Date(b.createdAt) - new Date(a.createdAt));
      res.json({ notifications: userNotifs });
    } catch (err) {
      res.status(500).json({ error: err.message });
    }
  }
}
module.exports = NotificationController;