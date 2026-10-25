const express = require('express');
const EphemeralController = require('./controller');
module.exports = (app, io, redis) => {
  const ec = new EphemeralController(io, redis);
  const r = express.Router();
  r.post('/send', async(req,res) => {
    const result = await ec.sendEphemeralMessage(req.body);
    res.json(result);
  });
  return r;
};