const nodemailer = require('nodemailer');
const {
  createEmailAuditLog,
  getEmailAuditLog,
  getAllEmailAuditLogs,
  updateEmailAuditLog,
  getEmailsByStatus,
  getEmailsByTemplate,
  emailTemplates,
  emailProviders
} = require('./schema');

// ==================== Email Service Setup ====================

// Initialize Nodemailer transporter (in production use real SMTP or SendGrid)
const createTransporter = () => {
  const provider = process.env.EMAIL_PROVIDER || 'nodemailer';

  if (provider === 'sendgrid') {
    // Using nodemailer with SendGrid
    return nodemailer.createTransport({
      host: 'smtp.sendgrid.net',
      port: 587,
      auth: {
        user: 'apikey',
        pass: process.env.SENDGRID_API_KEY || 'test-key'
      }
    });
  } else if (provider === 'ses') {
    // Using AWS SES (would require AWS SDK in production)
    return nodemailer.createTransport({
      service: 'ses',
      region: process.env.AWS_REGION || 'us-east-1',
      auth: {
        accessKeyId: process.env.AWS_ACCESS_KEY_ID,
        secretAccessKey: process.env.AWS_SECRET_ACCESS_KEY
      }
    });
  } else {
    // Default Nodemailer SMTP
    return nodemailer.createTransport({
      host: process.env.SMTP_HOST || 'localhost',
      port: process.env.SMTP_PORT || 1025,
      auth: process.env.SMTP_USER 
        ? {
            user: process.env.SMTP_USER,
            pass: process.env.SMTP_PASSWORD
          }
        : undefined
    });
  }
};

const transporter = createTransporter();

// ==================== Template Rendering ====================

const renderTemplate = (templateKey, variables = {}) => {
  const template = emailTemplates[templateKey];
  if (!template) {
    throw new Error(`Template '${templateKey}' not found`);
  }

  let body = template.body;
  Object.entries(variables).forEach(([key, value]) => {
    body = body.replace(new RegExp(`{{${key}}}`, 'g'), value);
  });

  return {
    subject: template.subject,
    body,
    category: template.category
  };
};

// ==================== Controllers ====================

// 1. Send Single Email
const sendTransactionalEmail = async (req, res) => {
  try {
    const {
      recipientEmail,
      subject,
      body,
      template,
      templateVariables = {},
      metadata = {},
      provider = 'nodemailer'
    } = req.body;

    // Log the email
    const auditLog = createEmailAuditLog({
      recipientEmail,
      subject: subject || (template ? emailTemplates[template]?.subject : 'Unknown'),
      template: template || 'custom',
      status: 'pending',
      provider,
      metadata
    });

    // Prepare email content
    let emailContent = { subject, html: body };
    if (template) {
      const rendered = renderTemplate(template, templateVariables);
      emailContent = { ...emailContent, subject: rendered.subject, html: rendered.body };
    }

    // Send email
    await transporter.sendMail({
      from: process.env.FROM_EMAIL || 'noreply@app.local',
      to: recipientEmail,
      subject: emailContent.subject,
      html: emailContent.html
    });

    // Update audit log
    updateEmailAuditLog(auditLog.id, { status: 'sent', sentAt: new Date().toISOString() });

    res.status(201).json({
      success: true,
      message: 'Email sent successfully',
      auditId: auditLog.id,
      email: {
        to: recipientEmail,
        subject: emailContent.subject,
        provider
      }
    });
  } catch (error) {
    console.error('Email sending error:', error.message);
    res.status(500).json({
      error: 'Failed to send email',
      details: error.message
    });
  }
};

// 2. Send Bulk Emails
const sendBulkEmails = async (req, res) => {
  try {
    const { emails, subject, body, template, templateVariables = {} } = req.body;

    if (!Array.isArray(emails) || emails.length === 0) {
      return res.status(400).json({ error: 'emails array is required and cannot be empty' });
    }

    const results = [];
    const failures = [];

    for (const recipientEmail of emails) {
      try {
        // Create audit log
        const auditLog = createEmailAuditLog({
          recipientEmail,
          subject: subject || (template ? emailTemplates[template]?.subject : 'Unknown'),
          template: template || 'custom',
          status: 'pending'
        });

        // Prepare content
        let emailContent = { subject, html: body };
        if (template) {
          const rendered = renderTemplate(template, { ...templateVariables, email: recipientEmail });
          emailContent = { ...emailContent, subject: rendered.subject, html: rendered.body };
        }

        // Send email
        await transporter.sendMail({
          from: process.env.FROM_EMAIL || 'noreply@app.local',
          to: recipientEmail,
          subject: emailContent.subject,
          html: emailContent.html
        });

        updateEmailAuditLog(auditLog.id, { status: 'sent' });
        results.push({ email: recipientEmail, auditId: auditLog.id, status: 'sent' });
      } catch (err) {
        failures.push({ email: recipientEmail, error: err.message });
      }
    }

    res.status(207).json({
      success: true,
      message: `Sent ${results.length}/${emails.length} emails`,
      sent: results.length,
      failed: failures.length,
      results,
      failures
    });
  } catch (error) {
    res.status(500).json({ error: 'Bulk send failed', details: error.message });
  }
};

