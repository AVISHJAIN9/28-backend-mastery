const express = require('express');
const QueueController = require('./controller');
module.exports = (app, redis) => {
  const qc = new QueueController(redis);
  const r = express.Router();
  r.post('/jobs', async(req,res) => {
    const job = await qc.addJob(req.body.type, req.body.data);
    res.json({ jobId: job.id });
  });
  r.get('/stats', async(req,res) => res.json(await qc.getStats()));
  return r;
};