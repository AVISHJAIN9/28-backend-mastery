/**
 * Push Notifications Routes
 * Defines all endpoints with proper middleware chains
 */

const express = require('express');
const {
  registerDevice,
  getDevices,
  unsubscribeDevice,
  sendNotification,
  sendBatch,
  getNotificationLogs,
  markActionClicked,
  getStats
} = require('./controller');

const {
  verifyToken,
  validateDeviceToken,
  validateNotificationPayload,
  validateBatchNotification,
  rateLimiterSingle,
  rateLimiterBatch,
  rateLimiterRegister,
  logOperation
} = require('./middleware');

const router = express.Router();

// ==================== Logging ====================

router.use(logOperation);

// ==================== Device Management Routes ====================

// POST /api/devices/register - Register new device
router.post(
  '/devices/register',
  rateLimiterRegister,
  validateDeviceToken,
  registerDevice
);

// GET /api/devices - List user's devices
router.get(
  '/devices',
  verifyToken,
  getDevices
);

// POST /api/devices/:deviceId/unsubscribe - Unsubscribe device
router.post(
  '/devices/:deviceId/unsubscribe',
  verifyToken,
  unsubscribeDevice
);

// ==================== Notification Routes ====================

// POST /api/notifications/send - Send to single device
router.post(
  '/notifications/send',
  verifyToken,
  rateLimiterSingle,
  validateNotificationPayload,
  sendNotification
);

// POST /api/notifications/batch - Batch send
router.post(
  '/notifications/batch',
  verifyToken,
  rateLimiterBatch,
  validateBatchNotification,
  sendBatch
);

// GET /api/notifications/logs - Get notification history
router.get(
  '/notifications/logs',
  verifyToken,
  getNotificationLogs
);

// POST /api/notifications/:notificationId/action - Track user action
router.post(
  '/notifications/:notificationId/action',
  markActionClicked
);

// ==================== Statistics Routes ====================

// GET /api/stats - Get notification statistics
router.get(
  '/stats',
  verifyToken,
  getStats
);

module.exports = router;


const express = require('express');
const router = express.Router();

const {
  registerDevice,
  unsubscribeDevice,
  sendNotification,
  sendBatch,
  getDevices,
  getNotificationLogs,
  getStats,
  markActionClicked
} = require('./controller');

const {
  verifyToken,
  validateDeviceToken,
  validateNotificationPayload,
  notificationRateLimiter,
  batchNotificationRateLimiter,
  deviceRegistrationLimiter,
  asyncHandler
} = require('./middleware');

// ============================================================
// Device Management Endpoints
// ============================================================

/**
 * POST /api/devices/register
 * Register a new device with push notification token
 * Requires: JWT auth, platform, token (for FCM) or endpoint + keys (for Web Push)
 */
router.post(
  '/devices/register',
  verifyToken,
  deviceRegistrationLimiter,
  validateDeviceToken,
  asyncHandler(registerDevice)
);

/**
 * POST /api/devices/unsubscribe
 * Unsubscribe device from push notifications
 * Requires: JWT auth, deviceId
 */
router.post(
  '/devices/unsubscribe',
  verifyToken,
  asyncHandler(unsubscribeDevice)
);

/**
 * GET /api/devices
 * Get all devices registered by the user
 * Requires: JWT auth
 */
router.get(
  '/devices',
  verifyToken,
  asyncHandler(getDevices)
);

// ============================================================
// Notification Sending Endpoints
// ============================================================

/**
 * POST /api/notifications/send
 * Send notification to a single device
 * Requires: JWT auth, deviceId, title, body
 */
router.post(
  '/notifications/send',
  verifyToken,
  notificationRateLimiter,
  validateNotificationPayload,
  asyncHandler(sendNotification)
);

/**
 * POST /api/notifications/batch
 * Send notification to multiple devices
 * Requires: JWT auth, deviceIds[], title, body
 * Max 1000 devices per batch
 */
router.post(
  '/notifications/batch',
  verifyToken,
  batchNotificationRateLimiter,
  validateNotificationPayload,
  asyncHandler(sendBatch)
);

/**
 * GET /api/notifications/logs
 * Get notification history
 * Query params: limit (default 50), status (sent|delivered|clicked|bounced)
 * Requires: JWT auth
 */
router.get(
  '/notifications/logs',
  verifyToken,
  asyncHandler(getNotificationLogs)
);

/**
 * POST /api/notifications/:notificationId/action
 * Mark notification as clicked/actioned
 * Requires: JWT auth, notificationId in URL
 */
router.post(
  '/notifications/:notificationId/action',
  verifyToken,
  asyncHandler(markActionClicked)
);

// ============================================================
// Statistics Endpoints
// ============================================================

/**
 * GET /api/stats
 * Get user's engagement statistics
 * Returns: sent, delivered, clicked, bounced counts and rates
 * Requires: JWT auth
 */
router.get(
  '/stats',
  verifyToken,
  asyncHandler(getStats)
);

module.exports = router;
