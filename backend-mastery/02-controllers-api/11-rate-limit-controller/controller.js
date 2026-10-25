const { v4: uuidv4 } = require('uuid');

const rateLimitStore = new Map();

class RateLimitController {
  static getRateLimit(identifier, limit = 100, window = 60000) {
    const key = `${identifier}`;
    if (!rateLimitStore.has(key)) {
      rateLimitStore.set(key, { count: 0, resetTime: Date.now() + window });
    }
    
    const entry = rateLimitStore.get(key);
    if (Date.now() > entry.resetTime) {
      entry.count = 0;
      entry.resetTime = Date.now() + window;
    }
    
    return {
      count: entry.count,
      limit,
      remaining: Math.max(0, limit - entry.count),
      resetTime: entry.resetTime
    };
  }

  static async checkRateLimit(req, res) {
    try {
      const { identifier } = req.body;
      const rateLimit = this.getRateLimit(identifier, 100);
      res.json(rateLimit);
    } catch (err) {
      res.status(500).json({ error: err.message });
    }
  }

  static async incrementRateLimit(req, res) {
    try {
      const { identifier } = req.body;
      const key = identifier;
      if (!rateLimitStore.has(key)) {
        rateLimitStore.set(key, { count: 0, resetTime: Date.now() + 60000 });
      }
      
      const entry = rateLimitStore.get(key);
      entry.count++;
      
      res.json({ count: entry.count, remaining: 100 - entry.count });
    } catch (err) {
      res.status(500).json({ error: err.message });
    }
  }
}
module.exports = RateLimitController;