class SanitizationController {
  static async testSanitization(req, res) {
    return res.json({
      success: true,
      message: 'Data sanitized successfully',
      received: req.body,
      clean: true
    });
  }
}

module.exports = SanitizationController;
