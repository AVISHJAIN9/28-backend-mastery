const errorHandler = (err, req, res, next) => {
  console.error(err);
  res.status(500).json({ error: 'Internal server error' });
};

const validateRequestBody = (req, res, next) => {
  if (!req.body) return res.status(400).json({ error: 'Body required' });
  next();
};

module.exports = { errorHandler, validateRequestBody };

