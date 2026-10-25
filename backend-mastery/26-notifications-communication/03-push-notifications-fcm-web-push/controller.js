/**
 * Push Notifications Controller
 * Handles device registration, notification sending, and delivery tracking
 * Supports both Firebase Cloud Messaging (FCM) and Web Push API
 */

const {
  createDeviceToken,
  getDeviceToken,
  getDeviceTokenByToken,
  getAllDeviceTokens,
  updateDeviceToken,
  deleteDeviceToken,
  deactivateDeviceToken,
  createNotificationLog,
  getNotificationLog,
  getAllNotificationLogs,
  updateNotificationLog,
  getNotificationStats
} = require('./schema');

// ==================== Device Management ====================

// Register a new device with push token
const registerDevice = async (req, res) => {
  try {
    const {
      deviceId = `device-${Date.now()}`,
      platform,
      token,
      userId,
      subscriptionEndpoint,
      subscriptionAuth,
      appVersion,
      osVersion,
      metadata = {}
    } = req.body;

    // Check if device already registered
    const existingDevice = getDeviceTokenByToken(token);
    if (existingDevice && existingDevice.isActive) {
      return res.json({
        success: true,
        message: 'Device already registered',
        device: {
          id: existingDevice.id,
          deviceId: existingDevice.deviceId,
          platform: existingDevice.platform
        }
      });
    }

    // Create new device token
    const device = createDeviceToken({
      deviceId,
      platform,
      token,
      userId: userId || req.user?.id,
      subscriptionEndpoint,
      subscriptionAuth,
      appVersion,
      osVersion,
      metadata,
      isSandbox: false
    });

    res.status(201).json({
      success: true,
      message: 'Device registered successfully',
      device: {
        id: device.id,
        deviceId: device.deviceId,
        platform: device.platform,
        registeredAt: device.registeredAt
      }
    });
  } catch (error) {
    console.error('Registration error:', error.message);
    res.status(500).json({ error: 'Failed to register device' });
  }
};

// Get all devices for current user
const getDevices = async (req, res) => {
  try {
    const { active = true } = req.query;
    const userId = req.user?.id;

    const devices = getAllDeviceTokens({ 
      userId,
      isActive: active === 'true' ? true : undefined 
    });

    res.json({
      success: true,
      count: devices.length,
      devices: devices.map(d => ({
        id: d.id,
        deviceId: d.deviceId,
        platform: d.platform,
        isActive: d.isActive,
        registeredAt: d.registeredAt,
        lastUsedAt: d.lastUsedAt,
        appVersion: d.appVersion
      }))
    });
  } catch (error) {
    console.error('Get devices error:', error.message);
    res.status(500).json({ error: 'Failed to get devices' });
  }
};

// Unsubscribe a device
const unsubscribeDevice = async (req, res) => {
  try {
    const { deviceId } = req.params;

    const device = getDeviceToken(parseInt(deviceId));
    if (!device) {
      return res.status(404).json({ error: 'Device not found' });
    }

    // Verify ownership
    if (device.userId && device.userId !== req.user?.id) {
      return res.status(403).json({ error: 'Not authorized' });
    }

    const updated = deactivateDeviceToken(parseInt(deviceId), 'user_unsubscribed');

    res.json({
      success: true,
      message: 'Device unsubscribed',
      device: {
        id: updated.id,
        isActive: updated.isActive
      }
    });
  } catch (error) {
    console.error('Unsubscribe error:', error.message);
    res.status(500).json({ error: 'Failed to unsubscribe device' });
  }
};

// ==================== Notification Sending ====================

// Send notification to single device
const sendNotification = async (req, res) => {
  try {
    const { deviceId, title, body, data = {}, priority = 'normal' } = req.body;

    const device = getDeviceToken(parseInt(deviceId));
    if (!device) {
      return res.status(404).json({ error: 'Device not found' });
    }

    if (!device.isActive) {
      return res.status(410).json({ error: 'Device is inactive' });
    }

    // Create notification log entry
    const notification = createNotificationLog({
      deviceId: parseInt(deviceId),
      title,
      body,
      data,
      priority
    });

    // Simulate sending (in production, call FCM or Web Push API)
    updateNotificationLog(notification.id, {
      status: 'sent',
      sentAt: new Date().toISOString()
    });

    // Simulate delivery (in production, use callback/acknowledgment)
    setTimeout(() => {
      updateNotificationLog(notification.id, {
        status: 'delivered',
        deliveredAt: new Date().toISOString()
      });
    }, 1000);

    res.status(201).json({
      success: true,
      message: 'Notification sent',
      notification: {
        id: notification.id,
        status: 'sent',
        sentAt: notification.sentAt
      }
    });
  } catch (error) {
    console.error('Send error:', error.message);
    res.status(500).json({ error: 'Failed to send notification' });
  }
};

