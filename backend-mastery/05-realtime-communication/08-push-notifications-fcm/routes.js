const express = require('express');
const FCMController = require('./controller');
module.exports = () => {
  const fc = new FCMController();
  const r = express.Router();
  r.post('/send', async(req,res) => {
    const result = await fc.sendNotification(req.body.deviceToken, req.body.notification);
    res.json(result);
  });
  r.post('/subscribe', async(req,res) => {
    await fc.subscribeToTopic(req.body.deviceToken, req.body.topic);
    res.json({ subscribed: true });
  });
  return r;
};