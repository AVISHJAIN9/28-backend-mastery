const nodemailer = require("nodemailer");

// ─── Email Transport ─────────────────────────────────────────────────────────

const transporter = nodemailer.createTransport({
  host: process.env.SMTP_HOST,
  port: parseInt(process.env.SMTP_PORT || "587"),
  auth: {
    user: process.env.SMTP_USER,
    pass: process.env.SMTP_PASS,
  },
});

// ─── Identity Verification Middleware ────────────────────────────────────────

/**
 * Ensure the authenticated user can only request erasure for their own account,
 * unless they are an admin.
 */
function verifyErasureIdentity(req, res, next) {
  const { userId } = req.body;
  const requestingUser = req.user; // set by auth middleware upstream

  if (!requestingUser) {
    return res.status(401).json({ message: "Authentication required." });
  }

  const isAdmin = requestingUser.role === "admin";
  const isSelf = requestingUser.id === userId;

  if (!isAdmin && !isSelf) {
    return res.status(403).json({ message: "You can only request erasure of your own data." });
  }

  next();
}

/**
 * Admin-only guard for processing erasure requests.
 */
function requireAdmin(req, res, next) {
  if (!req.user || req.user.role !== "admin") {
    return res.status(403).json({ message: "Admin access required." });
  }
  next();
}

// ─── Email Notifications ─────────────────────────────────────────────────────

async function sendErasureAcknowledgement({ user, requestId, scheduledAt }) {
  await transporter.sendMail({
    from: process.env.SMTP_USER,
    to: user.email,
    subject: "Your Data Erasure Request Has Been Received",
    text: `
Dear ${user.name || "User"},

We have received your request to erase your personal data (Request ID: ${requestId}).

Under GDPR Article 17, we will complete the erasure by ${scheduledAt.toDateString()}.

If you have any questions, please contact our Data Protection Officer at ${process.env.ERASURE_NOTIFY_EMAIL}.

Regards,
The Compliance Team
    `.trim(),
  });
}

async function sendErasureCompletion({ user, requestId }) {
  await transporter.sendMail({
    from: process.env.SMTP_USER,
    to: user.email,
    subject: "Your Personal Data Has Been Erased",
    text: `
Dear ${user.name || "User"},

Your data erasure request (Request ID: ${requestId}) has been completed.

Your personal data has been permanently removed from our systems as of ${new Date().toDateString()}.

Please note: some data may be retained where we have a legal obligation to do so.

Regards,
The Compliance Team
    `.trim(),
  });
}

module.exports = {
  verifyErasureIdentity,
  requireAdmin,
  sendErasureAcknowledgement,
  sendErasureCompletion,
};
