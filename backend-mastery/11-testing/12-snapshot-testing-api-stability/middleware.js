const errorHandler = (err, req, res, next) => {
  console.error(err);
  res.status(500).json({ error: 'An error occurred' });
};

const addTimestamp = (req, res, next) => {
  req.timestamp = Date.now();
  next();
};

module.exports = { errorHandler, addTimestamp };

