// ==================== In-Memory Data Stores ====================

const smsLogStore = {};
const otpStore = {};
const phoneBlacklistStore = new Set();
let smsIdCounter = 1000;
let otpIdCounter = 2000;

// ==================== SMS LOG OPERATIONS ====================

const createSmsLog = (phoneNumber, message, provider = 'twilio', status = 'queued') => {
  const id = `sms_${++smsIdCounter}`;
  const log = {
    id,
    phoneNumber,
    message,
    provider,
    status, // queued, sent, delivered, failed
    createdAt: new Date(),
    sentAt: null,
    deliveredAt: null,
    error: null,
    attempts: 0,
    maxAttempts: 3,
    nextRetryAt: null
  };
  smsLogStore[id] = log;\n  return log;\n};\n\nconst getSmsLog = (id) => smsLogStore[id];\n\nconst getAllSmsLogs = (limit = 50, offset = 0, filter = {}) => {\n  let logs = Object.values(smsLogStore);\n  \n  if (filter.status) logs = logs.filter(l => l.status === filter.status);\n  if (filter.provider) logs = logs.filter(l => l.provider === filter.provider);\n  if (filter.phoneNumber) logs = logs.filter(l => l.phoneNumber === filter.phoneNumber);\n  \n  logs.sort((a, b) => new Date(b.createdAt) - new Date(a.createdAt));\n  return logs.slice(offset, offset + limit);\n};\n\nconst updateSmsLog = (id, updates) => {\n  if (smsLogStore[id]) {\n    smsLogStore[id] = { ...smsLogStore[id], ...updates };\n    return smsLogStore[id];\n  }\n  return null;\n};\n\nconst getSmsStats = () => {\n  const logs = Object.values(smsLogStore);\n  return {\n    total: logs.length,\n    queued: logs.filter(l => l.status === 'queued').length,\n    sent: logs.filter(l => l.status === 'sent').length,\n    delivered: logs.filter(l => l.status === 'delivered').length,\n    failed: logs.filter(l => l.status === 'failed').length,\n    deliveryRate: logs.length > 0 \n      ? ((logs.filter(l => l.status === 'delivered').length / logs.filter(l => l.status !== 'queued').length) * 100).toFixed(1)\n      : 0\n  };\n};\n\n// ==================== OTP OPERATIONS ====================\n\nconst generateOTP = (length = 6) => {\n  const digits = '0123456789';\n  let otp = '';\n  for (let i = 0; i < length; i++) {\n    otp += digits.charAt(Math.floor(Math.random() * 10));\n  }\n  return otp;\n};\n\nconst createOTP = (phoneNumber, provider = 'twilio') => {\n  const id = `otp_${++otpIdCounter}`;\n  const otp = generateOTP(6);\n  const expiresAt = new Date(Date.now() + 10 * 60 * 1000); // 10 minutes\n  \n  otpStore[id] = {\n    id,\n    phoneNumber,\n    otp,\n    provider,\n    status: 'sent', // sent, verified, expired, cancelled\n    createdAt: new Date(),\n    expiresAt,\n    verifiedAt: null,\n    attempts: 0,\n    maxAttempts: 3,\n    smsLogId: null\n  };\n  \n  return otpStore[id];\n};\n\nconst getOTPByPhoneNumber = (phoneNumber) => {\n  return Object.values(otpStore).find(\n    otp => otp.phoneNumber === phoneNumber && otp.status === 'sent'\n  );\n};\n\nconst getOTP = (id) => otpStore[id];\n\nconst verifyOTP = (id, otpCode) => {\n  const otp = otpStore[id];\n  if (!otp) return { valid: false, error: 'OTP not found' };\n  \n  if (otp.status !== 'sent') {\n    return { valid: false, error: 'OTP already used or expired' };\n  }\n  \n  if (new Date() > otp.expiresAt) {\n    otp.status = 'expired';\n    return { valid: false, error: 'OTP expired' };\n  }\n  \n  if (otp.attempts >= otp.maxAttempts) {\n    otp.status = 'cancelled';\n    return { valid: false, error: 'Too many attempts' };\n  }\n  \n  otp.attempts++;\n  \n  if (otp.otp === otpCode) {\n    otp.status = 'verified';\n    otp.verifiedAt = new Date();\n    return { valid: true, otp };\n  }\n  \n  return { valid: false, error: 'Invalid OTP code' };\n};\n\nconst getAllOTPs = (limit = 50, offset = 0, filter = {}) => {\n  let otps = Object.values(otpStore);\n  \n  if (filter.status) otps = otps.filter(o => o.status === filter.status);\n  if (filter.phoneNumber) otps = otps.filter(o => o.phoneNumber === filter.phoneNumber);\n  \n  otps.sort((a, b) => new Date(b.createdAt) - new Date(a.createdAt));\n  return otps.slice(offset, offset + limit);\n};\n\n// ==================== BLACKLIST OPERATIONS ====================\n\nconst addToBlacklist = (phoneNumber) => {\n  phoneBlacklistStore.add(phoneNumber);\n};\n\nconst isBlacklisted = (phoneNumber) => {\n  return phoneBlacklistStore.has(phoneNumber);\n};\n\nconst removeFromBlacklist = (phoneNumber) => {\n  phoneBlacklistStore.delete(phoneNumber);\n};\n\nconst getBlacklistedPhones = () => {\n  return Array.from(phoneBlacklistStore);\n};\n\n// ==================== CONSTANTS ====================\n\nconst OTP_PROVIDERS = {\n  TWILIO: 'twilio',\n  VONAGE: 'vonage'\n};\n\nconst SMS_PROVIDERS = {\n  TWILIO: 'twilio',\n  VONAGE: 'vonage'\n};\n\nconst OTP_LENGTH = 6;\nconst OTP_EXPIRY_MS = 10 * 60 * 1000; // 10 minutes\nconst SMS_MAX_LENGTH = 160;\nconst PHONE_REGEX = /^\\+?[1-9]\\d{1,14}$/; // E.164 format\n\nmodule.exports = {\n  // SMS Operations\n  createSmsLog,\n  getSmsLog,\n  getAllSmsLogs,\n  updateSmsLog,\n  getSmsStats,\n  \n  // OTP Operations\n  generateOTP,\n  createOTP,\n  getOTPByPhoneNumber,\n  getOTP,\n  verifyOTP,\n  getAllOTPs,\n  \n  // Blacklist Operations\n  addToBlacklist,\n  isBlacklisted,\n  removeFromBlacklist,\n  getBlacklistedPhones,\n  \n  // Constants\n  OTP_PROVIDERS,\n  SMS_PROVIDERS,\n  OTP_LENGTH,\n  OTP_EXPIRY_MS,\n  SMS_MAX_LENGTH,\n  PHONE_REGEX\n};\n