// Send batch notifications
const sendBatch = async (req, res) => {
  try {
    const { deviceIds, title, body, data = {}, priority = 'normal' } = req.body;

    const results = [];
    let sentCount = 0;
    let failedCount = 0;

    for (const deviceId of deviceIds) {
      const device = getDeviceToken(parseInt(deviceId));

      if (!device || !device.isActive) {
        failedCount++;
        results.push({
          deviceId,
          status: 'failed',
          reason: !device ? 'not_found' : 'inactive'
        });
        continue;
      }

      const notification = createNotificationLog({
        deviceId: parseInt(deviceId),
        title,
        body,
        data,
        priority
      });

      updateNotificationLog(notification.id, {
        status: 'sent'
      });

      sentCount++;
      results.push({
        deviceId,
        notificationId: notification.id,
        status: 'sent'
      });
    }

    res.status(201).json({
      success: true,
      message: 'Batch sent',
      sent: sentCount,
      failed: failedCount,
      results: results.slice(0, 10)
    });
  } catch (error) {
    console.error('Batch send error:', error.message);
    res.status(500).json({ error: 'Failed to send batch' });
  }
};

// ==================== Notification Tracking ====================

// Get notification logs
const getNotificationLogs = async (req, res) => {
  try {
    const { status, limit = 50 } = req.query;
    const userId = req.user?.id;

    const logs = getAllNotificationLogs({ status, userId })
      .sort((a, b) => new Date(b.sentAt) - new Date(a.sentAt))
      .slice(0, parseInt(limit));

    res.json({
      success: true,
      count: logs.length,
      logs: logs.map(l => ({
        id: l.id,
        title: l.title,
        status: l.status,
        sentAt: l.sentAt,
        deliveredAt: l.deliveredAt
      }))
    });
  } catch (error) {
    console.error('Get logs error:', error.message);
    res.status(500).json({ error: 'Failed to get logs' });
  }
};

// Track user action on notification
const markActionClicked = async (req, res) => {
  try {
    const { notificationId } = req.params;
    const { action } = req.body;

    const notification = getNotificationLog(parseInt(notificationId));
    if (!notification) {
      return res.status(404).json({ error: 'Notification not found' });
    }

    const updated = updateNotificationLog(parseInt(notificationId), {
      actionClicked: action,
      clickedAt: new Date().toISOString()
    });

    res.json({
      success: true,
      message: 'Action tracked',
      notification: {
        id: updated.id,
        actionClicked: updated.actionClicked
      }
    });
  } catch (error) {
    console.error('Track action error:', error.message);
    res.status(500).json({ error: 'Failed to track action' });
  }
};

// ==================== Statistics ====================

// Get notification statistics
const getStats = async (req, res) => {
  try {
    const stats = getNotificationStats();

    res.json({
      success: true,
      statistics: {
        total: stats.total,
        byStatus: {
          queued: stats.queued,
          sent: stats.sent,
          delivered: stats.delivered,
          failed: stats.failed
        },
        engagement: {
          withActions: stats.withActions,
          actionRate: `${stats.avgActionRate}%`
        }
      }
    });
  } catch (error) {
    console.error('Stats error:', error.message);
    res.status(500).json({ error: 'Failed to get statistics' });
  }
};

module.exports = {
  registerDevice,
  getDevices,
  unsubscribeDevice,
  sendNotification,
  sendBatch,
  getNotificationLogs,
  markActionClicked,
  getStats
};


const { logger } = require('./middleware');

/**
 * In-memory database for users
 * In production, use MongoDB/PostgreSQL
 */
