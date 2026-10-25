const express = require('express');
const AlertController = require('./controller');
module.exports = (app, server, io) => {
  const ac = new AlertController(io);
  const r = express.Router();
  r.post('/broadcast', (req, res) => {
    ac.broadcastSystemAlert(req.body);
    res.json({ sent: true });
  });
  r.post('/targeted', (req, res) => {
    ac.sendAlertToUsers(req.body, req.body.userIds);
    res.json({ sent: true });
  });
  return r;
};