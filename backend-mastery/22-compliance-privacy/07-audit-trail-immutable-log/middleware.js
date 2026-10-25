/**
 * Audit Trail Middleware
 * Automatically logs access to sensitive routes.
 */

const { audit } = require("./auditLogger");

/**
 * Log data access for any route that reads personal data.
 * Usage: router.get('/users/:id', logDataAccess('profile'), handler)
 */
function logDataAccess(dataType = "personal_data") {
  return async (req, res, next) => {
    const actorId = req.user?.id || "anonymous";
    const targetId = req.params?.userId || req.params?.id || null;
    const ip = req.ip || req.headers["x-forwarded-for"];
    try {
      await audit.dataAccess(actorId, targetId, [dataType], ip);
    } catch (err) {
      console.error("[AUDIT] Failed to log data access:", err.message);
    }
    next();
  };
}

/**
 * Log admin actions automatically.
 */
function logAdminAction(action) {
  return async (req, res, next) => {
    const actorId = req.user?.id || "unknown_admin";
    const targetId = req.params?.userId || req.params?.id || null;
    try {
      await audit.adminAction(actorId, action, targetId, { path: req.path, method: req.method });
    } catch (err) {
      console.error("[AUDIT] Failed to log admin action:", err.message);
    }
    next();
  };
}

/**
 * Log authentication events.
 */
function logAuthEvent() {
  return async (req, res, next) => {
    const ip = req.ip || req.headers["x-forwarded-for"];
    const originalSend = res.send.bind(res);
    res.send = async (body) => {
      try {
        const actorId = req.body?.userId || req.body?.email || "unknown";
        const success = res.statusCode < 400;
        await audit.authLogin(actorId, ip, success);
      } catch (err) {
        console.error("[AUDIT] Failed to log auth event:", err.message);
      }
      return originalSend(body);
    };
    next();
  };
}

module.exports = { logDataAccess, logAdminAction, logAuthEvent };