// 3. Send Email from Template
const sendTemplateEmail = async (req, res) => {
  try {
    const { recipientEmail, template, templateVariables = {}, metadata = {} } = req.body;

    if (!template || !emailTemplates[template]) {
      return res.status(400).json({ error: `Template '${template}' not found` });
    }

    const auditLog = createEmailAuditLog({
      recipientEmail,
      subject: emailTemplates[template].subject,
      template,
      status: 'pending',
      metadata
    });

    const rendered = renderTemplate(template, templateVariables);

    await transporter.sendMail({
      from: process.env.FROM_EMAIL || 'noreply@app.local',
      to: recipientEmail,
      subject: rendered.subject,
      html: rendered.body
    });

    updateEmailAuditLog(auditLog.id, { status: 'sent' });

    res.status(201).json({
      success: true,
      message: 'Template email sent successfully',
      auditId: auditLog.id,
      template,
      email: recipientEmail
    });
  } catch (error) {
    res.status(500).json({ error: 'Failed to send template email', details: error.message });
  }
};

// 4. Get Email Audit Log
const getAuditLog = (req, res) => {
  try {
    const { id } = req.params;
    const log = getEmailAuditLog(parseInt(id));

    if (!log) {
      return res.status(404).json({ error: 'Audit log not found' });
    }

    res.json({ success: true, data: log });
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
};

// 5. Get All Audit Logs
const getAllAuditLogs = (req, res) => {
  try {
    const { status, template } = req.query;
    let logs = getAllEmailAuditLogs();

    if (status) {
      logs = getEmailsByStatus(status);
    }

    if (template) {
      logs = getEmailsByTemplate(template);
    }

    res.json({
      success: true,
      total: logs.length,
      data: logs
    });
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
};

// 6. Get Available Templates
const getAvailableTemplates = (req, res) => {
  try {
    const templates = Object.entries(emailTemplates).map(([key, template]) => ({
      key,
      ...template
    }));

    res.json({
      success: true,
      total: templates.length,
      templates
    });
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
};

// 7. Get Email Providers
const getAvailableProviders = (req, res) => {
  try {
    const providers = Object.entries(emailProviders).map(([key, provider]) => ({
      key,
      ...provider
    }));

    res.json({
      success: true,
      total: providers.length,
      providers
    });
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
};

// 8. Resend Failed Email
const resendFailedEmail = async (req, res) => {
  try {
    const { auditId } = req.params;
    const log = getEmailAuditLog(parseInt(auditId));

    if (!log) {
      return res.status(404).json({ error: 'Audit log not found' });
    }

    if (log.status === 'sent') {
      return res.status(400).json({ error: 'Email already sent successfully' });
    }

    // Resend the email
    const emailContent = emailTemplates[log.template]
      ? renderTemplate(log.template, {})
      : { subject: log.subject, body: '' };

    await transporter.sendMail({
      from: process.env.FROM_EMAIL || 'noreply@app.local',
      to: log.recipientEmail,
      subject: emailContent.subject || log.subject,
      html: emailContent.body
    });

    updateEmailAuditLog(parseInt(auditId), {
      status: 'sent',
      retryCount: (log.retryCount || 0) + 1
    });

    res.json({
      success: true,
      message: 'Email resent successfully',
      auditId,
      retryCount: (log.retryCount || 0) + 1
    });
  } catch (error) {
    updateEmailAuditLog(parseInt(auditId), {
      status: 'failed',
      failureReason: error.message
    });

    res.status(500).json({
      error: 'Failed to resend email',
      details: error.message
    });
  }
};

module.exports = {
  sendTransactionalEmail,
  sendBulkEmails,
  sendTemplateEmail,
  getAuditLog,
  getAllAuditLogs,
  getAvailableTemplates,
  getAvailableProviders,
  resendFailedEmail
};

