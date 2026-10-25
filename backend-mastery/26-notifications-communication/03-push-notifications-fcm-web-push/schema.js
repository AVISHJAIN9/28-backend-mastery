// ==================== Database Schema ====================
// In-memory database for educational purposes
// In production, use MongoDB, PostgreSQL, or Firestore

const deviceTokenStore = {};
let deviceId = 1;

const deviceTokenSchema = {
  id: 'unique identifier',
  deviceId: 'string - unique device identifier',
  platform: 'enum - android, ios, web, macos, windows',
  token: 'string - FCM or Web Push token',
  subscriptionEndpoint: 'string - Web Push subscription endpoint',
  subscriptionAuth: 'object - { auth, p256dh } for Web Push',
  userId: 'string - associated user ID',
  isActive: 'boolean - whether device is still registered',
  isSandbox: 'boolean - is this a test/sandbox token',
  registeredAt: 'timestamp - when device was registered',
  lastUsedAt: 'timestamp - last time token was used',
  appVersion: 'string - app version on device',
  osVersion: 'string - device OS version',
  metadata: 'object - custom data like device name, browser'
};

const notificationLogStore = {};
let notificationId = 1;

const notificationLogSchema = {
  id: 'unique identifier',
  deviceId: 'string - target device ID',
  title: 'string - notification title',
  body: 'string - notification body',
  data: 'object - additional data payload',
  priority: 'enum - high, normal',
  ttl: 'number - time to live in seconds',
  sentAt: 'timestamp - when sent',
  deliveredAt: 'timestamp - when delivered',
  status: 'enum - queued, sent, delivered, failed',
  failureReason: 'string - why it failed',
  actionClicked: 'string - which action user clicked',
  clickedAt: 'timestamp - when user clicked'
};

const categoryStore = {};
const actionStore = {};

// ==================== Device Token Management ====================

const createDeviceToken = (data) => {
  const deviceToken = {
    id: deviceId++,
    deviceId: data.deviceId || `device-${Date.now()}`,
    platform: data.platform || 'web',
    token: data.token,
    subscriptionEndpoint: data.subscriptionEndpoint,
    subscriptionAuth: data.subscriptionAuth,
    userId: data.userId,
    isActive: true,
    isSandbox: data.isSandbox || false,
    registeredAt: new Date().toISOString(),
    lastUsedAt: new Date().toISOString(),
    appVersion: data.appVersion || 'unknown',
    osVersion: data.osVersion || 'unknown',
    metadata: data.metadata || {}
  };
  deviceTokenStore[deviceToken.id] = deviceToken;
  return deviceToken;
};

const getDeviceToken = (id) => {
  return deviceTokenStore[id] || null;
};

const getDeviceTokenByToken = (token) => {
  return Object.values(deviceTokenStore).find(d => d.token === token) || null;
};

const getAllDeviceTokens = (filters = {}) => {
  let tokens = Object.values(deviceTokenStore);
  
  if (filters.userId) {
    tokens = tokens.filter(t => t.userId === filters.userId);
  }
  if (filters.platform) {
    tokens = tokens.filter(t => t.platform === filters.platform);
  }
  if (filters.isActive !== undefined) {
    tokens = tokens.filter(t => t.isActive === filters.isActive);
  }
  
  return tokens;
};

const updateDeviceToken = (id, updates) => {
  if (!deviceTokenStore[id]) return null;
  const updated = { ...deviceTokenStore[id], ...updates, lastUsedAt: new Date().toISOString() };
  deviceTokenStore[id] = updated;
  return updated;
};

const deleteDeviceToken = (id) => {
  delete deviceTokenStore[id];
  return true;
};

const deactivateDeviceToken = (id, reason = 'unsubscribed') => {
  return updateDeviceToken(id, { 
    isActive: false,
    failureReason: reason
  });
};

// ==================== Notification Logging ====================

const createNotificationLog = (data) => {
  const notification = {
    id: notificationId++,
    deviceId: data.deviceId,
    title: data.title,
    body: data.body,
    data: data.data || {},
    priority: data.priority || 'normal',
    ttl: data.ttl || 2592000,
    sentAt: new Date().toISOString(),
    deliveredAt: null,
    status: 'queued',
    failureReason: null,
    actionClicked: null,
    clickedAt: null
  };
  notificationLogStore[notification.id] = notification;
  return notification;
};

const getNotificationLog = (id) => {
  return notificationLogStore[id] || null;
};

const getAllNotificationLogs = (filters = {}) => {
  let logs = Object.values(notificationLogStore);
  
  if (filters.deviceId) {
    logs = logs.filter(l => l.deviceId === filters.deviceId);
  }
  if (filters.status) {
    logs = logs.filter(l => l.status === filters.status);
  }
  if (filters.userId) {
    const device = getAllDeviceTokens({ userId: filters.userId });
    const deviceIds = device.map(d => d.id);
    logs = logs.filter(l => deviceIds.includes(l.deviceId));
  }
  
  return logs;
};

const updateNotificationLog = (id, updates) => {
  if (!notificationLogStore[id]) return null;
  const updated = { ...notificationLogStore[id], ...updates };
  notificationLogStore[id] = updated;
  return updated;
};

const getNotificationStats = () => {
  const logs = Object.values(notificationLogStore);
  return {
    total: logs.length,
    queued: logs.filter(l => l.status === 'queued').length,
    sent: logs.filter(l => l.status === 'sent').length,
    delivered: logs.filter(l => l.status === 'delivered').length,
    failed: logs.filter(l => l.status === 'failed').length,
    withActions: logs.filter(l => l.actionClicked !== null).length,
    avgActionRate: logs.length > 0 ? Math.round((logs.filter(l => l.actionClicked !== null).length / logs.length) * 100) : 0
  };
};

// ==================== Constants ====================

const notificationPriorities = {
  high: 'High priority - immediate delivery',
  normal: 'Normal priority - delivered when convenient'
};

const notificationPlatforms = {
  android: 'Android devices (FCM)',
  ios: 'iOS devices (FCM)',
  web: 'Web browsers (Web Push API)',
  macos: 'macOS browsers (Web Push API)',
  windows: 'Windows desktop (Web Push API)'
};

const notificationCategories = {
  promotional: {
    name: 'Promotional',
    description: 'Marketing and promotional content',
    defaultPriority: 'normal'
  },
  transactional: {
    name: 'Transactional',
    description: 'Order confirmations, shipping updates',
    defaultPriority: 'high'
  },
  social: {
    name: 'Social',
    description: 'Friend requests, messages',
    defaultPriority: 'normal'
  },
  security: {
    name: 'Security',
    description: 'Login alerts, security notifications',
    defaultPriority: 'high'
  },
  system: {
    name: 'System',
    description: 'App updates, system messages',
    defaultPriority: 'normal'
  }
};

module.exports = {
  // Device Token Functions
  createDeviceToken,
  getDeviceToken,
  getDeviceTokenByToken,
  getAllDeviceTokens,
  updateDeviceToken,
  deleteDeviceToken,
  deactivateDeviceToken,

  // Notification Log Functions
  createNotificationLog,
  getNotificationLog,
  getAllNotificationLogs,
  updateNotificationLog,
  getNotificationStats,

  // Constants
  notificationPriorities,
  notificationPlatforms,
  notificationCategories,

  // Schemas
  deviceTokenSchema,
  notificationLogSchema
};

