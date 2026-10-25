class RateLimitController {
  static async getRateLimitInfo(req, res) {
    return res.json({
      success: true,
      message: 'Rate limiting is active',
      rateLimit: req.rateLimit,
      remaining: req.rateLimit?.remaining,
      resetTime: new Date(req.rateLimit?.resetTime)
    });
  }
  
  static async testEndpoint(req, res) {
    return res.json({ 
      success: true, 
      message: 'Request successful', 
      timestamp: new Date().toISOString() 
    });
  }
}

module.exports = RateLimitController;
