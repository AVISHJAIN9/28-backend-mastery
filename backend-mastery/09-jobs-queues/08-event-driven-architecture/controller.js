/**
 * Event-Driven Architecture Controller
 * Pub/Sub pattern with EventEmitter
 */

const EventEmitter = require('events');

// Global event bus
const eventBus = new EventEmitter();
const eventLog = [];
const subscribers = {};

/**
 * Publish an event
 */
exports.publishEvent = async (req, res) => {
  try {
    const { eventName, data, source } = req.body;

    // Log event
    eventLog.push({
      timestamp: new Date(),
      eventName,
      data,
      source,
      subscriberCount: eventBus.listenerCount(eventName)
    });

    // Emit event
    eventBus.emit(eventName, { data, timestamp: new Date() });

    res.status(201).json({
      success: true,
      eventName,
      publishedAt: new Date(),
      subscriberCount: eventBus.listenerCount(eventName)
    });
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
};

/**
 * Subscribe to an event
 */
exports.subscribeEvent = async (req, res) => {
  try {
    const { eventName, subscriberId } = req.body;

    if (!subscribers[eventName]) {
      subscribers[eventName] = [];
    }

    subscribers[eventName].push(subscriberId);

    // Set up listener
    eventBus.on(eventName, (event) => {
      console.log(`Event received: ${eventName} by ${subscriberId}`);
    });

    res.status(201).json({
      success: true,
      message: `Subscribed to ${eventName}`,
      eventName,
      subscriberId,
      totalSubscribers: subscribers[eventName].length
    });
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
};

/**
 * Get all events
 */
exports.getEvents = async (req, res) => {
  try {
    const events = eventBus.eventNames().map(name => ({
      eventName: name,
      subscribers: eventBus.listenerCount(name),
      listeners: subscribers[name] || []
    }));

    res.json({
      totalEvents: events.length,
      events
    });
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
};

/**
 * Get event log
 */
exports.getEventLog = async (req, res) => {
  try {
    const limit = parseInt(req.query.limit) || 50;
    const filter = req.query.eventName;

    let logs = eventLog;
    if (filter) {
      logs = logs.filter(l => l.eventName === filter);
    }

    res.json({
      total: logs.length,
      logs: logs.slice(-limit),
      limit
    });
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
};

/**
 * Get subscriber info
 */
exports.getSubscribers = async (req, res) => {
  try {
    const eventName = req.query.eventName;

    if (eventName) {
      res.json({
        eventName,
        subscribers: subscribers[eventName] || [],
        count: (subscribers[eventName] || []).length
      });
    } else {
      res.json({
        allSubscribers: subscribers,
        totalEvents: Object.keys(subscribers).length
      });
    }
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
};

/**
 * Get dashboard
 */
exports.getDashboard = async (req, res) => {
  try {
    const events = eventBus.eventNames();
    const totalSubscriptions = Object.values(subscribers).reduce((sum, arr) => sum + arr.length, 0);

    res.json({
      timestamp: new Date(),
      eventBusStats: {
        totalEventTypes: events.length,
        totalSubscriptions,
        totalEventsEmitted: eventLog.length,
        eventTypes: events
      },
      recentEvents: eventLog.slice(-10),
      eventBusHealth: 'Healthy'
    });
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
};

/**
 * Get architecture patterns
 */
exports.getPatterns = async (req, res) => {
  try {
    res.json({
      patterns: {
        pubSub: {
          description: 'Publish-Subscribe pattern',
          use: 'Loose coupling between publishers and subscribers',
          example: 'User registration triggers email, notification, analytics'
        },
        eventSourcing: {
          description: 'Store all changes as events',
          use: 'Complete audit trail, temporal queries',
          example: 'Banking transactions, order history'
        },
        cqrs: {
          description: 'Command Query Responsibility Segregation',
          use: 'Separate read and write models',
          example: 'Analytics system with eventual consistency'
        },
        sagaPattern: {
          description: 'Distributed transaction as choreography',
          use: 'Multi-step processes across services',
          example: 'Order → Payment → Shipment → Notification'
        }
      }
    });
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
};

