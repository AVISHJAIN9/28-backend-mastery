const { v4: uuidv4 } = require("uuid");
const db = require("./schema");
const { sendErasureAcknowledgement, sendErasureCompletion } = require("./middleware");

// POST /api/erasure/request
async function submitErasureRequest(req, res) {
  const { userId, reason } = req.body;

  if (!userId || !reason) {
    return res.status(400).json({ message: "userId and reason are required." });
  }

  try {
    // Check if user exists
    const user = await db.findUserById(userId);
    if (!user) {
      return res.status(404).json({ message: "User not found." });
    }

    // Check for existing pending request
    const existing = await db.findPendingErasureRequest(userId);
    if (existing) {
      return res.status(409).json({
        message: "An erasure request for this user is already pending.",
        requestId: existing.id,
      });
    }

    const requestId = uuidv4();
    const gracePeriodDays = parseInt(process.env.ERASURE_GRACE_PERIOD_DAYS || "30");
    const scheduledAt = new Date();
    scheduledAt.setDate(scheduledAt.getDate() + gracePeriodDays);

    await db.createErasureRequest({
      id: requestId,
      userId,
      reason,
      status: "pending",
      scheduledAt,
      createdAt: new Date(),
    });

    // Send acknowledgement email
    await sendErasureAcknowledgement({ user, requestId, scheduledAt });

    return res.status(201).json({
      message: `Erasure request submitted. Your data will be erased by ${scheduledAt.toDateString()}.`,
      requestId,
    });
  } catch (err) {
    console.error("submitErasureRequest error:", err);
    return res.status(500).json({ message: "Internal server error." });
  }
}

// POST /api/erasure/:requestId/process (internal / admin only)
async function processErasureRequest(req, res) {
  const { requestId } = req.params;

  try {
    const request = await db.findErasureRequestById(requestId);
    if (!request) {
      return res.status(404).json({ message: "Erasure request not found." });
    }
    if (request.status !== "pending") {
      return res.status(409).json({ message: `Request is already ${request.status}.` });
    }

    // 1. Anonymise/delete user PII
    await db.anonymiseUserData(request.userId);

    // 2. Delete related records
    await db.deleteUserRelatedData(request.userId);

    // 3. Mark request as completed
    await db.updateErasureRequest(requestId, { status: "completed", completedAt: new Date() });

    // 4. Send completion notification
    const user = await db.findUserById(request.userId);
    await sendErasureCompletion({ user, requestId });

    return res.json({ message: "User data erased successfully.", requestId });
  } catch (err) {
    console.error("processErasureRequest error:", err);
    return res.status(500).json({ message: "Internal server error." });
  }
}

// GET /api/erasure/:requestId/status
async function getErasureStatus(req, res) {
  const { requestId } = req.params;
  try {
    const request = await db.findErasureRequestById(requestId);
    if (!request) {
      return res.status(404).json({ message: "Request not found." });
    }
    return res.json({
      requestId: request.id,
      status: request.status,
      scheduledAt: request.scheduledAt,
      completedAt: request.completedAt || null,
    });
  } catch (err) {
    console.error("getErasureStatus error:", err);
    return res.status(500).json({ message: "Internal server error." });
  }
}

module.exports = { submitErasureRequest, processErasureRequest, getErasureStatus };
