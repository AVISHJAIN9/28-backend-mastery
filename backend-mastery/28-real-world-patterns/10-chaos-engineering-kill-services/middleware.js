const { killSchema, latencySchema } = require('./schema');

const validateKill = (req, res, next) => {
  const { error } = killSchema.validate(req.body);
  if (error) return res.status(400).json({ error: error.details[0].message });
  next();
};

const validateLatency = (req, res, next) => {
  const { error } = latencySchema.validate(req.body);
  if (error) return res.status(400).json({ error: error.details[0].message });
  next();
};

module.exports = { validateKill, validateLatency };
