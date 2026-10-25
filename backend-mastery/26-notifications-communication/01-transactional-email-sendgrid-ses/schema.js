// ==================== Database Schema ====================
// This is an in-memory database schema for educational purposes
// In production, use MongoDB, PostgreSQL, etc.

const emailAuditLog = {};
let auditId = 1;

const auditEmailSchema = {
  id: 'unique identifier',
  recipientEmail: 'string - email address',
  subject: 'string - email subject',
  template: 'string - template type (welcome, reset, order, etc)',
  status: 'enum - pending, sent, failed, bounced',
  provider: 'enum - sendgrid, ses, nodemailer',
  sentAt: 'timestamp - when email was sent',
  failureReason: 'string - reason if failed',
  retryCount: 'number - how many times retried',
  metadata: 'object - custom key-value pairs'
};

// Mock in-memory data
const emailTemplates = {
  welcome: {
    name: 'Welcome Email',
    subject: 'Welcome to {{appName}}!',
    body: 'Hi {{userName}}, welcome to {{appName}}. Click {{link}} to get started.',
    category: 'transactional'
  },
  passwordReset: {
    name: 'Password Reset',
    subject: 'Reset Your Password',
    body: 'Click {{resetLink}} to reset your password. Valid for 24 hours.',
    category: 'security'
  },
  orderConfirmation: {
    name: 'Order Confirmation',
    subject: 'Your Order #{{orderId}} is Confirmed',
    body: 'Thank you for your order. Order ID: {{orderId}}, Total: {{amount}}',
    category: 'transactional'
  },
  twoFactor: {
    name: 'Two-Factor Code',
    subject: 'Your 2FA Code',
    body: 'Your verification code is: {{code}}. Valid for 10 minutes.',
    category: 'security'
  }
};

const emailProviders = {
  sendgrid: {
    name: 'SendGrid',
    apiKeyEnv: 'SENDGRID_API_KEY',
    fromEmail: 'noreply@sendgrid.example.com',
    features: ['templates', 'analytics', 'webhooks', 'a/b-testing'],
    rateLimit: 100
  },
  ses: {
    name: 'Amazon SES',
    apiKeyEnv: 'AWS_REGION',
    fromEmail: 'noreply@ses.example.com',
    features: ['templates', 'sending-quotas', 'dedicated-ip'],
    rateLimit: 14
  },
  nodemailer: {
    name: 'Nodemailer (SMTP)',
    apiKeyEnv: 'SMTP_PASSWORD',
    fromEmail: 'noreply@localhost',
    features: ['basic-email', 'html-content'],
    rateLimit: 1000
  }
};

// ==================== Helper Functions ====================

const createEmailAuditLog = (data) => {
  const log = {
    id: auditId++,
    recipientEmail: data.recipientEmail,
    subject: data.subject,
    template: data.template,
    status: data.status || 'pending',
    provider: data.provider || 'nodemailer',
    sentAt: data.sentAt || new Date().toISOString(),
    failureReason: data.failureReason || null,
    retryCount: data.retryCount || 0,
    metadata: data.metadata || {}
  };
  emailAuditLog[log.id] = log;
  return log;
};

const getEmailAuditLog = (id) => {
  return emailAuditLog[id] || null;
};

const getAllEmailAuditLogs = () => {
  return Object.values(emailAuditLog);
};

const updateEmailAuditLog = (id, updates) => {
  if (!emailAuditLog[id]) return null;
  emailAuditLog[id] = { ...emailAuditLog[id], ...updates };
  return emailAuditLog[id];
};

const getEmailsByStatus = (status) => {
  return Object.values(emailAuditLog).filter(log => log.status === status);
};

const getEmailsByTemplate = (template) => {
  return Object.values(emailAuditLog).filter(log => log.template === template);
};

module.exports = {
  auditEmailSchema,
  emailTemplates,
  emailProviders,
  emailAuditLog,
  createEmailAuditLog,
  getEmailAuditLog,
  getAllEmailAuditLogs,
  updateEmailAuditLog,
  getEmailsByStatus,
  getEmailsByTemplate
};

