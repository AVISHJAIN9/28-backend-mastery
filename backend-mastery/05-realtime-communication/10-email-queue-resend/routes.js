const express = require('express');
const EmailQueueController = require('./controller');
module.exports = () => {
  const eq = new EmailQueueController();
  const r = express.Router();
  r.post('/send', async(req,res) => {
    const result = await eq.sendEmail(req.body);
    res.json(result);
  });
  return r;
};