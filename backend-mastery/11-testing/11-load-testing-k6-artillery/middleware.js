const errorHandler = (err, req, res, next) => {
  console.error(err);
  res.status(500).json({ error: 'Server error' });
};

const validateUser = (req, res, next) => {
  if (req.body && req.body.email && req.body.name) next();
  else res.status(400).json({ error: 'Invalid data' });
};

module.exports = { errorHandler, validateUser };

