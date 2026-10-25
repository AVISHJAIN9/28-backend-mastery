const mongoSanitize = require('mongo-sanitize');

const sanitizationMiddleware = (req, res, next) => {
  if (typeof req.body === 'object') {
    Object.keys(req.body).forEach(key => {
      if (typeof req.body[key] === 'string') {
        req.body[key] = mongoSanitize(req.body[key]);
      }
    });
  }
  next();
};

module.exports = { sanitizationMiddleware };
