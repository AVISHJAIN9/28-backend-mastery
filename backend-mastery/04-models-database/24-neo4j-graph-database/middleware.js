const neo4jErrorHandler = (err, req, res, next) => {
  if (err.code === 'Neo.ClientError') {
    return res.status(400).json({ error: 'Neo4j client error' });
  }
  res.status(500).json({ error: err.message });
};
module.exports = neo4jErrorHandler;