const users = {
  1: {
    id: 1,
    email: 'alice@test.com',
    name: 'Alice',
    role: 'user',
    devices: []
  },
  2: {
    id: 2,
    email: 'bob@test.com',
    name: 'Bob',
    role: 'user',
    devices: []
  }
};

/**
 * Device tokens store
 * Each device has unique token and platform info
 */
const deviceTokens = {}; // { deviceId: { userId, platform, token, endpoint, p256dh, auth, createdAt, lastUsed } }

/**
 * Notification logs store
 * Tracks all sent notifications
 */
const notificationLogs = {}; // { notificationId: { userId, to, platform, title, body, status, sentAt, deliveredAt, clickedAt } }

/**
 * Engagement stats store
 * Tracks metrics per user
 */
const engagementStats = {}; // { userId: { sent, delivered, clicked, bounced } }

let notificationIdCounter = 1000;
let deviceIdCounter = 1000;

/**
 * Register a new device with push notification token
 * POST /api/devices/register
 * 
 * Body: { platform, token, endpoint?, p256dh?, auth? }
 */
const registerDevice = async (req, res) => {
  const userId = req.user.id;
  const { platform, token, endpoint, p256dh, auth } = req.body;

  try {
    // Check if user exists
    if (!users[userId]) {
      logger.warn('Attempted device registration for non-existent user', { userId });
      return res.status(404).json({
        error: 'User not found',
        code: 'USER_NOT_FOUND'
      });
    }

    const deviceId = `device_${++deviceIdCounter}`;

    // Store device based on platform
    if (platform === 'fcm') {
      deviceTokens[deviceId] = {
        userId,
        platform: 'fcm',
        token,
        createdAt: new Date(),
        lastUsed: null,
        status: 'active'
      };
    } else if (platform === 'web-push') {
      deviceTokens[deviceId] = {
        userId,
        platform: 'web-push',
        endpoint,
        p256dh,
        auth,
        createdAt: new Date(),
        lastUsed: null,
        status: 'active'
      };
    }

    // Track device in user's device list
    users[userId].devices.push(deviceId);

    // Initialize stats if not exist
    if (!engagementStats[userId]) {
      engagementStats[userId] = {
        sent: 0,
        delivered: 0,
        clicked: 0,
        bounced: 0
      };
    }

    logger.info('Device registered', {
      userId,
      deviceId,
      platform
    });

    res.status(201).json({
      message: 'Device registered successfully',
      deviceId,
      platform
    });
  } catch (error) {
    logger.error('Device registration failed', {
      error: error.message,
      userId
    });
    res.status(500).json({
      error: 'Failed to register device',
      code: 'REGISTRATION_FAILED'
    });
  }
};

/**
 * Unsubscribe device from push notifications
 * POST /api/devices/unsubscribe
 * 
 * Body: { deviceId }
 */
const unsubscribeDevice = async (req, res) => {
  const userId = req.user.id;
  const { deviceId } = req.body;

  try {
    const device = deviceTokens[deviceId];

    if (!device) {
      return res.status(404).json({
        error: 'Device not found',
        code: 'DEVICE_NOT_FOUND'
      });
    }

    // Verify ownership
    if (device.userId !== userId && req.user.role !== 'admin') {
      logger.warn('Unauthorized unsubscribe attempt', { userId, deviceId });
      return res.status(403).json({
        error: 'Forbidden',
        code: 'FORBIDDEN'
      });
    }

    // Mark as unsubscribed
    device.status = 'unsubscribed';
    device.unsubscribedAt = new Date();

    // Remove from user's device list
    users[device.userId].devices = users[device.userId].devices.filter(d => d !== deviceId);

    logger.info('Device unsubscribed', {
      userId: device.userId,
      deviceId
    });

    res.json({
      message: 'Device unsubscribed successfully',
      deviceId
    });
  } catch (error) {
    logger.error('Device unsubscription failed', {
      error: error.message,
      userId
    });
    res.status(500).json({
      error: 'Failed to unsubscribe device',
      code: 'UNSUBSCRIPTION_FAILED'
    });
  }
};

/**
 * Send notification to a single device
 * POST /api/notifications/send
 * 
 * Body: { deviceId, title, body, data?, actions? }
 */
