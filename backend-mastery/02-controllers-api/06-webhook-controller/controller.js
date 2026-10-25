const crypto = require('crypto');
const { v4: uuidv4 } = require('uuid');

// In-memory stores
const webhooks = new Map(); // id -> webhook
const webhookEvents = new Map(); // id -> events
const webhookDeliveries = new Map(); // id -> deliveries

class WebhookController {
  // Register webhook endpoint
  static async registerWebhook(req, res) {
    try {
      const { url, events, secret, active } = req.body;

      if (!url) {
        return res.status(400).json({ error: 'url is required' });
      }

      const id = uuidv4();
      const webhookSecret = secret || crypto.randomBytes(32).toString('hex');

      const webhook = {
        id,
        url,
        events: events || ['*'],
        secret: webhookSecret,
        active: active !== false,
        createdAt: new Date(),
        updatedAt: new Date(),
        lastDelivery: null,
        failureCount: 0,
        successCount: 0
      };

      webhooks.set(id, webhook);
      webhookEvents.set(id, []);

      res.status(201).json({
        message: 'Webhook registered successfully',
        webhook: { ...webhook, secret: undefined } // Hide secret in response
      });
    } catch (err) {
      res.status(500).json({ error: err.message });
    }
  }

  // List all webhooks
  static async listWebhooks(req, res) {
    try {
      const allWebhooks = Array.from(webhooks.values()).map(w => ({
        ...w,
        secret: undefined
      }));

      res.json({ webhooks: allWebhooks });
    } catch (err) {
      res.status(500).json({ error: err.message });
    }
  }

  // Get webhook details
  static async getWebhook(req, res) {
    try {
      const { id } = req.params;

      const webhook = webhooks.get(id);
      if (!webhook) {
        return res.status(404).json({ error: 'Webhook not found' });
      }

      const events = webhookEvents.get(id) || [];
      const deliveries = webhookDeliveries.get(id) || [];

      res.json({
        webhook: { ...webhook, secret: undefined },
        recentEvents: events.slice(-10),
        deliveries: deliveries.slice(-10)
      });
    } catch (err) {
      res.status(500).json({ error: err.message });
    }
  }

  // Update webhook
  static async updateWebhook(req, res) {
    try {
      const { id } = req.params;
      const { url, events, active } = req.body;

      const webhook = webhooks.get(id);
      if (!webhook) {
        return res.status(404).json({ error: 'Webhook not found' });
      }

      if (url) webhook.url = url;
      if (events) webhook.events = events;
      if (active !== undefined) webhook.active = active;
      webhook.updatedAt = new Date();

      webhooks.set(id, webhook);

      res.json({
        message: 'Webhook updated successfully',
        webhook: { ...webhook, secret: undefined }
      });
    } catch (err) {
      res.status(500).json({ error: err.message });
    }
  }

  // Delete webhook
  static async deleteWebhook(req, res) {
    try {
      const { id } = req.params;

      if (!webhooks.has(id)) {
        return res.status(404).json({ error: 'Webhook not found' });
      }

      webhooks.delete(id);
      webhookEvents.delete(id);
      webhookDeliveries.delete(id);

      res.json({ message: 'Webhook deleted successfully' });
    } catch (err) {
      res.status(500).json({ error: err.message });
    }
  }

  // Send event to webhooks
  static async triggerEvent(req, res) {
    try {
      const { eventType, data } = req.body;

      if (!eventType) {
        return res.status(400).json({ error: 'eventType is required' });
      }

      const event = {
        id: uuidv4(),
        eventType,
        data: data || {},
        timestamp: new Date(),
        deliveries: []
      };

      let deliveredCount = 0;
      let failedCount = 0;

      // Send to all matching webhooks
      for (const [webhookId, webhook] of webhooks) {
        if (!webhook.active) continue;

        const isMatching = webhook.events.includes('*') || webhook.events.includes(eventType);
        if (!isMatching) continue;

        // Create delivery signature
        const payload = JSON.stringify(event);
        const signature = crypto
          .createHmac('sha256', webhook.secret)
          .update(payload)
          .digest('hex');

        const delivery = {
          id: uuidv4(),
          webhookId,
          eventId: event.id,
          status: 'pending',
          signature,
          timestamp: new Date(),
          attempts: 0,
          lastAttempt: null
        };

        // Simulate delivery (in production, use queue system)
        try {
          // Mock delivery
          delivery.status = 'success';
          delivery.attempts = 1;
          delivery.lastAttempt = new Date();
          webhook.successCount++;
          webhook.lastDelivery = new Date();
          deliveredCount++;

          if (!webhookDeliveries.has(webhookId)) {
            webhookDeliveries.set(webhookId, []);
          }
          webhookDeliveries.get(webhookId).push(delivery);
        } catch (err) {
          delivery.status = 'failed';
          delivery.error = err.message;
          webhook.failureCount++;
          failedCount++;
        }

        event.deliveries.push(delivery.id);
      }

      res.json({
        message: 'Event triggered successfully',
        event,
        summary: {
          delivered: deliveredCount,
          failed: failedCount
        }
      });
    } catch (err) {
      res.status(500).json({ error: err.message });
    }
  }

  // Get delivery details
  static async getDelivery(req, res) {
    try {
      const { id } = req.params;

      for (const deliveries of webhookDeliveries.values()) {
        const delivery = deliveries.find(d => d.id === id);
        if (delivery) {
          return res.json({ delivery });
        }
      }

      res.status(404).json({ error: 'Delivery not found' });
    } catch (err) {
      res.status(500).json({ error: err.message });
    }
  }

  // Retry delivery
  static async retryDelivery(req, res) {
    try {
      const { id } = req.params;

      for (const deliveries of webhookDeliveries.values()) {
        const delivery = deliveries.find(d => d.id === id);
        if (delivery) {
          delivery.attempts++;
          delivery.lastAttempt = new Date();
          delivery.status = 'success'; // Mock success
          return res.json({ message: 'Delivery retried', delivery });
        }
      }

      res.status(404).json({ error: 'Delivery not found' });
    } catch (err) {
      res.status(500).json({ error: err.message });
    }
  }
}

module.exports = WebhookController;
