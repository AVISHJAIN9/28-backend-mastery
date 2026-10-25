const { v4: uuidv4 } = require('uuid');

const events = [];
const metrics = new Map();

class AnalyticsController {
  static async trackEvent(req, res) {
    try {
      const { eventType, userId, metadata } = req.body;
      const event = {
        id: uuidv4(),
        eventType,
        userId,
        metadata,
        timestamp: new Date()
      };
      events.push(event);
      res.status(201).json({ event });
    } catch (err) {
      res.status(500).json({ error: err.message });
    }
  }

  static async getMetrics(req, res) {
    try {
      const eventCounts = {};
      events.forEach(e => {
        eventCounts[e.eventType] = (eventCounts[e.eventType] || 0) + 1;
      });
      res.json({ metrics: eventCounts, totalEvents: events.length });
    } catch (err) {
      res.status(500).json({ error: err.message });
    }
  }

  static async getDashboard(req, res) {
    try {
      const today = new Date();
      const dailyEvents = events.filter(e => {
        const d = new Date(e.timestamp);
        return d.toDateString() === today.toDateString();
      }).length;
      
      res.json({
        totalEvents: events.length,
        dailyEvents,
        uniqueUsers: new Set(events.map(e => e.userId)).size
      });
    } catch (err) {
      res.status(500).json({ error: err.message });
    }
  }
}
module.exports = AnalyticsController;