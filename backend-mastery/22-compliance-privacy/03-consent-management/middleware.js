/**
 * Consent Middleware
 * Guards routes that require a specific consent to have been granted.
 */
const { hasConsent } = require("./consentService");

/**
 * Factory: returns middleware that checks for a specific consent category.
 * Usage: router.get('/send-newsletter', requireConsent('marketing_email'), handler)
 */
function requireConsent(category) {
  return async (req, res, next) => {
    const userId = req.user?.id;
    if (!userId) {
      return res.status(401).json({ message: "Authentication required." });
    }
    try {
      const granted = await hasConsent(userId, category);
      if (!granted) {
        return res.status(403).json({
          message: `This action requires consent for: ${category}. Please update your privacy preferences.`,
          category,
        });
      }
      next();
    } catch (err) {
      console.error("requireConsent error:", err);
      return res.status(500).json({ message: "Internal server error." });
    }
  };
}

module.exports = { requireConsent };
