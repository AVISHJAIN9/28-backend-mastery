const { v4: uuidv4 } = require('uuid');

class TracingController {
  static getTraceId(req, res) {
    res.json({
      correlationId: req.correlationId,
      method: req.method,
      path: req.path,
      timestamp: new Date(),
      userAgent: req.get('user-agent')
    });
  }
}

module.exports = TracingController;
