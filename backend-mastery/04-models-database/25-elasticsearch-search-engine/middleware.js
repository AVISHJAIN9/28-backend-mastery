const esErrorHandler = (err, req, res, next) => {
  if (err.statusCode === 400) {
    return res.status(400).json({ error: 'Elasticsearch query error' });
  }
  res.status(500).json({ error: err.message });
};
module.exports = esErrorHandler;