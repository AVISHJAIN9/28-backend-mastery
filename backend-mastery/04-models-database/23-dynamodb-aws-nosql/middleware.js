const dynamoErrorHandler = (err, req, res, next) => {
  if (err.code === 'ValidationException') {
    return res.status(400).json({ error: 'DynamoDB validation error' });
  }
  res.status(500).json({ error: err.message });
};
module.exports = dynamoErrorHandler;