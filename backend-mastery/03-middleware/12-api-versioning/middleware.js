const versionMiddleware = (req, res, next) => {
  req.apiVersion = req.params.version || req.get('api-version') || 'v1';
  res.set('X-API-Version', req.apiVersion);
  next();
};

module.exports = { versionMiddleware };
