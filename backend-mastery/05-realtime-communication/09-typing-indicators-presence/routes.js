const express = require('express');
const PresenceController = require('./controller');
module.exports = (app, io, redis) => {
  const pc = new PresenceController(io, redis);
  const r = express.Router();
  r.get('/active', (req,res) => res.json(pc.getActiveUsers()));
  return r;
};