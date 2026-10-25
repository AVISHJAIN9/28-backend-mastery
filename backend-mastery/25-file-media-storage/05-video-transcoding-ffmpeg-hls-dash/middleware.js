const express = require('express');
const winston = require('winston');

const logger = winston.createLogger({
  level: 'info',
  format: winston.format.json(),
  transports: [
    new winston.transports.Console(),
    new winston.transports.File({ filename: 'video-transcode.log' })
  ]
});

const requestLogger = (req, res, next) => {
  logger.info(`${req.method} ${req.path}`);
  next();
};

const errorHandler = (err, req, res, next) => {
  logger.error('Error:', { error: err.message });
  res.status(500).json({ error: 'Internal error' });
};

module.exports = { requestLogger, errorHandler, logger };