const sendNotification = async (req, res) => {
  const userId = req.user.id;
  const { deviceId, title, body, data, actions } = req.body;

  try {
    const device = deviceTokens[deviceId];

    if (!device) {
      return res.status(404).json({
        error: 'Device not found',
        code: 'DEVICE_NOT_FOUND'
      });
    }

    if (device.status !== 'active') {
      return res.status(400).json({
        error: 'Device is not active',
        code: 'DEVICE_INACTIVE'
      });
    }

    // Verify ownership
    if (device.userId !== userId && req.user.role !== 'admin') {
      logger.warn('Unauthorized send attempt', { userId, deviceId });
      return res.status(403).json({
        error: 'Forbidden',
        code: 'FORBIDDEN'
      });
    }

    const notificationId = `notif_${++notificationIdCounter}`;

    // Create notification log
    notificationLogs[notificationId] = {
      id: notificationId,
      userId: device.userId,
      deviceId,
      to: device.platform === 'fcm' ? device.token : device.endpoint,
      platform: device.platform,
      title,
      body,
      data,
      actions,
      status: 'sent',
      sentAt: new Date(),
      deliveredAt: null,
      clickedAt: null
    };

    // Update device last used
    device.lastUsed = new Date();

    // Update stats
    engagementStats[device.userId].sent += 1;

    // Simulate delivery confirmation
    setTimeout(() => {
      if (notificationLogs[notificationId]) {
        notificationLogs[notificationId].status = 'delivered';
        notificationLogs[notificationId].deliveredAt = new Date();
        engagementStats[device.userId].delivered += 1;
      }
    }, 1000);

    logger.info('Notification sent', {
      notificationId,
      userId: device.userId,
      deviceId,
      platform: device.platform
    });

    res.json({
      message: 'Notification sent successfully',
      notificationId,
      status: 'sent'
    });
  } catch (error) {
    logger.error('Send notification failed', {
      error: error.message,
      userId
    });
    res.status(500).json({
      error: 'Failed to send notification',
      code: 'SEND_FAILED'
    });
  }
};

/**
 * Send notification to multiple devices in batch
 * POST /api/notifications/batch
 * 
 * Body: { deviceIds: [], title, body, data?, actions? }
 */
const sendBatch = async (req, res) => {
  const userId = req.user.id;
  const { deviceIds, title, body, data, actions } = req.body;

  try {
    if (!Array.isArray(deviceIds) || deviceIds.length === 0) {
      return res.status(400).json({
        error: 'deviceIds must be a non-empty array',
        code: 'INVALID_DEVICE_IDS'
      });
    }

    if (deviceIds.length > 1000) {
      return res.status(400).json({
        error: 'Maximum 1000 devices per batch',
        code: 'TOO_MANY_DEVICES'
      });
    }

    const results = {
      sent: 0,
      failed: 0,
      notificationIds: []
    };

    for (const deviceId of deviceIds) {
      const device = deviceTokens[deviceId];

      if (!device || device.status !== 'active') {
        results.failed += 1;
        continue;
      }

      // Verify ownership for non-admin
      if (device.userId !== userId && req.user.role !== 'admin') {
        results.failed += 1;
        continue;
      }

      const notificationId = `notif_${++notificationIdCounter}`;

      // Create notification log
      notificationLogs[notificationId] = {
        id: notificationId,
        userId: device.userId,
        deviceId,
        to: device.platform === 'fcm' ? device.token : device.endpoint,
        platform: device.platform,
        title,
        body,
        data,
        actions,
        status: 'sent',
        sentAt: new Date(),
        deliveredAt: null,
        clickedAt: null
      };

      device.lastUsed = new Date();
      engagementStats[device.userId].sent += 1;
      results.sent += 1;
      results.notificationIds.push(notificationId);
    }

    logger.info('Batch notifications sent', {
      userId,
      sent: results.sent,
      failed: results.failed,
      totalRequested: deviceIds.length
    });

    res.json({
      message: 'Batch notifications sent',
      ...results
    });
  } catch (error) {
    logger.error('Batch send failed', {
      error: error.message,
      userId
    });
    res.status(500).json({
      error: 'Failed to send batch notifications',
      code: 'BATCH_SEND_FAILED'
    });
  }
};

/**
 * Get all devices registered by user
 * GET /api/devices
 */
