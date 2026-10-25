const { v4: uuidv4 } = require('uuid');

// ==================== State (In-memory Database) ====================
const emailLogs = new Map();
const emailTemplates = new Map();
const sentEmails = new Map();
const verificationCodes = new Map();

// ==================== Email Sending ====================

exports.sendEmail = async (req, res) => {
  const { to, subject, body, html } = req.validatedBody;
  const provider = req.emailProvider || 'resend';

  try {
    const emailId = uuidv4();
    const timestamp = new Date();

    // Log email
    const emailLog = {
      id: emailId,
      to,
      subject,
      body: body.substring(0, 100),
      provider,
      status: 'sent',
      timestamp,
      retries: 0,
    };

    emailLogs.set(emailId, emailLog);
    sentEmails.set(to, { ...emailLog, timestamp });

    res.json({
      success: true,
      id: emailId,
      to,
      subject,
      provider,
      status: 'sent',
      timestamp,
      message: `Email sent via ${provider}`,
    });
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
};

// ==================== Verification Email ====================

exports.sendVerificationEmail = async (req, res) => {
  const { to, verificationCode } = req.validatedBody;

  try {
    const emailId = uuidv4();

    // Store verification code
    verificationCodes.set(to, {
      code: verificationCode,
      expiresAt: new Date(Date.now() + 3600000), // 1 hour
      verified: false,
    });

    const emailLog = {
      id: emailId,
      to,
      subject: 'Email Verification',
      type: 'verification',
      status: 'sent',
      timestamp: new Date(),
    };

    emailLogs.set(emailId, emailLog);

    res.json({
      success: true,
      id: emailId,
      to,
      type: 'verification',
      message: 'Verification email sent',
    });
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
};

// ==================== Verify Email Code ====================

exports.verifyEmailCode = async (req, res) => {
  const { to, code } = req.body;

  try {
    const stored = verificationCodes.get(to);

    if (!stored) {
      return res.status(404).json({ error: 'No verification code found' });
    }

    if (stored.expiresAt < new Date()) {
      return res.status(400).json({ error: 'Verification code expired' });
    }

    if (stored.code !== code) {
      return res.status(400).json({ error: 'Invalid verification code' });
    }

    stored.verified = true;

    res.json({
      success: true,
      email: to,
      verified: true,
      message: 'Email verified successfully',
    });
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
};

// ==================== Receipt Email ====================

exports.sendReceiptEmail = async (req, res) => {
  const { to, orderId, amount, items } = req.validatedBody;

  try {
    const emailId = uuidv4();
    const receiptHtml = `
      <h2>Order Receipt</h2>
      <p>Order ID: ${orderId}</p>
      <p>Total: $${amount.toFixed(2)}</p>
      <ul>
        ${(items || []).map(item => `<li>${item.name} x${item.quantity} - $${item.price}</li>`).join('')}
      </ul>
    `;

    const emailLog = {
      id: emailId,
      to,
      subject: `Receipt for Order ${orderId}`,
      type: 'receipt',
      status: 'sent',
      timestamp: new Date(),
    };

    emailLogs.set(emailId, emailLog);

    res.json({
      success: true,
      id: emailId,
      to,
      orderId,
      type: 'receipt',
      message: 'Receipt email sent',
    });
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
};

// ==================== Batch Email ====================

exports.sendBatchEmail = async (req, res) => {
  const { recipients, subject, body } = req.validatedBody;

  try {
    const batchId = uuidv4();
    const results = [];

    recipients.forEach(email => {
      const emailId = uuidv4();
      const log = {
        id: emailId,
        to: email,
        subject,
        batchId,
        status: 'sent',
        timestamp: new Date(),
      };
      emailLogs.set(emailId, log);
      results.push({ email, id: emailId, status: 'sent' });
    });

    res.json({
      success: true,
      batchId,
      total: recipients.length,
      sent: results.length,
      results,
      message: `Batch email sent to ${results.length} recipients`,
    });
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
};

// ==================== Email Templates ====================

exports.createTemplate = async (req, res) => {
  const { name, subject, body, html, variables } = req.validatedBody;

  try {
    const templateId = uuidv4();
    const template = {
      id: templateId,
      name,
      subject,
      body,
      html,
      variables: variables || [],
      createdAt: new Date(),
    };

    emailTemplates.set(templateId, template);

    res.json({
      success: true,
      id: templateId,
      name,
      message: 'Template created',
    });
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
};

exports.listTemplates = async (req, res) => {
  const templates = Array.from(emailTemplates.values());
  res.json({
    success: true,
    total: templates.length,
    templates,
  });
};

exports.getEmailLogs = async (req, res) => {
  const logs = Array.from(emailLogs.values());
  res.json({
    success: true,
    total: logs.length,
    logs,
  });
};

module.exports = {
  sendEmail,
  sendVerificationEmail,
  verifyEmailCode,
  sendReceiptEmail,
  sendBatchEmail,
  createTemplate,
  listTemplates,
  getEmailLogs,
};
