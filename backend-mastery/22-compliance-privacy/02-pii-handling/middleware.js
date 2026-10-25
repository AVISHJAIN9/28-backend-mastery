/**
 * PII Middleware – scrubs PII from request logs and API responses.
 */
const { autoMaskObject } = require("./masking");
const { classifyObjectFields } = require("./classifier");

/**
 * Middleware: mask PII in response JSON before sending to client.
 * Attach to routes where masked output is required (e.g. admin list endpoints).
 */
function maskResponsePII(req, res, next) {
  const originalJson = res.json.bind(res);
  res.json = (data) => {
    if (data && typeof data === "object" && !Array.isArray(data)) {
      return originalJson(autoMaskObject(data));
    }
    if (Array.isArray(data)) {
      return originalJson(data.map((item) => (typeof item === "object" ? autoMaskObject(item) : item)));
    }
    return originalJson(data);
  };
  next();
}

/**
 * Middleware: log PII classifications for incoming request body (audit logging).
 */
function auditRequestPII(req, res, next) {
  if (req.body && typeof req.body === "object") {
    const findings = classifyObjectFields(req.body);
    if (findings.length > 0) {
      console.info("[PII-AUDIT]", {
        path: req.path,
        method: req.method,
        piiFields: findings.map((f) => f.field),
        timestamp: new Date().toISOString(),
      });
    }
  }
  next();
}

module.exports = { maskResponsePII, auditRequestPII };
