const express = require("express");
const router = express.Router();
const { submitErasureRequest, processErasureRequest, getErasureStatus } = require("./controller");
const { verifyErasureIdentity, requireAdmin } = require("./middleware");

// Submit erasure request (authenticated user, verified as self or admin)
router.post("/request", verifyErasureIdentity, submitErasureRequest);

// Check status of a request
router.get("/:requestId/status", getErasureStatus);

// Process (execute) erasure – admin only
router.post("/:requestId/process", requireAdmin, processErasureRequest);

module.exports = router;

// Mount this in your main app:
// const erasureRouter = require('./routes');
// app.use('/api/erasure', authMiddleware, erasureRouter);
