const crypto = require('crypto');
const requestCache = new Map();

const deduplicationMiddleware = (req, res, next) => {
  if (req.method === 'GET' || req.method === 'HEAD') {
    return next();
  }

  const requestBody = JSON.stringify(req.body);
  const requestHash = crypto.createHash('sha256')
    .update(`${req.path}:${requestBody}:${req.ip}`)
    .digest('hex');

  const cached = requestCache.get(requestHash);
  if (cached && Date.now() - cached.timestamp < 5000) {
    return res.json(cached.response);
  }

  req.requestHash = requestHash;
  next();
};

module.exports = { deduplicationMiddleware };
