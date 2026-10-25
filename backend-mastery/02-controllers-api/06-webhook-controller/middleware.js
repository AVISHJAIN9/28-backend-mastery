// Webhook validation middleware
const validateRegisterWebhook = (req, res, next) => {
  const { url } = req.body;
  
  try {
    new URL(url);
  } catch {
    return res.status(400).json({ error: 'Invalid URL format' });
  }
  
  next();
};

const validateWebhookEvent = (req, res, next) => {
  const { eventType, data } = req.body;
  
  if (!eventType) {
    return res.status(400).json({ error: 'eventType is required' });
  }
  
  next();
};

module.exports = { validateRegisterWebhook, validateWebhookEvent };
