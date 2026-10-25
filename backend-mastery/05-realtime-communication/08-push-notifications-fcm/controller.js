const admin = require('firebase-admin');
class FCMController {
  constructor() { this.db = admin.database(); }
  async sendNotification(deviceToken, notification) {
    const message = {
      notification: { title: notification.title, body: notification.body },
      data: notification.data || {}
    };
    return await admin.messaging().sendToDevice(deviceToken, message);
  }
  async sendToTopic(topic, notification) {
    return await admin.messaging().sendToTopic(topic, {
      notification: { title: notification.title, body: notification.body }
    });
  }
  async subscribeToTopic(deviceToken, topic) {
    return await admin.messaging().subscribeToTopic(deviceToken, topic);
  }
}
module.exports = FCMController;