const getDevices = async (req, res) => {
  const userId = req.user.id;

  try {
    const user = users[userId];

    if (!user) {
      return res.status(404).json({
        error: 'User not found',
        code: 'USER_NOT_FOUND'
      });
    }

    const devices = user.devices.map(deviceId => {
      const device = deviceTokens[deviceId];
      return {
        deviceId,
        platform: device.platform,
        status: device.status,
        createdAt: device.createdAt,
        lastUsed: device.lastUsed
      };
    });

    res.json({
      userId,
      deviceCount: devices.length,
      devices
    });
  } catch (error) {
    logger.error('Get devices failed', {
      error: error.message,
      userId
    });
    res.status(500).json({
      error: 'Failed to fetch devices',
      code: 'FETCH_FAILED'
    });
  }
};

/**
 * Get notification history for user
 * GET /api/notifications/logs?limit=50&status=sent
 */
const getNotificationLogs = async (req, res) => {
  const userId = req.user.id;
  const { limit = 50, status = null } = req.query;

  try {
    let logs = Object.values(notificationLogs)
      .filter(log => log.userId === userId);

    // Filter by status if provided
    if (status && ['sent', 'delivered', 'clicked', 'bounced'].includes(status)) {
      logs = logs.filter(log => log.status === status);
    }

    // Sort by sentAt descending
    logs.sort((a, b) => new Date(b.sentAt) - new Date(a.sentAt));

    // Apply limit
    const limitNum = Math.min(parseInt(limit) || 50, 1000);
    logs = logs.slice(0, limitNum);

    res.json({
      userId,
      total: logs.length,
      logs
    });
  } catch (error) {
    logger.error('Get notification logs failed', {
      error: error.message,
      userId
    });
    res.status(500).json({
      error: 'Failed to fetch notification logs',
      code: 'FETCH_FAILED'
    });
  }
};

/**
 * Get engagement statistics
 * GET /api/stats
 */
const getStats = async (req, res) => {
  const userId = req.user.id;

  try {
    const stats = engagementStats[userId] || {
      sent: 0,
      delivered: 0,
      clicked: 0,
      bounced: 0
    };

    // Calculate rates
    const deliveryRate = stats.sent > 0 ? ((stats.delivered / stats.sent) * 100).toFixed(2) : 0;
    const engagementRate = stats.delivered > 0 ? ((stats.clicked / stats.delivered) * 100).toFixed(2) : 0;

    res.json({
      userId,
      stats: {
        sent: stats.sent,
        delivered: stats.delivered,
        clicked: stats.clicked,
        bounced: stats.bounced,
        deliveryRate: parseFloat(deliveryRate),
        engagementRate: parseFloat(engagementRate)
      }
    });
  } catch (error) {
    logger.error('Get stats failed', {
      error: error.message,
      userId
    });
    res.status(500).json({
      error: 'Failed to fetch statistics',
      code: 'FETCH_FAILED'
    });
  }
};

/**
 * Mark notification as clicked/actioned
 * POST /api/notifications/:notificationId/action
 * 
 * Body: { action?: string }
 */
const markActionClicked = async (req, res) => {
  const { notificationId } = req.params;
  const { action } = req.body;

  try {
    const notification = notificationLogs[notificationId];

    if (!notification) {
      return res.status(404).json({
        error: 'Notification not found',
        code: 'NOTIFICATION_NOT_FOUND'
      });
    }

    // Mark as clicked
    notification.status = 'clicked';
    notification.clickedAt = new Date();
    notification.action = action || 'default';

    // Update stats
    engagementStats[notification.userId].clicked += 1;

    logger.info('Notification action tracked', {
      notificationId,
      userId: notification.userId,
      action: notification.action
    });

    res.json({
      message: 'Action recorded',
      notificationId,
      status: 'clicked',
      action: notification.action
    });
  } catch (error) {
    logger.error('Mark action failed', {
      error: error.message
    });
    res.status(500).json({
      error: 'Failed to record action',
      code: 'ACTION_FAILED'
    });
  }
};

module.exports = {
  registerDevice,
  unsubscribeDevice,
  sendNotification,
  sendBatch,
  getDevices,
  getNotificationLogs,
  getStats,
  markActionClicked,
  // Export for testing
  users,
  deviceTokens,
  notificationLogs,
  engagementStats
};
