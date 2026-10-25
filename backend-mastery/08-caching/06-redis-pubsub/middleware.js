/**
 * Redis Pub/Sub Middleware
 * Provides helpers and context for pub/sub operations
 */

const pubsubMiddleware = (req, res, next) => {
  req.pubsub = req.app.locals.pubsubController;
  next();
};

const validatePublishRequest = (req, res, next) => {
  const { channel, message } = req.body;
  if (!channel) {
    return res.status(400).json({ error: 'channel is required' });
  }
  if (!message) {
    return res.status(400).json({ error: 'message is required' });
  }
  next();
};

const validateBroadcastRequest = (req, res, next) => {
  const { roomId, messageType } = req.body;
  if (!roomId) {
    return res.status(400).json({ error: 'roomId is required' });
  }
  if (!messageType) {
    return res.status(400).json({ error: 'messageType is required' });
  }
  next();
};

const errorHandler = (err, req, res, next) => {
  console.error('Pub/Sub Error:', err);
  res.status(500).json({ error: err.message || 'Internal server error' });
};

module.exports = {
  pubsubMiddleware,
  validatePublishRequest,
  validateBroadcastRequest,
  errorHandler
};

