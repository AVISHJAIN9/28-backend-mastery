const mongooseErrorHandler = (err, req, res, next) => {
  if (err.name === 'MongooseValidationError') {
    return res.status(400).json({ error: 'Validation error', details: err.message });
  }
  if (err.name === 'CastError') {
    return res.status(400).json({ error: 'Invalid ID' });
  }
  res.status(500).json({ error: err.message });
};
module.exports = mongooseErrorHandler;